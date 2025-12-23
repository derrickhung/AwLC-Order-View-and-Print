import React, { useState, useMemo } from "react";
import { parseAndGroupOrders } from "./utils";
import { Order, PaymentStatus } from "./types";
import OrderCard from "./components/OrderCard";
import PrintLayout from "./components/PrintLayout";
import { Printer, Upload, CheckSquare, Square, Search, FileUp, XCircle } from "lucide-react";
import clsx from "clsx";

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNPAID" | "PAID">("ALL");
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      if (csv) {
        const parsed = parseAndGroupOrders(csv);
        setOrders(parsed);
        setSelectedIds(new Set()); // Reset selection
      }
    };
    reader.readAsText(file);
    // Reset value to allow re-uploading same file
    e.target.value = '';
  };

  const handleClearOrders = () => {
    setOrders([]);
    setSelectedIds(new Set());
    setFileName("");
    setSearchTerm("");
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.includes(searchTerm) ||
        order.recipientName.includes(searchTerm) ||
        order.recipientPhone.includes(searchTerm);
        
      let matchesStatus = true;
      if (statusFilter === "UNPAID") {
        matchesStatus = order.paymentStatus === PaymentStatus.UNPAID;
      } else if (statusFilter === "PAID") {
        matchesStatus = order.paymentStatus === PaymentStatus.PAID || order.paymentStatus === PaymentStatus.PARTIAL;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const selectedOrdersData = useMemo(() => {
    return orders.filter((o) => selectedIds.has(o.id));
  }, [orders, selectedIds]);

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      alert("請至少選擇一張訂單進行列印");
      return;
    }
    window.print();
  };

  // Stats
  const unpaidCount = orders.filter(o => o.paymentStatus === PaymentStatus.UNPAID).length;

  return (
    <>
      {/* Screen View */}
      <div className="min-h-screen p-6 print:hidden bg-slate-50">
        <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              Wix 訂單出貨系統
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {fileName ? `當前檔案: ${fileName} • 總訂單: ${orders.length} • 未付款: ${unpaidCount}` : "請上傳 Wix 訂單 CSV 檔案"}
            </p>
          </div>
          <div className="flex gap-3">
             {orders.length > 0 && (
                <button 
                  onClick={handleClearOrders}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                >
                  <XCircle size={18} />
                  <span className="text-sm font-medium">清除</span>
                </button>
             )}
             <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 shadow-sm transition">
                <Upload size={18} className="text-gray-600" />
                <span className="text-sm font-medium">{orders.length > 0 ? "重新匯入 CSV" : "匯入 CSV"}</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
             </label>
             {orders.length > 0 && (
               <button
                onClick={handlePrint}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Printer size={18} />
                <span className="font-medium">列印 ({selectedIds.size})</span>
              </button>
             )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <FileUp size={48} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-700 mb-2">尚無訂單資料</h2>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                請從 Wix 後台匯出「未履行訂單」CSV 檔，<br/>並點擊下方按鈕匯入以開始作業。
              </p>
              <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 shadow-lg transition transform hover:-translate-y-0.5">
                <Upload size={20} />
                <span className="font-medium">選擇 CSV 檔案</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-2 z-10">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="搜尋編號、姓名、電話..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                    >
                        <option value="ALL">全部狀態</option>
                        <option value="PAID">已付款</option>
                        <option value="UNPAID">未付款</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                   <button onClick={toggleAll} className="flex items-center gap-1 hover:text-blue-600">
                     {selectedIds.size === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                     全選本頁 ({filteredOrders.length})
                   </button>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed">
                        無符合條件的訂單
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        isSelected={selectedIds.has(order.id)}
                        onToggle={toggleSelection}
                    />
                    ))
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Hidden Print View */}
      {selectedOrdersData.length > 0 && <PrintLayout orders={selectedOrdersData} />}
    </>
  );
}

export default App;