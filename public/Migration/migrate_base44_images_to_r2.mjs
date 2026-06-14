/**
 * Copy legacy base44.app image URLs into Cloudflare R2 and update Supabase.
 *
 * Usage:
 *   node public/Migration/migrate_base44_images_to_r2.mjs           # dry run
 *   node public/Migration/migrate_base44_images_to_r2.mjs --execute
 */

import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const EXECUTE = process.argv.includes('--execute');
const BASE44 = 'base44.app';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

if (!supabaseUrl || !supabaseKey || !publicUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or R2_PUBLIC_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const urlCache = new Map();
const stats = { downloaded: 0, uploaded: 0, updated: 0, skipped: 0, failed: 0 };

function isBase44(url) {
  return typeof url === 'string' && url.includes(BASE44);
}

function extFromContentType(contentType, fallbackUrl) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  };
  const base = (contentType || '').split(';')[0].trim().toLowerCase();
  if (map[base]) return map[base];

  const match = fallbackUrl.match(/\.([a-z0-9]+)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : 'jpg';
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/webp,image/avif,image/apng,image/*,*/*;q=0.8',
      Referer: `${new URL(url).origin}/`,
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length === 0) {
    throw new Error('Empty response body');
  }

  return { buffer, contentType };
}

async function uploadToR2(key, buffer, contentType) {
  await R2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

async function migrateUrl(oldUrl) {
  if (!isBase44(oldUrl)) return oldUrl;
  if (urlCache.has(oldUrl)) return urlCache.get(oldUrl);

  const hash = createHash('sha256').update(oldUrl).digest('hex').slice(0, 20);

  try {
    console.log(`  ↓ ${oldUrl.slice(0, 90)}${oldUrl.length > 90 ? '…' : ''}`);
    const { buffer, contentType } = await downloadImage(oldUrl);
    stats.downloaded++;

    const ext = extFromContentType(contentType, oldUrl);
    const key = `migrated/base44/${hash}.${ext}`;
    const newUrl = `${publicUrl}/${key}`;

    if (EXECUTE) {
      await uploadToR2(key, buffer, contentType);
      stats.uploaded++;
    }

    urlCache.set(oldUrl, newUrl);
    console.log(`  → ${newUrl}`);
    return newUrl;
  } catch (err) {
    stats.failed++;
    console.error(`  ✗ Failed: ${err.message}`);
    urlCache.set(oldUrl, oldUrl);
    return oldUrl;
  }
}

async function migrateProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, cover_url')
    .or(`avatar_url.like.*${BASE44}*,cover_url.like.*${BASE44}*`);

  if (error) throw error;

  console.log(`\nProfiles with base44 URLs: ${data.length}`);

  for (const profile of data) {
    const updates = {};
    if (isBase44(profile.avatar_url)) {
      updates.avatar_url = await migrateUrl(profile.avatar_url);
    }
    if (isBase44(profile.cover_url)) {
      updates.cover_url = await migrateUrl(profile.cover_url);
    }

    const changed = Object.entries(updates).some(([field, url]) => url !== profile[field]);
    if (!changed) {
      stats.skipped++;
      continue;
    }

    if (EXECUTE) {
      const { error: updateErr } = await supabase.from('profiles').update(updates).eq('id', profile.id);
      if (updateErr) {
        stats.failed++;
        console.error(`  ✗ Profile @${profile.username}: ${updateErr.message}`);
        continue;
      }
    }

    stats.updated++;
    console.log(`  ✓ Profile @${profile.username}`);
  }
}

async function migrateProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, cover_url, thumbnail_url, images')
    .or(`cover_url.like.*${BASE44}*,thumbnail_url.like.*${BASE44}*`);

  if (error) throw error;

  console.log(`\nProjects with base44 URLs: ${data.length}`);

  for (const project of data) {
    const updates = {};

    if (isBase44(project.cover_url)) {
      updates.cover_url = await migrateUrl(project.cover_url);
    }
    if (isBase44(project.thumbnail_url)) {
      updates.thumbnail_url = await migrateUrl(project.thumbnail_url);
    }

    if (Array.isArray(project.images) && project.images.some(isBase44)) {
      updates.images = await Promise.all(
        project.images.map(async (url) => (isBase44(url) ? migrateUrl(url) : url))
      );
    }

    const changed =
      (updates.cover_url && updates.cover_url !== project.cover_url) ||
      (updates.thumbnail_url && updates.thumbnail_url !== project.thumbnail_url) ||
      (updates.images &&
        JSON.stringify(updates.images) !== JSON.stringify(project.images));

    if (!changed) {
      stats.skipped++;
      continue;
    }

    if (EXECUTE) {
      const { error: updateErr } = await supabase.from('projects').update(updates).eq('id', project.id);
      if (updateErr) {
        stats.failed++;
        console.error(`  ✗ Project "${project.title}": ${updateErr.message}`);
        continue;
      }
    }

    stats.updated++;
    console.log(`  ✓ Project "${project.title}"`);
  }
}

async function main() {
  console.log(EXECUTE ? '=== EXECUTING base44 → R2 migration ===' : '=== DRY RUN (pass --execute to apply) ===');
  console.log(`R2 bucket: ${BUCKET}`);
  console.log(`Public URL: ${publicUrl}`);

  await migrateProfiles();
  await migrateProjects();

  console.log('\n--- Summary ---');
  console.log(`Unique URLs processed: ${urlCache.size}`);
  console.log(`Downloaded: ${stats.downloaded}`);
  console.log(`Uploaded:   ${stats.uploaded}`);
  console.log(`Rows updated: ${stats.updated}`);
  console.log(`Skipped:    ${stats.skipped}`);
  console.log(`Failed:     ${stats.failed}`);

  if (!EXECUTE) {
    console.log('\nRe-run with --execute to apply changes.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
