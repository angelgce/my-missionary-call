import { Hono } from 'hono';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { BlogRepository } from '../blog/blog.repository';
import { BlogService, R2Config } from '../blog/blog.service';
import { MessengerService } from './messenger.service';

// ─────────────────────────────────────────────────────────────────────────────
// Types for incoming Messenger webhook payload (only what we use)
// ─────────────────────────────────────────────────────────────────────────────
interface MessengerAttachment {
  type: string; // image, video, file, audio, location, fallback
  payload: { url?: string };
}

interface MessengerMessage {
  mid?: string;
  text?: string;
  attachments?: MessengerAttachment[];
  is_echo?: boolean;
}

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: MessengerMessage;
}

interface WebhookEntry {
  id: string;
  time: number;
  messaging?: MessagingEvent[];
}

interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildBlogService(env: Env): BlogService {
  const db = getDb(env.DATABASE_URL);
  const repo = new BlogRepository(db);
  const r2: R2Config = {
    endpoint: env.R2_ENDPOINT,
    bucketName: env.R2_BUCKET_NAME,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  };
  return new BlogService(repo, r2);
}

/**
 * Parse the admin map from MESSENGER_ADMINS env var.
 * Format: "psid1:Name1,psid2:Name2"
 * Falls back to MESSENGER_ADMIN_PSIDS (no names) if MESSENGER_ADMINS is empty.
 */
function parseAdmins(env: Env): Map<string, string> {
  const map = new Map<string, string>();
  const raw = (env.MESSENGER_ADMINS || '').trim();
  if (raw && raw !== 'PLACEHOLDER') {
    for (const entry of raw.split(',')) {
      const [psid, ...nameParts] = entry.trim().split(':');
      if (psid && nameParts.length > 0) {
        map.set(psid.trim(), nameParts.join(':').trim() || 'Admin');
      }
    }
    return map;
  }
  // Fallback: legacy CSV without names
  const legacy = (env.MESSENGER_ADMIN_PSIDS || '').trim();
  if (legacy && legacy !== 'PLACEHOLDER') {
    for (const psid of legacy.split(',').map((s) => s.trim()).filter(Boolean)) {
      map.set(psid, 'Admin');
    }
  }
  return map;
}

function getAdminName(env: Env, psid: string): string | null {
  return parseAdmins(env).get(psid) || null;
}

const SEP = '━━━━━━━━━━━━━';

const HELP_TEXT = `✨ DIARIO MISIONAL ✨
${SEP}

📝 CREAR POST
/post
Título aquí
---
Contenido del post.
Puede tener varios párrafos.

${SEP}
📋 GESTIÓN
🔹 /list — últimos 5 posts
🔹 /publish <id> — hacer público
🔹 /unpublish <id> — volver borrador
🔹 /delete <id> — eliminar post

${SEP}
📷 IMÁGENES
🔹 /image <id> start — abrir modo galería
🔹 /image <id> end — cerrar (o /end)
🔹 /images <id> — ver imágenes del post
🔹 /rmimg <imageId> — eliminar imagen

Las fotos rotan como portada automáticamente.

${SEP}
🛟 OTROS
🔹 /status — modo actual
🔹 /whoami — quién soy
🔹 /help — esta ayuda`;

// ─────────────────────────────────────────────────────────────────────────────
// Stateful image collection mode (KV-backed, 1h TTL)
// ─────────────────────────────────────────────────────────────────────────────
const STATE_TTL_SECONDS = 60 * 60; // 1 hour

interface ImageState {
  postId: string;
  mode: 'gallery';
}

function stateKey(psid: string): string {
  return `messenger:state:${psid}`;
}

async function getState(env: Env, psid: string): Promise<ImageState | null> {
  const raw = await env.KV.get(stateKey(psid));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImageState;
  } catch {
    return null;
  }
}

async function setState(env: Env, psid: string, state: ImageState): Promise<void> {
  await env.KV.put(stateKey(psid), JSON.stringify(state), {
    expirationTtl: STATE_TTL_SECONDS,
  });
}

async function clearState(env: Env, psid: string): Promise<void> {
  await env.KV.delete(stateKey(psid));
}

