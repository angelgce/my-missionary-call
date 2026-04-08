import { Hono } from 'hono';

import type { Env } from '../worker';
import { getDb } from '../lib/db';
import { BlogRepository } from '../blog/blog.repository';
import { BlogService, R2Config } from '../blog/blog.service';
import { DiaryRepository } from '../diary/diary.repository';
import { DiaryService } from '../diary/diary.service';
import { AdviceRepository } from '../advice/advice.repository';
import { AdviceService } from '../advice/advice.service';
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

function buildAdviceService(env: Env): AdviceService {
  const db = getDb(env.DATABASE_URL);
  return new AdviceService(new AdviceRepository(db));
}

function buildDiaryService(env: Env): DiaryService {
  const db = getDb(env.DATABASE_URL);
  const repo = new DiaryRepository(db);
  const r2 = {
    endpoint: env.R2_ENDPOINT,
    bucketName: env.R2_BUCKET_NAME,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  };
  return new DiaryService(repo, r2);
}

/**
 * Resolve an entity ID to either a blog post or a diary entry.
 * Returns { kind, title } or null if not found in either table.
 */
async function resolveEntity(
  env: Env,
  id: string
): Promise<{ kind: 'blog' | 'diary'; title: string } | null> {
  const blog = buildBlogService(env);
  const post = await blog.getAdminById(id);
  if (post) return { kind: 'blog', title: post.title };

  const diary = buildDiaryService(env);
  const entry = await diary.getEntryWithImages(id);
  if (entry) {
    const date = new Date(entry.createdAt).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return { kind: 'diary', title: `Diario ${date}` };
  }
  return null;
}

/**
 * Resolve an image ID to either a blog gallery image or a diary image.
 */
async function resolveImageKind(
  env: Env,
  imageId: string
): Promise<'blog' | 'diary' | null> {
  const db = getDb(env.DATABASE_URL);
  const { blogPostImages, diaryEntryImages } = await import(
    '../database/drizzle-schema/schema.schema'
  );
  const { eq } = await import('drizzle-orm');

  const blogRows = await db
    .select({ id: blogPostImages.id })
    .from(blogPostImages)
    .where(eq(blogPostImages.id, imageId))
    .limit(1);
  if (blogRows.length > 0) return 'blog';

  const diaryRows = await db
    .select({ id: diaryEntryImages.id })
    .from(diaryEntryImages)
    .where(eq(diaryEntryImages.id, imageId))
    .limit(1);
  if (diaryRows.length > 0) return 'diary';

  return null;
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
📓 DIARIO PRIVADO (solo tú lo ves)
/diario
Lo que escribas hoy...

${SEP}
📋 GESTIÓN
🔹 /list — posts del blog
🔹 /dlist — entradas del diario
🔹 /publish <id> — hacer público (blog)
🔹 /unpublish <id> — volver borrador (blog)
🔹 /edit <id> — editar (blog o diario)
🔹 /delete <id> — eliminar (blog o diario)

${SEP}
💌 CONSEJOS RECIBIDOS
🔹 /consejos — ver consejos (5 por página)
🔹 /consejos 2 — página 2
🔹 /consejos 10-3 — 10 por página, página 3

${SEP}
📷 IMÁGENES (funcionan en blog o diario)
🔹 /image <id> start — abrir modo galería
🔹 /image <id> end — cerrar (o /end)
🔹 /images <id> — ver imágenes
🔹 /rmimg <imageId> — eliminar imagen

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
  kind: 'blog' | 'diary';
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
// Pending confirmation state (for "do you want to publish all?" type prompts)
// ─────────────────────────────────────────────────────────────────────────────
const PENDING_TTL_SECONDS = 5 * 60; // 5 minutes

interface PendingAction {
  action: 'publish_all';
}

function pendingKey(psid: string): string {
  return `messenger:pending:${psid}`;
}

async function getPending(env: Env, psid: string): Promise<PendingAction | null> {
  const raw = await env.KV.get(pendingKey(psid));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingAction;
  } catch {
    return null;
  }
}

