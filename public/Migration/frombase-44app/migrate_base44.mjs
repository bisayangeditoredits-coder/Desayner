import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import ws from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

const DEFAULT_PASSWORD = 'Creldesk123!';

async function parseCSV(filePath) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

function safeJSONParse(str, fallback = []) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (err) {
    return fallback;
  }
}

async function runMigration() {
  console.log('--- Starting Base44 Migration ---');

  const profilesFile = path.join(__dirname, 'PublicProfile_export.csv');
  const postsFile = path.join(__dirname, 'CommunityPost_export.csv');

  let base44Profiles = [];
  let base44Posts = [];

  if (fs.existsSync(profilesFile)) {
    console.log('Parsing PublicProfile_export.csv...');
    base44Profiles = await parseCSV(profilesFile);
  } else {
    console.warn('PublicProfile_export.csv not found!');
  }

  if (fs.existsSync(postsFile)) {
    console.log('Parsing CommunityPost_export.csv...');
    base44Posts = await parseCSV(postsFile);
  } else {
    console.warn('CommunityPost_export.csv not found!');
  }

  // 1. Fetch current auth users to know who exists
  let allAuthUsers = [];
  let page = 1;
  while (true) {
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page: page, perPage: 1000 });
    if (authErr) {
      console.error('Error fetching users:', authErr);
      return;
    }
    allAuthUsers = allAuthUsers.concat(authData.users);
    if (authData.users.length < 1000) break;
    page++;
  }

  const currentUsersByEmail = new Map();
  for (const u of allAuthUsers) {
    currentUsersByEmail.set(u.email.toLowerCase(), u);
  }

  // 2. Migrate Users
  const userMap = new Map(); // base44 user_email -> supabase user_id

  for (const bp of base44Profiles) {
    const email = bp.user_email?.trim().toLowerCase();
    if (!email) continue;

    let supabaseUserId = null;
    let isNew = false;

    if (currentUsersByEmail.has(email)) {
      console.log(`User already exists: ${email}`);
      supabaseUserId = currentUsersByEmail.get(email).id;
    } else {
      console.log(`Creating new user: ${email}`);
      // Create user
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
      });

      if (createErr) {
        console.error(`  Error creating user ${email}:`, createErr.message);
        continue;
      }
      
      supabaseUserId = newUser.user.id;
      isNew = true;
      
      // Wait for trigger to create profile
      await new Promise(r => setTimeout(r, 1000));
    }

    userMap.set(email, supabaseUserId);

    // Update profile for ALL users to ensure base44 profiles are populated
    const avatarUrl = bp.avatar || null;
    const coverUrl = bp.banner_image || null;
    let username = email.split('@')[0];
    
    console.log(`  Updating profile for user ${email}...`);
    const { error: profileErr } = await supabase.from('profiles').update({
      full_name: bp.full_name || username,
      username: username,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      bio: bp.bio || null,
    }).eq('id', supabaseUserId);

    if (profileErr) {
      console.error(`  Error updating profile for ${email}:`, profileErr.message);
    }
  }

  // 3. Migrate Posts to Projects (SKIPPED because already done)
  /*
  for (const post of base44Posts) {
    const title = post.title?.trim();
    if (!title) continue;

    const email = post.created_by?.trim().toLowerCase();
    const userId = userMap.get(email) || (currentUsersByEmail.get(email)?.id);

    if (!userId) {
      console.log(`Skipping post "${title}" because user ${email} not found.`);
      continue;
    }

    const imagesStr = post.images;
    const imagesArr = safeJSONParse(imagesStr, []);
    
    const coverUrl = imagesArr.length > 0 ? imagesArr[0] : null;
    
    const tagsStr = post.tags;
    let tagsArr = safeJSONParse(tagsStr, []);
    if (tagsArr.length === 1 && tagsArr[0].includes(' ')) {
      tagsArr = tagsArr[0].split(' ').map(t => t.replace('#', '').trim()).filter(Boolean);
    } else {
      tagsArr = tagsArr.map(t => t.replace('#', '').trim()).filter(Boolean);
    }

    console.log(`Migrating post: ${title}`);

    const { error: insertErr } = await supabase.from('projects').insert({
      user_id: userId,
      title: title,
      description: post.description || null,
      category: post.category || 'Design',
      tags: tagsArr,
      images: imagesArr,
      cover_url: coverUrl,
      thumbnail_url: coverUrl,
      published: true,
      likes_count: parseInt(post.likes) || 0,
      comments_count: parseInt(post.comment_count) || 0,
      created_at: post.created_date || new Date().toISOString(),
    });

    if (insertErr) {
      console.error(`  Error migrating post "${title}":`, insertErr.message);
    } else {
      console.log(`  Migrated post successfully.`);
    }
  }
  */

  console.log('--- Migration Completed ---');
}

runMigration().catch(console.error);
