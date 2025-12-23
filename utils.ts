import Papa from "papaparse";
import { Order, OrderItem, RawCsvRow } from "./types";

/**
 * Parses raw CSV string into a list of Order objects.
 * Handles grouping of items into single orders.
 */
export const parseAndGroupOrders = (csvString: string): Order[] => {
  const result = Papa.parse<RawCsvRow>(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  const ordersMap = new Map<string, Order>();

  result.data.forEach((row) => {
    // Basic validation
    if (!row["訂單編號"]) return;

    const orderId = row["訂單編號"];

    // Format Name: Swap "First Last" to "LastFirst" if space detected
    const rawName = row["收件者名稱"] || "";
    let formattedName = rawName;
    if (rawName.includes(" ")) {
      const parts = rawName.split(" ").filter(p => p.trim() !== "");
      if (parts.length === 2) {
        // Assume format is "First Last", swap to "LastFirst"
        formattedName = `${parts[1]}${parts[0]}`;
      } else if (parts.length > 2) {
         // Fallback for complex names, remove spaces
         formattedName = parts.join("");
      }
    }

    // Clean Phone: Remove all quotes and whitespace
    const rawPhone = row["收件者電話"] || "";
    const cleanPhone = rawPhone.replace(/["']/g, "").trim();

    // Format Address
    const rawZip = (row["送貨郵遞區號"] || "").replace(/["']/g, "").trim().substring(0, 3);
    const rawCity = (row["送貨城市"] || "").replace(/["']/g, "").trim();
    const rawAddr = (row["送貨地址"] || "").replace(/["']/g, "").trim();

    let fullAddressStr = rawAddr;
    
    // Smart merge of City and Address
    if (rawCity) {
        if (rawAddr.includes(rawCity)) {
            // Address already contains city info (e.g. "Tainan City ...")
            fullAddressStr = rawAddr;
        } else {
            // Concatenate
            fullAddressStr = `${rawCity}${rawAddr}`;
        }
    }
    
    // Remove "Taiwan" or "台灣" prefix if present (redundant for local delivery)
    fullAddressStr = fullAddressStr.replace(/^台灣/, "").replace(/^Taiwan/, "").trim();

    const formattedAddress = `${rawZip} ${fullAddressStr}`;

    const item: OrderItem = {
      name: row["項目"] || "未知商品",
      variant: row["變體"] || "",
      sku: row["SKU"] || "",
      quantity: parseInt(row["數量"] || "0", 10),
      price: parseFloat(row["價格"] || "0"),
    };

    if (ordersMap.has(orderId)) {
      // Add item to existing order
      ordersMap.get(orderId)?.items.push(item);
    } else {
      // Create new order
      ordersMap.set(orderId, {
        id: orderId,
        date: row["建立日期"],
        time: row["時間"],
        email: row["連絡電子郵件"],
        note: row["顧客備註"],
        deliveryMethod: row["送貨方式"],
        recipientName: formattedName,
        recipientPhone: cleanPhone,
        formattedAddress: formattedAddress,
        addressCity: rawCity,
        addressFull: rawAddr,
        zipCode: rawZip,
        paymentStatus: row["付款狀態"],
        shippingFee: parseFloat(row["運費"] || "0"),
        total: parseFloat(row["總計"] || "0"),
        items: [item],
      });
    }
  });

  return Array.from(ordersMap.values());
};