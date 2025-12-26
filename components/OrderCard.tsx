import React from "react";
import { Order, PaymentStatus } from "../types";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { clsx } from "clsx";

interface OrderCardProps {
  order: Order;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, isSelected, onToggle }) => {
  const isUnpaid = order.paymentStatus === PaymentStatus.UNPAID;

  return (
    <div
      onClick={() => onToggle(order.id)}
      className={clsx(
        "bg-white rounded-lg shadow-sm border p-5 cursor-pointer transition-all hover:shadow-md h-full flex flex-col",
        isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200",
        isUnpaid && "border-l-4 border-l-red-500"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}} // Handled by parent div click
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
            style={{ colorScheme: "light" }}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-lg text-slate-800">#{order.id}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">{order.date}</span>
            </div>
            <div className="text-base font-bold text-slate-800 mt-1">{order.recipientName}</div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1 shrink-0">
          {isUnpaid ? (
            <span className="flex items-center gap-1 text-red-600 font-bold text-sm bg-red-50 px-2 py-1 rounded">
              <AlertCircle size={14} /> 未付款
            </span>
          ) : order.paymentStatus === PaymentStatus.PAID ? (
            <span className="flex items-center gap-1 text-green-600 font-medium text-sm bg-green-50 px-2 py-1 rounded">
              <CheckCircle2 size={14} /> 已付款
            </span>
          ) : (
             <span className="flex items-center gap-1 text-orange-600 font-medium text-sm bg-orange-50 px-2 py-1 rounded">
              <Clock size={14} /> {order.paymentStatus}
            </span>
          )}
          
          {/* Delivery Method */}
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[140px]">
             {order.deliveryMethod}
          </span>
          
          <span className="font-mono font-bold text-lg">${order.total}</span>
        </div>
      </div>

      <div className="text-base text-gray-800 mb-4 space-y-1.5 border-b border-gray-100 pb-4">
         <p className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">📞</span>
            <span className="font-semibold">{order.recipientPhone}</span>
         </p>
         <p className="flex items-start gap-2">
            <span className="text-gray-400 text-sm mt-1">📍</span>
            <span className="leading-snug">{order.formattedAddress}</span>
         </p>
      </div>

      <div className="flex-grow">
        <p className="text-sm font-bold text-gray-600 mb-3">訂購商品 ({order.items.length})</p>
        <ul className="space-y-3">
          {order.items.map((item, idx) => (
            <li key={idx} className="text-base flex justify-between items-start gap-4">
              <div className="flex-1">
                {/* Item Name - No truncation, Darker color */}
                <div className="text-slate-900 font-medium leading-normal">
                  {item.name}
                </div>
                {/* Variant - New line, darker gray */}
                {item.variant && (
                  <div className="text-gray-600 text-sm mt-1">
                    {item.variant}
                  </div>
                )}
              </div>
              {/* Quantity - Darker gray */}
              <span className="text-gray-700 font-mono font-medium whitespace-nowrap mt-0.5 bg-gray-50 px-2 rounded">
                x{item.quantity}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OrderCard;