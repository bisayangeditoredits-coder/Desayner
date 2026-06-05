async function fixUrls() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const oldUrl = 'https://your-custom-domain-or-r2-public-url.com';
  const newUrl = 'https://pub-81e604c97af54009872209493f3928cf.r2.dev';

  const res = await fetch(`${url}/rest/v1/projects?select=*`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const projects = await res.json();

  for (const p of projects) {
    let changed = false;
    let cover = p.cover_url;
    let images = p.images || [];

    if (cover && cover.includes(oldUrl)) {
      cover = cover.replace(oldUrl, newUrl);
      changed = true;
    }
    for (let i = 0; i < images.length; i++) {
      if (images[i].includes(oldUrl)) {
        images[i] = images[i].replace(oldUrl, newUrl);
        changed = true;
      }
    }
    if (changed) {
      console.log(`Fixing project: ${p.id}`);
      await fetch(`${url}/rest/v1/projects?id=eq.${p.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cover_url: cover, images })
      });
    }
  }
  console.log('Done fixing URLs in DB!');
}
fixUrls();
