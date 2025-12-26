import React from "react";
import { Order, ManualEntry } from "../types";

interface Props {
  orders: (Order | ManualEntry)[];
}

const PostOfficeLabelLayout: React.FC<Props> = ({ orders }) => {
  // Hardcoded Sender Info from requirements
  const sender = {
    zip: "248",
    addr: "新北市五股區中興路一段 8 號 9 樓之 10",
    name: "Little Creator",
    phone: "02-89769619"
  };

  return (
    <div className="hidden print:block w-full">
      {orders.map((order) => (
        <div 
          key={order.id} 
          className="print-page relative bg-white text-black p-6 box-border flex flex-col"
          style={{ 
            pageBreakAfter: "always", 
            width: "148mm", // A6 Landscape Width
            height: "105mm", // A6 Landscape Height
            margin: "0 auto",
            fontSize: "16px",
            fontFamily: "'Noto Sans TC', sans-serif"
          }}
        >
            <div className="flex flex-col h-full">
                {/* 寄件人區塊 */}
                <div className="mb-2 border-b border-gray-300 pb-3">
                    <div className="font-bold text-2xl mb-1 text-gray-800">寄件人</div>
                    <div className="pl-1 space-y-1 text-lg">
                        <div className="flex items-center gap-2">
                             <span className="text-gray-600 whitespace-nowrap">郵遞區號：</span>
                             <span className="font-bold font-mono text-xl">{sender.zip}</span>
                        </div>
                        <div className="flex items-start gap-2">
                             <span className="text-gray-600 whitespace-nowrap mt-0.5">地址：</span>
                             <span className="break-all leading-snug">{sender.addr}</span>
                        </div>
                        <div className="flex items-baseline flex-wrap gap-x-6">
                             <div className="flex items-baseline gap-2">
                                <span className="text-gray-600 whitespace-nowrap">姓名：</span>
                                <span className="font-medium">{sender.name}</span>
                             </div>
                             <div className="flex items-baseline gap-2">
                                <span className="text-gray-600 whitespace-nowrap">寄件人電話：</span>
                                <span className="font-mono">{sender.phone}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 中間區塊：一般包裹標籤 + 收件人 + 備註 */}
                <div className="flex items-start gap-2 flex-grow pt-2">
                    {/* 左側紅色大字 */}
                    <div className="shrink-0 flex flex-col justify-start items-center text-red-600 font-bold text-4xl leading-tight select-none pt-4 w-24">
                        <div className="mb-1">一般</div>
                        <div>包裹</div>
                    </div>

                    {/* 右側：收件人 + 備註 */}
                    <div className="flex-grow flex flex-col gap-4">
                         {/* 收件人資訊 */}
                         <div>
                             <div className="font-bold text-2xl mb-2 text-gray-800">收件人</div>
                             <div className="pl-1 space-y-3">
                                <div className="flex items-start gap-2">
                                    <span className="text-gray-600 whitespace-nowrap mt-1 text-lg">地址：</span>
                                    <div className="font-bold text-2xl leading-snug break-all">
                                        {order.formattedAddress}
                                    </div>
                                </div>
                                <div className="flex items-baseline flex-wrap gap-x-8 gap-y-2">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-gray-600 whitespace-nowrap text-lg">姓名：</span>
                                        <span className="font-bold text-2xl">{order.recipientName}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-gray-600 whitespace-nowrap text-lg">電話：</span>
                                        <span className="font-mono text-2xl">{order.recipientPhone}</span>
                                    </div>
                                </div>
                            </div>
                         </div>

                         {/* 備註區塊 */}
                         <div className="text-sm text-gray-500 space-y-1 pl-1 pt-3 border-t border-dashed border-gray-300">
                            <p>內裝物品：貨樣</p>
                            <p>無法投遞處理方式：退回寄件人(另付退回費)</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      ))}
    </div>
  );
};

export default PostOfficeLabelLayout;