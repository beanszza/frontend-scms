async function run() {
  const url1 = "http://localhost:5006/receipts/receipt_11_02a85b84-94ce-4231-89ce-9221b951135a.jpg";
  const url2 = "http://localhost:5001/api/scms/receipts/receipt_11_02a85b84-94ce-4231-89ce-9221b951135a.jpg";

  try {
    const res1 = await fetch(url1);
    console.log(`GET ${url1}:`, res1.status);
  } catch (e) {
    console.error("ERROR 1:", e.message);
  }

  try {
    const res2 = await fetch(url2);
    console.log(`GET ${url2}:`, res2.status);
  } catch (e) {
    console.error("ERROR 2:", e.message);
  }
}
run();
