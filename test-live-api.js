async function checkLiveApi() {
  try {
    const res = await fetch('https://desayner.com/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'test.webp', contentType: 'image/webp', folder: 'test' })
    });
    console.log('Status:', res.status);
    console.log('Text:', await res.text());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
checkLiveApi();
