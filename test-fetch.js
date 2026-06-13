async function test() {
  try {
    await fetch(undefined);
  } catch(e) {
    console.log(e.name, e.message);
  }
}
test();