async function setPending(env: Env, psid: string, action: PendingAction): Promise<void> {
  await env.KV.put(pendingKey(psid), JSON.stringify(action), {
    expirationTtl: PENDING_TTL_SECONDS,
  });
}

async function clearPending(env: Env, psid: string): Promise<void> {
  await env.KV.delete(pendingKey(psid));
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

  // /images <id> — list gallery (works for blog or diary)
  if (lower.startsWith('/images')) {
    const id = trimmed.slice('/images'.length).trim();
    if (!id) {
      await messenger.sendText(senderPsid, '❗ Uso: /images <id>');
      return;
    }
    const entity = await resolveEntity(env, id);
    if (!entity) {
      await messenger.sendText(senderPsid, '❌ ID no encontrado (ni en blog ni en diario).');
      return;
    }

    let gallery: { id: string }[] = [];
    if (entity.kind === 'blog') {
      const post = await blog.getAdminById(id);
      gallery = post?.gallery ?? [];
    } else {
      const diary = buildDiaryService(env);
      const entry = await diary.getEntryWithImages(id);
      gallery = entry?.gallery ?? [];
    }

    if (gallery.length === 0) {
      await messenger.sendText(
        senderPsid,
        `🖼 "${entity.title}"\n${SEP}\n\nSin imágenes aún.\n\nUsa /image ${id} start para agregar.`
      );
      return;
    }
    const lines = gallery.map((img, i) => `${i + 1}. 🆔 ${img.id}`);
    await messenger.sendText(
      senderPsid,
      `🖼 IMÁGENES DE "${entity.title}"\n${SEP}\n\n${lines.join('\n')}\n\nElimina con:\n/rmimg <imageId>`
    );
    return;
  }

  // /rmimg <imageId> — remove image (works for blog or diary)
  if (lower.startsWith('/rmimg')) {
    const imageId = trimmed.slice('/rmimg'.length).trim();
    if (!imageId) {
      await messenger.sendText(senderPsid, '❗ Uso: /rmimg <imageId>');
      return;
    }
    const kind = await resolveImageKind(env, imageId);
    if (!kind) {
      await messenger.sendText(senderPsid, '❌ Imagen no encontrada.');
      return;
    }
    if (kind === 'blog') {
      await blog.removeImage(imageId);
    } else {
      const diary = buildDiaryService(env);
      await diary.removeImage(imageId);
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

  // /publish [id] — smart: with no id, behaves based on number of drafts
  if (lower.startsWith('/publish')) {
    const id = trimmed.slice('/publish'.length).trim();

    if (id) {
      // Explicit ID — publish that one
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

    // No ID → check drafts
    const all = await blog.listAdmin();
    const drafts = all.filter((p) => !p.isPublished);

    if (drafts.length === 0) {
      await messenger.sendText(
        senderPsid,
        `📭 SIN BORRADORES\n${SEP}\n\nNo hay posts pendientes de publicar.`
      );
      return;
    }

    if (drafts.length === 1) {
      const only = drafts[0];
      const updated = await blog.updatePost(only.id, { isPublished: true });
      await messenger.sendText(
        senderPsid,
        `🚀 PUBLICADO\n${SEP}\n\n✅ "${updated?.title}"\n\nEra el único borrador.\nYa es visible en /blog`
      );
      return;
    }

    // Multiple drafts → list and ask
    const lines = drafts.map((p, i) => `${i + 1}. ${p.title}\n   🆔 ${p.id}`);
    await setPending(env, senderPsid, { action: 'publish_all' });
    await messenger.sendText(
      senderPsid,
      `📝 BORRADORES PENDIENTES (${drafts.length})\n${SEP}\n\n${lines.join('\n\n')}\n\n${SEP}\n¿Publicar todos?\n\n✅ Responde *si* para publicar todos\n📌 O envía /publish <id> para uno solo`
    );
    return;
  }

  // "si" / "sí" — confirm pending action
  if (lower === 'si' || lower === 'sí') {
    const pending = await getPending(env, senderPsid);
    if (!pending) {
      await messenger.sendText(senderPsid, 'ℹ️ No hay nada pendiente que confirmar.');
      return;
    }
    if (pending.action === 'publish_all') {
      await clearPending(env, senderPsid);
      const all = await blog.listAdmin();
      const drafts = all.filter((p) => !p.isPublished);
      let count = 0;
      for (const d of drafts) {
        await blog.updatePost(d.id, { isPublished: true });
        count++;
      }
      await messenger.sendText(
        senderPsid,
        `🚀 PUBLICADOS\n${SEP}\n\n✅ ${count} post${count === 1 ? '' : 's'} publicados.\nYa son visibles en /blog`
      );
      return;
    }
    await clearPending(env, senderPsid);
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

  // /delete <id> — works for blog or diary
  if (lower.startsWith('/delete')) {
    const id = trimmed.slice('/delete'.length).trim();
    if (!id) {
      await messenger.sendText(senderPsid, '❗ Uso: /delete <id>');
      return;
    }
    const entity = await resolveEntity(env, id);
    if (!entity) {
      await messenger.sendText(senderPsid, '❌ ID no encontrado.');
      return;
    }
    if (entity.kind === 'blog') {
      const deleted = await blog.deletePost(id);
      await messenger.sendText(
        senderPsid,
        `🗑 POST ELIMINADO\n${SEP}\n\n"${deleted?.title}"\n(También sus imágenes)`
      );
    } else {
      const diary = buildDiaryService(env);
      await diary.deleteEntry(id);
      await messenger.sendText(
        senderPsid,
        `🗑 ENTRADA DEL DIARIO ELIMINADA\n${SEP}\n\n${entity.title}\n(También sus imágenes)`
      );
    }
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

  // /image <id> start | /image <id> end — works for blog or diary
  if (lower.startsWith('/image') && !lower.startsWith('/images')) {
    const rest = trimmed.slice('/image'.length).trim();
    const match = rest.match(/^(\S+)(?:\s+(start|end|stop))?$/i);
    if (!match) {
      await messenger.sendText(
        senderPsid,
        '❗ Uso:\n/image <id> start  → inicia modo galería\n/image <id> end    → cierra (o /end)'
      );
      return;
    }
    const id = match[1];
    const action = (match[2] || 'start').toLowerCase();

    const entity = await resolveEntity(env, id);
    if (!entity) {
      await messenger.sendText(senderPsid, '❌ ID no encontrado (ni en blog ni en diario).');
      return;
    }

    if (action === 'end' || action === 'stop') {
      await clearState(env, senderPsid);
      await messenger.sendText(
        senderPsid,
        `✅ MODO CERRADO\n${SEP}\n\n"${entity.title}"`
      );
      return;
    }

    // start
    await setState(env, senderPsid, { postId: id, mode: 'gallery', kind: entity.kind });
    const label = entity.kind === 'diary' ? '📓 DIARIO' : '📌 BLOG';
    await messenger.sendText(
      senderPsid,
      `📸 MODO GALERÍA ACTIVO\n${SEP}\n\n${label}: "${entity.title}"\n\nEnvía las imágenes una por una.\nCuando termines:\n\n/end`
    );
    return;
  }

  // ───── DIARIO PRIVADO ─────

  // /diario (multiline) — create private diary entry
  if (lower.startsWith('/diario')) {
    const body = trimmed.slice('/diario'.length).trim();
    if (!body) {
      await messenger.sendText(
        senderPsid,
        `❗ Formato:\n\n/diario\nLo que quieras escribir...`
      );
      return;
    }

    const diary = buildDiaryService(env);
    const created = await diary.createEntry(body);
    const date = new Date(created.createdAt).toLocaleString('es-MX', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Mexico_City',
    });

    await messenger.sendText(
      senderPsid,
      `📓 ENTRADA GUARDADA\n${SEP}\n\n📅 ${date}\n🆔 ${created.id}\n\n${SEP}\nSIGUIENTE (opcional)\n\n📷 /image ${created.id} start\n   (para agregar fotos)`
    );
    return;
  }

  // /dlist — list diary entries
  if (lower === '/dlist') {
    const diary = buildDiaryService(env);
    const entries = await diary.listAll();
    if (entries.length === 0) {
      await messenger.sendText(
        senderPsid,
        `📭 Diario vacío\n${SEP}\n\nUsa /diario para escribir tu primera entrada.`
      );
      return;
    }
    const lines = entries.slice(0, 5).map((e, i) => {
      const date = new Date(e.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const preview = e.content.slice(0, 50).replace(/\n/g, ' ');
      const more = e.content.length > 50 ? '...' : '';
      return `${i + 1}. 📅 ${date}\n   "${preview}${more}"\n   🆔 ${e.id}`;
    });
    await messenger.sendText(
      senderPsid,
      `📓 ÚLTIMAS ENTRADAS\n${SEP}\n\n${lines.join('\n\n')}`
    );
    return;
  }

  // /edit <id> (multiline) — edit blog post or diary entry
  if (lower.startsWith('/edit') || lower.startsWith('/editar')) {
    const prefix = lower.startsWith('/editar') ? '/editar' : '/edit';
    const body = trimmed.slice(prefix.length).trim();
    const firstSpace = body.indexOf(' ');
    const firstNewline = body.indexOf('\n');
    // Separator is the first whitespace (space or newline)
    const sepIdx = [firstSpace, firstNewline].filter((i) => i >= 0).sort((a, b) => a - b)[0];
    if (sepIdx === undefined || sepIdx < 0) {
      await messenger.sendText(
        senderPsid,
        `❗ Formato:\n\n/edit <id>\nNuevo contenido\n\n(Para blog: primera línea = título, --- separador, resto = contenido)`
      );
      return;
    }
    const id = body.slice(0, sepIdx).trim();
    const newBody = body.slice(sepIdx + 1).trim();
    if (!id || !newBody) {
      await messenger.sendText(senderPsid, '❗ Falta id o contenido.');
      return;
    }

    const entity = await resolveEntity(env, id);
    if (!entity) {
      await messenger.sendText(senderPsid, '❌ ID no encontrado (ni en blog ni en diario).');
      return;
    }

    if (entity.kind === 'blog') {
      // Parse title + content like /post
      const lines = newBody.split('\n').map((l) => l.trimEnd());
      const newTitle = lines[0].trim();
      let contentLines = lines.slice(1);
      while (
        contentLines.length > 0 &&
        (contentLines[0].trim() === '' || contentLines[0].trim() === '---')
      ) {
        contentLines = contentLines.slice(1);
      }
      const newContent = contentLines.join('\n').trim();
      const excerpt = newContent.split('\n').find((l) => l.trim().length > 0)?.slice(0, 200) || '';

      await blog.updatePost(id, { title: newTitle, content: newContent, excerpt });
      await messenger.sendText(
        senderPsid,
        `✏️ POST ACTUALIZADO\n${SEP}\n\n📌 ${newTitle}\n🆔 ${id}`
      );
    } else {
      const diary = buildDiaryService(env);
      await diary.updateEntry(id, newBody);
      await messenger.sendText(
        senderPsid,
        `✏️ ENTRADA DEL DIARIO ACTUALIZADA\n${SEP}\n\n🆔 ${id}`
      );
    }
    return;
  }

  // /eliminar — alias of /delete
  if (lower.startsWith('/eliminar')) {
    const id = trimmed.slice('/eliminar'.length).trim();
    if (!id) {
      await messenger.sendText(senderPsid, '❗ Uso: /eliminar <id>');
      return;
    }
    const entity = await resolveEntity(env, id);
    if (!entity) {
      await messenger.sendText(senderPsid, '❌ ID no encontrado.');
      return;
    }
    if (entity.kind === 'blog') {
      const deleted = await blog.deletePost(id);
      await messenger.sendText(
        senderPsid,
        `🗑 POST ELIMINADO\n${SEP}\n\n"${deleted?.title}"\n(También sus imágenes)`
      );
    } else {
      const diary = buildDiaryService(env);
      await diary.deleteEntry(id);
      await messenger.sendText(
        senderPsid,
        `🗑 ENTRADA DEL DIARIO ELIMINADA\n${SEP}\n\n${entity.title}\n(También sus imágenes)`
      );
    }
    return;
  }

  // /consejos [page] or /consejos [size]-[page] — paginated advice viewer
  if (lower.startsWith('/consejos')) {
    const arg = trimmed.slice('/consejos'.length).trim();

    // Parse: "" | "N" | "S-P"
    let reqPageSize = 5;
    let reqPage = 1;
    if (arg) {
      const dashMatch = arg.match(/^(\d+)-(\d+)$/);
      if (dashMatch) {
        reqPageSize = parseInt(dashMatch[1], 10);
        reqPage = parseInt(dashMatch[2], 10);
      } else if (/^\d+$/.test(arg)) {
        reqPage = parseInt(arg, 10);
      } else {
        await messenger.sendText(
          senderPsid,
          `❗ Uso:\n/consejos — primera página (5 por página)\n/consejos 2 — página 2\n/consejos 10-3 — 10 por página, página 3`
        );
        return;
      }
    }

    const advice = buildAdviceService(env);
    const result = await advice.getPaginated(reqPage, reqPageSize);

    if (result.total === 0) {
      await messenger.sendText(
        senderPsid,
        `💌 SIN CONSEJOS\n${SEP}\n\nAún nadie ha dejado un consejo.`
      );
      return;
    }

    const lines = result.items.map((a, i) => {
      const date = new Date(a.createdAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      });
      const truncated =
        a.advice.length > 300 ? a.advice.slice(0, 300) + '...' : a.advice;
      return `${result.startIndex + i + 1}. 💌 ${a.guestName} · ${date}\n"${truncated}"`;
    });

    const header = `💌 CONSEJOS (${result.total} total)\n${SEP}\nPágina ${result.page} de ${result.totalPages}`;
    const navParts: string[] = [];
    if (result.page < result.totalPages) {
      navParts.push(`➡️ /consejos ${result.pageSize}-${result.page + 1}`);
    }
    if (result.page > 1) {
      navParts.push(`⬅️ /consejos ${result.pageSize}-${result.page - 1}`);
    }
    const footer =
      navParts.length > 0 ? `\n\n${SEP}\nNavegación:\n${navParts.join('\n')}` : '';

    await messenger.sendText(
      senderPsid,
      `${header}\n\n${lines.join('\n\n')}${footer}`
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
      'ℹ️ Recibí una imagen pero no estás en ningún modo.\n\nUsa primero:\n/image <id> start  (post)\n/dimg <id> start   (diario)'
    );
    return;
  }

  // ───── BLOG kind ─────
  if (state.kind === 'blog') {
    const blog = buildBlogService(env);
    const post = await blog.getAdminById(state.postId);
    if (!post) {
      await clearState(env, senderPsid);
      await messenger.sendText(senderPsid, '❌ El post asociado al modo activo ya no existe. Modo cerrado.');
      return;
    }

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
    if (errors.length > 0) reply += `\n\n⚠️ ${errors.length} fallaron.`;
    reply += `\n\n${SEP}\nSigue mandando fotos o /end para cerrar.`;
    await messenger.sendText(senderPsid, reply);
    return;
  }

  // ───── DIARY kind ─────
  if (state.kind === 'diary') {
    const diary = buildDiaryService(env);
    const entry = await diary.getEntryWithImages(state.postId);
    if (!entry) {
      await clearState(env, senderPsid);
      await messenger.sendText(senderPsid, '❌ La entrada del diario ya no existe. Modo cerrado.');
      return;
    }

    let added = 0;
    let nextOrder = entry.gallery.length;
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
        const key = diary.buildImageKey(state.postId, `diary_${Date.now()}_${nextOrder}.${ext}`);
        await env.R2.put(key, downloaded.bytes, {
          httpMetadata: { contentType: downloaded.contentType },
        });
        await diary.addImage(state.postId, key, nextOrder);
        nextOrder++;
        added++;
      } catch (err) {
        console.error('[messenger] diary image failed', err);
        errors.push(err instanceof Error ? err.message : 'unknown');
      }
    }

    let reply = `📷 FOTO DIARIO\n${SEP}\n\n+${added} foto${added === 1 ? '' : 's'} guardada${added === 1 ? '' : 's'}\n📊 Total: ${nextOrder}`;
    if (errors.length > 0) reply += `\n\n⚠️ ${errors.length} fallaron.`;
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
