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
        "bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all hover:shadow-md",
        isSelected ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200",
        isUnpaid && "border-l-4 border-l-red-500"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}} // Handled by parent div click
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-slate-800">#{order.id}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{order.date}</span>
            </div>
            <div className="text-sm font-medium text-slate-700 mt-1">{order.recipientName}</div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
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
          <span className="font-mono font-bold">${order.total}</span>
        </div>
      </div>

      <div className="text-xs text-gray-600 mb-3 space-y-1">
         <p>📞 {order.recipientPhone}</p>
         <p>📍 {order.formattedAddress}</p>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">訂購商品 ({order.items.length})</p>
        <ul className="space-y-1.5">
          {order.items.map((item, idx) => (
            <li key={idx} className="text-sm flex justify-between items-start">
              <span className="text-slate-700 line-clamp-1 flex-1 pr-2">
                {item.name} 
                {item.variant && <span className="text-gray-400 ml-1 text-xs">({item.variant})</span>}
              </span>
              <span className="text-gray-500 whitespace-nowrap">x{item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OrderCard;