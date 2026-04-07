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

function isAdminPsid(psid: string, adminCsv: string): boolean {
  if (!adminCsv) return false;
  const list = adminCsv.split(',').map((s) => s.trim()).filter(Boolean);
  return list.includes(psid);
}

const HELP_TEXT = `📖 Comandos disponibles:

/post
Título aquí
---
Contenido del post.
Puede tener varios párrafos.

/list — últimos 5 posts con sus IDs
/publish <id> — publica un post (lo hace visible)
/unpublish <id> — vuelve borrador
/delete <id> — elimina un post
/cover <id> — adjunta una foto como portada (envía la imagen con este caption)
/image <id> — agrega una foto a la galería del post
/help — muestra esta ayuda`;

// ─────────────────────────────────────────────────────────────────────────────
// Command handlers
// ─────────────────────────────────────────────────────────────────────────────
async function handleTextCommand(
  text: string,
  senderPsid: string,
  env: Env,
  messenger: MessengerService
): Promise<void> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const blog = buildBlogService(env);

  // /help
  if (lower === '/help' || lower === '/start') {
    await messenger.sendText(senderPsid, HELP_TEXT);
    return;
  }

  // /list
  if (lower === '/list') {
    const posts = await blog.listAdmin();
    if (posts.length === 0) {
      await messenger.sendText(senderPsid, 'No hay posts todavía. Usa /post para crear el primero.');
      return;
    }
    const lines = posts.slice(0, 5).map((p, i) => {
      const status = p.isPublished ? '✅' : '📝';
      return `${i + 1}. ${status} ${p.title}\n   id: ${p.id}`;
    });
    await messenger.sendText(senderPsid, `Últimos posts:\n\n${lines.join('\n\n')}`);
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
      `✅ Post creado como borrador\n\n📌 ${created.title}\n🔗 slug: ${created.slug}\n🆔 id: ${created.id}\n\nSiguiente:\n• /cover ${created.id} (envía foto con este caption)\n• /publish ${created.id} cuando esté listo`
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
    await messenger.sendText(senderPsid, `✅ Publicado: ${updated.title}`);
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
    await messenger.sendText(senderPsid, `📝 Volvió a borrador: ${updated.title}`);
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
    await messenger.sendText(senderPsid, `🗑 Eliminado: ${deleted.title}`);
    return;
  }

  // /cover and /image without attachment → instruct
  if (lower.startsWith('/cover') || lower.startsWith('/image')) {
    await messenger.sendText(
      senderPsid,
      'ℹ️ Para usar este comando, envía la foto con el comando como caption (ej: /cover abc-123).'
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
    '👋 Hola Hermana Tarazona. Escribe /help para ver los comandos disponibles.'
  );
}

async function handleAttachmentCommand(
  caption: string,
  attachments: MessengerAttachment[],
  senderPsid: string,
  env: Env,
  messenger: MessengerService
): Promise<void> {
  const trimmed = caption.trim();
  const lower = trimmed.toLowerCase();
  const blog = buildBlogService(env);

  // Find the first image attachment
  const image = attachments.find((a) => a.type === 'image' && a.payload?.url);
  if (!image || !image.payload.url) {
    await messenger.sendText(senderPsid, '❗ No detecté ninguna imagen. Envíala como foto adjunta.');
    return;
  }

  const isCover = lower.startsWith('/cover');
  const isImage = lower.startsWith('/image');

  if (!isCover && !isImage) {
    await messenger.sendText(
      senderPsid,
      'ℹ️ Para guardar esta foto envíala con caption /cover <id> o /image <id>.'
    );
    return;
  }

  const command = isCover ? '/cover' : '/image';
  const postId = trimmed.slice(command.length).trim();
  if (!postId) {
    await messenger.sendText(senderPsid, `❗ Uso: ${command} <id>`);
    return;
  }

  // Verify post exists
  const post = await blog.getAdminById(postId);
  if (!post) {
    await messenger.sendText(senderPsid, '❌ Post no encontrado.');
    return;
  }

  // Download from FB CDN
  let downloaded;
  try {
    downloaded = await messenger.downloadAttachment(image.payload.url);
  } catch (err) {
    console.error('[messenger] download failed', err);
    await messenger.sendText(senderPsid, '❌ No pude descargar la imagen de Messenger.');
    return;
  }

  // Build R2 key and upload via binding
  const ext = downloaded.contentType.includes('png')
    ? 'png'
    : downloaded.contentType.includes('webp')
      ? 'webp'
      : 'jpg';
  const filename = `${Date.now()}.${ext}`;
  const key = blog.buildImageKey(postId, filename);

  await env.R2.put(key, downloaded.bytes, {
    httpMetadata: { contentType: downloaded.contentType },
  });

  if (isCover) {
    await blog.updatePost(postId, { coverImageKey: key });
    await messenger.sendText(senderPsid, `🖼 Portada actualizada para "${post.title}".`);
  } else {
    const nextOrder = post.gallery.length;
    await blog.addImageToPost(postId, key, nextOrder);
    await messenger.sendText(
      senderPsid,
      `📷 Imagen agregada a la galería de "${post.title}" (${nextOrder + 1} en total).`
    );
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

        // Log every PSID so admin can find their own ID for whitelist setup.
        console.log('[messenger] msg from PSID:', senderPsid, '| text:', msg.text ?? '(attachment)');

        // Authorization: only whitelisted PSIDs can run commands
        if (!isAdminPsid(senderPsid, c.env.MESSENGER_ADMIN_PSIDS)) {
          // Silent for non-admins to avoid spamming random users
          continue;
        }

        try {
          if (msg.attachments && msg.attachments.length > 0) {
            await handleAttachmentCommand(
              msg.text || '',
              msg.attachments,
              senderPsid,
              c.env,
              messenger
            );
          } else if (msg.text) {
            await handleTextCommand(msg.text, senderPsid, c.env, messenger);
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
