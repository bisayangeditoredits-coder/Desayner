async function test() {
  const url = "https://res.cloudinary.com/djm2bk2ux/image/fetch/f_auto,q_auto/https%3A%2F%2Fpub-ca211370e5454548b8e0a213bda88b09.r2.dev%2Fprojects%2F672c9bed-b5a5-42d9-be93-ad01dc7052c1.png";
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log("Status:", res.status, res.statusText);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
