fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ folder: 'projects/covers' })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
