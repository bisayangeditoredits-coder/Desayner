async function test() {
  const url = "https://pub-81e604c97af54009872209493f3928cf.r2.dev/inspirations/thumbs/453fe098-1e42-4213-bd7f-0b16070aa804/1b52f1b5-1223-40cb-acb1-3e0986387ad2.webp";
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log("Status:", res.status, res.statusText);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
