import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import ws from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

const profilesCsv = path.join(__dirname, 'profiles_rows.csv');
const projectsCsv = path.join(__dirname, 'projects_rows.csv');

// Categories mapping (fallback to Other if unknown)
const VALID_CATEGORIES = ['Design', 'Technology / SaaS', 'Photography', 'Illustration', 'Architecture', 'Business / Corporate', '3D', 'Fashion', 'Print', 'UI/UX', 'Other'];

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

async function migrate() {
  console.log('--- Starting Migration ---');

  // 1. Parse Data
  console.log('Parsing CSV files...');
  const profiles = await parseCSV(profilesCsv);
  const projects = await parseCSV(projectsCsv);
  console.log(`Found ${profiles.length} profiles and ${projects.length} projects.`);

  // 2. Migrate Profiles
  console.log('\n--- Migrating Profiles ---');
  const idMapping = {}; // Map old ID to new ID
  for (const p of profiles) {
    if (!p.id) {
        console.log(`Skipping invalid profile (no id): ${p.username}`);
        continue;
    }

    const email = p.email || `migrated_${p.username}@creldesk.local`;
    console.log(`Migrating user: ${email}`);

    let targetId = p.id;

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserById(p.id);
    // Actually, we need to check by email to get their NEW ID if they registered manually.
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    const existingByEmail = usersData?.users?.find(u => u.email === email);
    
    if (existingByEmail) {
        targetId = existingByEmail.id;
        console.log(`   User ${email} already exists with ID ${targetId}. Using new ID.`);
    } else {
        // Create auth user with old ID
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          id: targetId,
          email: email,
          password: 'Creldesk2026!',
          email_confirm: true,
          user_metadata: {
            username: p.username,
            full_name: p.display_name || p.full_name || p.username
          }
        });

        if (authError) {
            console.error(`   Error creating auth user ${email}:`, authError.message);
            continue;
        } else {
            console.log(`   Created auth.user successfully.`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Save mapping for projects
    idMapping[p.id] = targetId;

    // Prepare profile update
    const toolsParsed = p.tools && p.tools.startsWith('[') ? JSON.parse(p.tools) : [];
    const skillsParsed = p.skills && p.skills.startsWith('[') ? JSON.parse(p.skills) : [];

    const profileUpdate = {
        username: p.username,
        full_name: p.display_name || p.full_name || p.username,
        avatar_url: p.avatar_url || null,
        cover_url: p.cover_url || null,
        bio: p.bio || null,
        location: p.location || p.country || null,
        tools: toolsParsed
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', targetId);

    if (profileError) {
        console.error(`   Error updating public.profiles for ${email}:`, profileError.message);
    } else {
        console.log(`   Updated public.profiles successfully.`);
    }
  }

  // 3. Migrate Projects
  console.log('\n--- Migrating Projects ---');
  for (const proj of projects) {
    console.log(`Migrating project: ${proj.title}`);

    // Validate category
    let category = VALID_CATEGORIES.includes(proj.category) ? proj.category : 'Other';

    // Parse tools
    const toolsParsed = proj.tools && proj.tools.startsWith('[') ? JSON.parse(proj.tools) : [];

    // Parse status to published
    const published = proj.status === 'published' || proj.is_public === 'true';

    const newUserId = idMapping[proj.creator_id] || proj.creator_id;

    const projectData = {
        id: proj.id,
        user_id: newUserId,
        title: proj.title || 'Untitled',
        description: proj.description || null,
        category: category,
        thumbnail_url: proj.thumbnail_url || null,
        tools: toolsParsed,
        likes_count: parseInt(proj.like_count) || 0,
        views_count: parseInt(proj.view_count) || 0,
        comments_count: parseInt(proj.comment_count) || 0,
        saves_count: parseInt(proj.save_count) || 0,
        published: published,
        created_at: proj.created_at || new Date().toISOString()
    };

    // If there is canvas_data or video_url from old system, we ignore for now unless needed
    if (proj.video_url) {
        projectData.video_url = proj.video_url;
    }

    const { error: projError } = await supabase
      .from('projects')
      .upsert(projectData);

    if (projError) {
        console.error(`   Error inserting project ${proj.title}:`, projError.message);
    } else {
        console.log(`   Migrated project successfully.`);
    }
  }

  console.log('\n--- Migration Complete! ---');
}

migrate().catch(console.error);
