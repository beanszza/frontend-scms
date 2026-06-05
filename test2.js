async function run() {
  const payloads = {
    item: { itemName: "TestItem", categoryId: 1, uomId: 1, minStockLevel: 10, maxStockLevel: 100, isActive: true },
    supplier: { companyName: "TestCompany", contactPerson: "John", email: "j@j.com", phone: "123", isActive: true },
    recipe: { productId: 1, outputQuantity: 1, notes: "", isActive: true, ingredients: [{ itemId: 1, uomId: 1, standardQuantity: 500 }] }
  };

  const tests = [
    { name: "POST Item", url: "http://localhost:5006/api/Items", method: "POST", body: payloads.item },
    { name: "POST Supplier", url: "http://localhost:5006/api/Suppliers", method: "POST", body: payloads.supplier },
    { name: "POST Recipe", url: "http://localhost:5006/api/Recipes", method: "POST", body: payloads.recipe }
  ];

  for (const t of tests) {
    try {
      const res = await fetch(t.url, {
        method: t.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t.body)
      });
      const text = await res.text();
      console.log(`[${res.status}] ${t.name}:`, text.substring(0, 200));
    } catch (e) {
      console.error(`ERROR ${t.name}:`, e.message);
    }
  }
}
run();