// ─────────────────────────────────────────────────────────────────────────────
// Command handlers
// ─────────────────────────────────────────────────────────────────────────────
async function handleTextCommand(
  text: string,
  senderPsid: string,
  adminName: string,
  env: Env,
  messenger: MessengerService
): Promise<void> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const blog = buildBlogService(env);

  // /help
  if (lower === '/help' || lower === '/start') {
    await messenger.sendText(senderPsid, `Hola, ${adminName} 💌\n\n${HELP_TEXT}`);
    return;
  }

  // /whoami
  if (lower === '/whoami') {
    await messenger.sendText(
      senderPsid,
      `👤 ${adminName}\n${SEP}\n\n✅ Autorizado`
    );
    return;
  }

  // /list
  if (lower === '/list') {
    const posts = await blog.listAdmin();
    if (posts.length === 0) {
      await messenger.sendText(
        senderPsid,
        `📭 Sin posts aún\n${SEP}\n\nUsa /post para crear el primero.`
      );
      return;
    }
    const lines = posts.slice(0, 5).map((p, i) => {
      const status = p.isPublished ? '✅ publicado' : '📝 borrador';
      return `${i + 1}. ${p.title}\n   ${status}\n   🆔 ${p.id}`;
    });
    await messenger.sendText(
      senderPsid,
      `📚 ÚLTIMOS POSTS\n${SEP}\n\n${lines.join('\n\n')}`
    );
    return;
  }

  // /images <id> — list gallery
  if (lower.startsWith('/images')) {
    const id = trimmed.slice('/images'.length).trim();
    if (!id) {
      await messenger.sendText(senderPsid, '❗ Uso: /images <id>');
      return;
    }
    const post = await blog.getAdminById(id);
    if (!post) {
      await messenger.sendText(senderPsid, '❌ Post no encontrado.');
      return;
    }
    if (post.gallery.length === 0) {
      await messenger.sendText(
        senderPsid,
        `🖼 "${post.title}"\n${SEP}\n\nSin imágenes aún.\n\nUsa /image ${id} start para agregar.`
      );
      return;
    }
    const lines = post.gallery.map(
      (img, i) => `${i + 1}. 🆔 ${img.id}`
    );
    await messenger.sendText(
      senderPsid,
      `🖼 IMÁGENES DE "${post.title}"\n${SEP}\n\n${lines.join('\n')}\n\nElimina con:\n/rmimg <imageId>`
    );
    return;
  }

  // /rmimg <imageId> — remove image
  if (lower.startsWith('/rmimg')) {
    const imageId = trimmed.slice('/rmimg'.length).trim();
    if (!imageId) {
      await messenger.sendText(senderPsid, '❗ Uso: /rmimg <imageId>');
      return;
    }
    const removed = await blog.removeImage(imageId);
    if (!removed) {
      await messenger.sendText(senderPsid, '❌ Imagen no encontrada.');
      return;
    }
    await messenger.sendText(senderPsid, `🗑 Imagen eliminada.`);
    return;
  }

  // /post (multiline)
  if (lower.startsWith('/post')) {
    const body = trimmed.slice('/post'.length).trim();
    if (!body) {
      await messenger.sendText(
        senderPsid,
        '❗ Formato:\n\n/post\nTítulo aquí\n---\nContenido del post.'
      );
      return;
    }

    // Parse: first line = title, then optional --- separator, rest = content
    const lines = body.split('\n').map((l) => l.trimEnd());
    const title = lines[0].trim();
    if (!title) {
      await messenger.sendText(senderPsid, '❗ Falta el título del post.');
      return;
    }

    let contentLines = lines.slice(1);
    // Strip leading separator/empty lines
    while (
      contentLines.length > 0 &&
      (contentLines[0].trim() === '' || contentLines[0].trim() === '---')
    ) {
      contentLines = contentLines.slice(1);
    }
    const content = contentLines.join('\n').trim();
    const excerpt = content.split('\n').find((l) => l.trim().length > 0)?.slice(0, 200) || '';

    // Estimate read time
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const readMin = Math.max(1, Math.round(wordCount / 200));
    const readTime = `${readMin} min`;

    const created = await blog.createPost({
      slug: '',
      title,
      excerpt,
      content,
      coverImageKey: '',
      readTime,
      isPublished: false,
    });

    await messenger.sendText(
      senderPsid,
      `✨ POST CREADO ✨\n${SEP}\n\n📌 ${created.title}\n🔗 ${created.slug}\n🆔 ${created.id}\n\n${SEP}\nSIGUIENTE PASO\n\n📷 /image ${created.id} start\n   (luego envía las fotos)\n\n🚀 /publish ${created.id}\n   (cuando esté listo)`
    );
    return;
  }

  // /publish <id>
  if (lower.startsWith('/publish')) {
    const id = trimmed.slice('/publish'.length).trim();
    if (!id) {
      await messenger.sendText(senderPsid, '❗ Uso: /publish <id>');
      return;
    }
    const updated = await blog.updatePost(id, { isPublished: true });
    if (!updated) {
      await messenger.sendText(senderPsid, '❌ Post no encontrado.');
      return;
    }
    await messenger.sendText(
      senderPsid,
      `🚀 PUBLICADO\n${SEP}\n\n✅ "${updated.title}"\n\nYa es visible en /blog`
    );
    return;
  }

  // /unpublish <id>
  if (lower.startsWith('/unpublish')) {
    const id = trimmed.slice('/unpublish'.length).trim();
    if (!id) {
      await messenger.sendText(senderPsid, '❗ Uso: /unpublish <id>');
      return;
    }
    const updated = await blog.updatePost(id, { isPublished: false });
    if (!updated) {
      await messenger.sendText(senderPsid, '❌ Post no encontrado.');
      return;
    }
    await messenger.sendText(
      senderPsid,
      `📝 VUELTO A BORRADOR\n${SEP}\n\n"${updated.title}"`
    );
    return;
  }

  // /delete <id>
  if (lower.startsWith('/delete')) {
    const id = trimmed.slice('/delete'.length).trim();
    if (!id) {
      await messenger.sendText(senderPsid, '❗ Uso: /delete <id>');
      return;
    }
    const deleted = await blog.deletePost(id);
    if (!deleted) {
      await messenger.sendText(senderPsid, '❌ Post no encontrado.');
      return;
    }
    await messenger.sendText(
      senderPsid,
      `🗑 ELIMINADO\n${SEP}\n\n"${deleted.title}"\n(También se borraron sus imágenes)`
    );
    return;
  }

  // /status — show current mode
  if (lower === '/status') {
    const state = await getState(env, senderPsid);
    if (!state) {
      await messenger.sendText(senderPsid, '🟢 Sin modo activo. Estás libre.');
    } else {
      await messenger.sendText(
        senderPsid,
        `🔵 Modo galería activo\n📌 Post: ${state.postId}\n\nManda /end para salir.`
      );
    }
    return;
  }

  // /end, /stop — exit any active mode
  if (lower === '/end' || lower === '/stop') {
    const state = await getState(env, senderPsid);
    if (!state) {
      await messenger.sendText(senderPsid, 'ℹ️ No estabas en ningún modo.');
      return;
    }
    await clearState(env, senderPsid);
    await messenger.sendText(senderPsid, '✅ Modo cerrado.');
    return;
  }

  // /image <id> start | /image <id> end
  if (lower.startsWith('/image')) {
    const rest = trimmed.slice('/image'.length).trim();
    // Parse: "<id> start" or "<id> end"
    const match = rest.match(/^(\S+)(?:\s+(start|end|stop))?$/i);
    if (!match) {
      await messenger.sendText(
        senderPsid,
        '❗ Uso:\n/image <id> start  → inicia modo galería\n/image <id> end    → cierra modo galería'
      );
      return;
    }
    const id = match[1];
    const action = (match[2] || 'start').toLowerCase();

    const post = await blog.getAdminById(id);
    if (!post) {
      await messenger.sendText(senderPsid, '❌ Post no encontrado.');
      return;
    }

    if (action === 'end' || action === 'stop') {
      await clearState(env, senderPsid);
      await messenger.sendText(
        senderPsid,
        `✅ MODO CERRADO\n${SEP}\n\n"${post.title}"`
      );
      return;
    }

    // start
    await setState(env, senderPsid, { postId: id, mode: 'gallery' });
    await messenger.sendText(
      senderPsid,
      `📸 MODO GALERÍA ACTIVO\n${SEP}\n\n📌 "${post.title}"\n\nEnvía las imágenes una por una.\nCuando termines:\n\n/end`
    );
    return;
  }

  // Unknown command starting with /
  if (trimmed.startsWith('/')) {
    await messenger.sendText(senderPsid, `❓ Comando no reconocido. Escribe /help para ver los disponibles.`);
    return;
  }

  // Plain message (not a command)
  await messenger.sendText(
    senderPsid,
    `👋 Hola, ${adminName}\n\nEscribe /help para ver los comandos disponibles.`
  );
}

