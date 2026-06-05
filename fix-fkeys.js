const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  replacements.forEach(([search, replace]) => {
    content = content.replace(search, replace);
  });
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

// 1. dashboard/page.js (has both projects and posts)
replaceInFile('src/app/dashboard/page.js', [
  ["from('projects')\n        .select('*, profiles(", "from('projects')\n        .select('*, profiles!projects_user_id_fkey("],
  ["from('community_posts')\n        .select('*, profiles(", "from('community_posts')\n        .select('*, profiles!community_posts_user_id_fkey("]
]);

// 2. projects/page.js
replaceInFile('src/app/dashboard/projects/page.js', [
  ["from('projects')\n        .select('*, profiles(", "from('projects')\n        .select('*, profiles!projects_user_id_fkey("]
]);

// 3. projects/[id]/page.js
replaceInFile('src/app/dashboard/projects/[id]/page.js', [
  [".select('*, profiles(id, username", ".select('*, profiles!projects_user_id_fkey(id, username"]
]);

// 4. profile/[username]/page.js
replaceInFile('src/app/dashboard/profile/[username]/page.js', [
  ["from('projects')\n        .select('*, profiles(", "from('projects')\n        .select('*, profiles!projects_user_id_fkey("],
  [".select('projects(*, profiles(username", ".select('projects(*, profiles!projects_user_id_fkey(username"]
]);

// 5. saved/page.js
replaceInFile('src/app/dashboard/saved/page.js', [
  [".select('projects(*, profiles(username", ".select('projects(*, profiles!projects_user_id_fkey(username"],
  [".select('community_posts(*, profiles(username", ".select('community_posts(*, profiles!community_posts_user_id_fkey(username"]
]);

// 6. community/page.js
replaceInFile('src/app/dashboard/community/page.js', [
  ["from('community_posts')\n        .select('*, profiles(", "from('community_posts')\n        .select('*, profiles!community_posts_user_id_fkey("],
  ["from('community_posts').insert(newPost).select('*, profiles(", "from('community_posts').insert(newPost).select('*, profiles!community_posts_user_id_fkey("]
]);

// 7. PostComposer.jsx
replaceInFile('src/components/PostComposer.jsx', [
  [".select('*, profiles(username, full_name, avatar_url)').single()", ".select('*, profiles!community_posts_user_id_fkey(username, full_name, avatar_url)').single()"]
]);

// 8. CommentThread.jsx (community posts comments might have ambiguity? No, post_comments only has one fk)

console.log('All replacements done!');
