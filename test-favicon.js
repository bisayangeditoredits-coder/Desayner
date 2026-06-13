async function test() {
  const url = 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://wolt.com&size=128';
  const res = await fetch(url);
  console.log(res.status, res.headers.get('content-type'));
}
test();
