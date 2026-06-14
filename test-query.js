async function test() {
  const query = 'newbie, graphic';
  const safeQuery = query.replace(/"/g, '""');
  const orCondition = `username.ilike."%${safeQuery}%",full_name.ilike."%${safeQuery}%",bio.ilike."%${safeQuery}%"`;
  const url = `https://evedqxhkmzpagqztrapq.supabase.co/rest/v1/profiles?select=id,username,full_name,bio&or=(${encodeURIComponent(orCondition)})&limit=5`;

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': 'sb_publishable_K0iLHJ6f2QabflegMwZoNg_Ry0VGInq',
        'Authorization': 'Bearer sb_publishable_K0iLHJ6f2QabflegMwZoNg_Ry0VGInq'
      }
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

test();
