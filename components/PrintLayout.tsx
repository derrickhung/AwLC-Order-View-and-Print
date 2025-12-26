import React from "react";
import { Order, PaymentStatus } from "../types";
import { AlertCircle } from "lucide-react";

interface PrintLayoutProps {
  orders: Order[];
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ orders }) => {
  return (
    <div className="hidden print:block w-full">
      {orders.map((order) => (
        <div
          key={order.id}
          className="print-page relative flex flex-col h-full bg-white text-black p-8 box-border"
          style={{ 
            pageBreakAfter: "always",
            width: "148mm", // A5 width
            height: "209mm", // A5 height
            margin: "0 auto"
          }}
        >
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-2 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">訂單出貨單</h1>
              <p className="text-sm mt-1">訂單編號: <span className="font-mono font-bold text-lg">{order.id}</span></p>
            </div>
            <div className="text-right">
              {/* Increased font size for date and time */}
              <p className="text-xl font-bold">{order.date} {order.time}</p>
              <p className="text-xs text-gray-500 mt-1">{order.deliveryMethod}</p>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="mb-6 p-4 border border-gray-300 rounded-lg">
            <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">收件人資訊</h2>
            <div className="grid grid-cols-2 gap-2 text-base">
              <div>
                <span className="text-gray-500 text-xs">姓名:</span>
                <div className="font-bold text-lg">{order.recipientName}</div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">電話:</span>
                <div className="font-mono">{order.recipientPhone}</div>
              </div>
            </div>
            <div className="mt-2">
                <span className="text-gray-500 text-xs">地址:</span>
                <div className="font-medium">{order.formattedAddress}</div>
            </div>
          </div>

          {/* Payment Alert - Only for Unpaid */}
          {order.paymentStatus === PaymentStatus.UNPAID && (
            <div className="mb-4 border-2 border-red-600 p-2 rounded flex items-center justify-center text-red-600 font-bold">
              <AlertCircle className="w-6 h-6 mr-2" />
              此訂單尚未付款
            </div>
          )}
          
          {order.note && (
             <div className="mb-4 border border-dashed border-gray-400 p-2 rounded bg-gray-50">
               <span className="text-xs font-bold text-gray-500">顧客備註:</span>
               <p className="text-sm">{order.note}</p>
             </div>
          )}

          {/* Items Table - No Prices */}
          <div className="flex-grow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="text-left py-1 w-5/6">商品名稱 / 變體</th>
                  <th className="text-right py-1 w-1/6">數量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item, idx) => (
                  <tr key={`${item.sku}-${idx}`}>
                    <td className="py-2 pr-2 align-top">
                      <div className="font-medium">{item.name}</div>
                      {item.variant && (
                        <div className="text-xs text-gray-500 mt-0.5">{item.variant}</div>
                      )}
                      {item.sku && (
                        <div className="text-[10px] text-gray-400 font-mono">{item.sku}</div>
                      )}
                    </td>
                    <td className="py-2 text-right align-top text-base font-bold">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer - Removed Prices */}
          <div className="mt-4 pt-2 border-t border-gray-800">
             <div className="text-[10px] text-center text-gray-400 mt-2">
                Thank you for your purchase!
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PrintLayout;