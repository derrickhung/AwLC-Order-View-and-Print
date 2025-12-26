export enum PaymentStatus {
  PAID = "已付款",
  UNPAID = "未付款",
  PARTIAL = "已部分付款"
}

export interface OrderItem {
  name: string;
  variant: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  time: string;
  email: string;
  note: string;
  deliveryMethod: string;
  recipientName: string; 
  recipientPhone: string;
  formattedAddress: string; 
  addressCity: string;
  addressFull: string;
  zipCode: string;
  paymentStatus: string;
  shippingFee: number;
  total: number;
  items: OrderItem[];
}

export interface ManualEntry {
  id: string;
  recipientName: string;
  recipientPhone: string;
  formattedAddress: string;
  zipCode: string;
}

// Raw structure from CSV
export interface RawCsvRow {
  "訂單編號": string;
  "建立日期": string;
  "時間": string;
  "總訂單數量": string;
  "連絡電子郵件": string;
  "顧客備註": string;
  "項目": string;
  "變體": string;
  "SKU": string;
  "數量": string;
  "價格": string;
  "送貨方式": string;
  "收件者名稱": string;
  "收件者電話": string;
  "送貨城市": string;
  "送貨地址": string;
  "送貨郵遞區號": string;
  "付款狀態": string;
  "運費": string;
  "總計": string;
  "淨額": string;
}