async function handleAttachmentCommand(
  _caption: string,
  attachments: MessengerAttachment[],
  senderPsid: string,
  _adminName: string,
  env: Env,
  messenger: MessengerService
): Promise<void> {
  const blog = buildBlogService(env);

  // Filter all image attachments (Messenger may bundle multiple)
  const images = attachments.filter((a) => a.type === 'image' && a.payload?.url);
  if (images.length === 0) {
    return; // not an image, ignore silently
  }

  // Look up active state for this sender
  const state = await getState(env, senderPsid);
  if (!state) {
    await messenger.sendText(
      senderPsid,
      'ℹ️ Recibí una imagen pero no estás en ningún modo.\n\nUsa primero:\n/image <id> start'
    );
    return;
  }

  // Verify post still exists
  const post = await blog.getAdminById(state.postId);
  if (!post) {
    await clearState(env, senderPsid);
    await messenger.sendText(senderPsid, '❌ El post asociado al modo activo ya no existe. Modo cerrado.');
    return;
  }

  // ───── GALLERY mode: append all images, keep state ─────
  {
    let added = 0;
    let nextOrder = post.gallery.length;
    const errors: string[] = [];

    for (const image of images) {
      if (!image.payload.url) continue;
      try {
        const downloaded = await messenger.downloadAttachment(image.payload.url);
        const ext = downloaded.contentType.includes('png')
          ? 'png'
          : downloaded.contentType.includes('webp')
            ? 'webp'
            : 'jpg';
        const key = blog.buildImageKey(state.postId, `gallery_${Date.now()}_${nextOrder}.${ext}`);
        await env.R2.put(key, downloaded.bytes, {
          httpMetadata: { contentType: downloaded.contentType },
        });
        await blog.addImageToPost(state.postId, key, nextOrder);
        nextOrder++;
        added++;
      } catch (err) {
        console.error('[messenger] gallery image failed', err);
        errors.push(err instanceof Error ? err.message : 'unknown');
      }
    }

    let reply = `📷 IMAGEN AGREGADA\n${SEP}\n\n+${added} foto${added === 1 ? '' : 's'} en "${post.title}"\n📊 Total: ${nextOrder}`;
    if (errors.length > 0) {
      reply += `\n\n⚠️ ${errors.length} fallaron.`;
    }
    reply += `\n\n${SEP}\nSigue mandando fotos o /end para cerrar.`;
    await messenger.sendText(senderPsid, reply);
    return;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────
export const messengerRoutes = new Hono<{ Bindings: Env }>()
  // GET — webhook verification handshake from Meta
  .get('/webhook', (c) => {
    const mode = c.req.query('hub.mode');
    const token = c.req.query('hub.verify_token');
    const challenge = c.req.query('hub.challenge');

    if (mode === 'subscribe' && token === c.env.MESSENGER_VERIFY_TOKEN) {
      console.log('[messenger] webhook verified');
      return c.text(challenge ?? '', 200);
    }
    console.warn('[messenger] webhook verification failed', { mode, token });
    return c.text('Forbidden', 403);
  })

  // POST — incoming message events from Meta
  .post('/webhook', async (c) => {
    let payload: WebhookPayload;
    try {
      payload = await c.req.json<WebhookPayload>();
    } catch {
      return c.text('Bad Request', 400);
    }

    // ALWAYS respond 200 quickly so Meta doesn't retry; process inline since
    // Workers are short-lived and we don't have a queue here.
    if (payload.object !== 'page') {
      return c.text('EVENT_RECEIVED', 200);
    }

    const messenger = new MessengerService(c.env.MESSENGER_PAGE_ACCESS_TOKEN);

    for (const entry of payload.entry || []) {
      for (const event of entry.messaging || []) {
        const senderPsid = event.sender?.id;
        const msg = event.message;
        if (!senderPsid || !msg || msg.is_echo) continue;

        const adminName = getAdminName(c.env, senderPsid);

        // Log every PSID so admin can find their own ID for whitelist setup.
        console.log(
          '[messenger] msg from PSID:',
          senderPsid,
          '| admin:',
          adminName ?? 'NO',
          '| text:',
          msg.text ?? '(attachment)'
        );

        // ───── Pre-auth command: /connect — anyone can use it to get their PSID ─────
        // Useful so a new user can request their ID and send it to the admin for whitelisting.
        const textTrim = (msg.text || '').trim().toLowerCase();
        if (textTrim === '/connect' || textTrim === '/conect' || textTrim === '/id') {
          try {
            await messenger.sendText(
              senderPsid,
              `🔗 TU ID DE CONEXIÓN\n${SEP}\n\n${senderPsid}\n\n${SEP}\nCopia este código y envíaselo al administrador para que te dé acceso al bot.`
            );
          } catch {
            // ignore
          }
          continue;
        }

        // Authorization: only whitelisted PSIDs can run commands
        if (!adminName) {
          try {
            await messenger.sendText(
              senderPsid,
              `🔒 ACCESO RESTRINGIDO\n${SEP}\n\nEste es el bot privado del Diario Misional de la Hermana Tarazona.\n\nSi necesitas acceso, escribe /connect y comparte tu código con el administrador.`
            );
          } catch {
            // ignore
          }
          continue;
        }

        try {
          if (msg.attachments && msg.attachments.length > 0) {
            await handleAttachmentCommand(
              msg.text || '',
              msg.attachments,
              senderPsid,
              adminName,
              c.env,
              messenger
            );
          } else if (msg.text) {
            await handleTextCommand(msg.text, senderPsid, adminName, c.env, messenger);
          }
        } catch (err) {
          console.error('[messenger] handler error', err);
          try {
            await messenger.sendText(
              senderPsid,
              `❌ Error procesando comando: ${err instanceof Error ? err.message : 'unknown'}`
            );
          } catch {
            // ignore
          }
        }
      }
    }

    return c.text('EVENT_RECEIVED', 200);
  });
