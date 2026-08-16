export function exportReportCSV(initialTab: string, data: any) {
  if (!data) return;
  const csvRows: string[] = [];

  if (initialTab === "inventory") {
    const rows = data.inventoryLevels || data.items || [];
    csvRows.push(["Item ID", "Item Name", "Category", "Current Stock", "Min Reorder Point", "Status"].join(","));
    rows.forEach((r: any) => {
      csvRows.push([
        `"${r.itemId || r.id || ""}"`,
        `"${r.itemName || r.name || ""}"`,
        `"${r.category || ""}"`,
        `"${r.currentStock || r.stockQuantity || 0}"`,
        `"${r.minReorderPoint || r.reorderLevel || 0}"`,
        `"${r.status || "Active"}"`,
      ].join(","));
    });
  } else if (initialTab === "procurement") {
    const rows = data.orders || data.purchaseOrders || [];
    csvRows.push(["PO ID", "Supplier", "Issue Date", "ETA", "Status", "Total Amount"].join(","));
    rows.forEach((r: any) => {
      csvRows.push([
        `"${r.poId || r.id || ""}"`,
        `"${r.supplierName || r.companyName || ""}"`,
        `"${r.orderDate || ""}"`,
        `"${r.expectedArrivalDate || r.eta || ""}"`,
        `"${r.status || ""}"`,
        `"${r.totalAmount || 0}"`,
      ].join(","));
    });
  } else if (initialTab === "production") {
    const rows = data.batches || data.productionBatches || [];
    csvRows.push(["Batch ID", "Product", "Multiplier", "Estimated Qty", "Actual Qty", "Production Date", "Stage", "Status"].join(","));
    rows.forEach((r: any) => {
      csvRows.push([
        `"${r.batchId || r.id || ""}"`,
        `"${r.productName || ""}"`,
        `"${r.batchMultiplier || 1}"`,
        `"${r.estimatedQuantity || 0}"`,
        `"${r.actualQuantity || 0}"`,
        `"${r.productionDate || ""}"`,
        `"${r.stage || ""}"`,
        `"${r.status || ""}"`,
      ].join(","));
    });
  } else if (initialTab === "supplier") {
    const rows = data.vendorScorecard || data.suppliers || [];
    csvRows.push(["Supplier ID", "Supplier Name", "Total Orders", "On-Time Rate", "Fulfillment Rate", "Quality Pass Rate"].join(","));
    rows.forEach((r: any) => {
      csvRows.push([
        `"${r.supplierId || r.id || ""}"`,
        `"${r.supplierName || r.companyName || ""}"`,
        `"${r.totalOrders || 0}"`,
        `"${r.onTimeRate || "100%"}"`,
        `"${r.fulfillmentRate || "100%"}"`,
        `"${r.qualityPassRate || "100%"}"`,
      ].join(","));
    });
  } else if (initialTab === "distribution") {
    const rows = data.stockTransfers || data.transfers || [];
    csvRows.push(["Transfer ID", "Product", "Quantity", "Source", "Destination", "Status", "Transfer Date"].join(","));
    rows.forEach((r: any) => {
      csvRows.push([
        `"${r.transferId || r.id || ""}"`,
        `"${r.productName || r.itemName || ""}"`,
        `"${r.transferQuantity || r.quantity || 0}"`,
        `"${r.sourceLocationName || "Warehouse A"}"`,
        `"${r.destLocationName || "Store Branch"}"`,
        `"${r.status || ""}"`,
        `"${r.transferDate || ""}"`,
      ].join(","));
    });
  } else {
    csvRows.push(["Report", initialTab].join(","));
  }

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${initialTab}_report_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
