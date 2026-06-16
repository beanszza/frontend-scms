async function run() {
  const url = "http://localhost:5006/api/PurchaseOrders";
  
  // Try sending an ETA of today: 2026-06-09
  // The local time is 2026-06-09T15:44+08:00 (07:44 UTC)
  // Let's test with a date that represents "today" in local time but might be in the past in UTC, or just today's date
  const payload1 = {
    supplierId: 3, // Mama mo
    expectedArrivalDate: new Date("2026-06-09").toISOString(), // 2026-06-09T00:00:00Z
    paymentType: "Payable",
    totalAmount: 0,
    items: [{
      itemId: 5, // Ballpen
      poItemQuantity: 10
    }]
  };

  const payload2 = {
    supplierId: 3,
    expectedArrivalDate: new Date("2026-06-10").toISOString(), // 2026-06-10T00:00:00Z
    paymentType: "Payable",
    totalAmount: 0,
    items: [{
      itemId: 5,
      poItemQuantity: 10
    }]
  };

  try {
    const res1 = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload1)
    });
    const data1 = await res1.json();
    console.log("TEST 1 (ETA 2026-06-09):", res1.status, data1);
  } catch (e) {
    console.error("TEST 1 ERROR:", e);
  }

  try {
    const res2 = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload2)
    });
    const data2 = await res2.json();
    console.log("TEST 2 (ETA 2026-06-10):", res2.status, data2);
  } catch (e) {
    console.error("TEST 2 ERROR:", e);
  }
}
run();
