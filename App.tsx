
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { parseAndGroupOrders } from "./utils";
import { Order, PaymentStatus, ManualEntry } from "./types";
import OrderCard from "./components/OrderCard";
import PrintLayout from "./components/PrintLayout";
import PostOfficeLabelLayout from "./components/PostOfficeLabelLayout";
import { Printer, Upload, CheckSquare, Square, Search, FileUp, XCircle, Truck, ScrollText, Sparkles, Trash2, Loader2, Plus, StopCircle } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import clsx from "clsx";

const STORAGE_KEYS = {
  CSV: "wix_cached_csv",
  FILENAME: "wix_file_name",
  TIMESTAMP: "wix_upload_timestamp",
  MANUAL: "manual_entries_list"
};

function App() {
  const [activeTab, setActiveTab] = useState<"ORDERS" | "POSTAL" | "MANUAL">("ORDERS");
  const [orders, setOrders] = useState<Order[]>([]);
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNPAID" | "PAID">("ALL");
  const [fileName, setFileName] = useState<string>("");
  const [uploadTime, setUploadTime] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Manual Entry States
  const [rawInput, setRawInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [printType, setPrintType] = useState<"PACKING" | "POSTAL" | "MANUAL_POSTAL">("PACKING");

  // Load cached data
  useEffect(() => {
    const cachedCsv = localStorage.getItem(STORAGE_KEYS.CSV);
    const cachedFilename = localStorage.getItem(STORAGE_KEYS.FILENAME);
    const cachedTimestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
    const cachedManual = localStorage.getItem(STORAGE_KEYS.MANUAL);

    if (cachedCsv && cachedFilename) {
      const parsed = parseAndGroupOrders(cachedCsv);
      setOrders(parsed);
      setFileName(cachedFilename);
      if (cachedTimestamp) setUploadTime(cachedTimestamp);
    }

    if (cachedManual) {
      try {
        setManualEntries(JSON.parse(cachedManual));
      } catch (e) {
        console.error("Error parsing cached manual entries", e);
      }
    }
  }, []);

  // Save manual entries
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MANUAL, JSON.stringify(manualEntries));
  }, [manualEntries]);

  const processCsvData = (csvContent: string, name: string) => {
    const parsed = parseAndGroupOrders(csvContent);
    setOrders(parsed);
    setFileName(name);
    setSelectedIds(new Set());
    const now = new Date().toLocaleString("zh-TW");
    setUploadTime(now);
    try {
      localStorage.setItem(STORAGE_KEYS.CSV, csvContent);
      localStorage.setItem(STORAGE_KEYS.FILENAME, name);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, now);
    } catch (e) { console.warn(e); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      if (csv) processCsvData(csv, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DropEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const csv = event.target?.result as string;
          if (csv) processCsvData(csv, file.name);
        };
        reader.readAsText(file);
      } else alert("請上傳 CSV 格式檔案");
    }
  }, []);

  const handleClearOrders = () => {
    setOrders([]);
    setSelectedIds(new Set());
    setFileName(""); setUploadTime(""); setSearchTerm("");
    localStorage.removeItem(STORAGE_KEYS.CSV);
    localStorage.removeItem(STORAGE_KEYS.FILENAME);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    const currentList = activeTab === "MANUAL" ? manualEntries : filteredOrders;
    if (selectedIds.size === currentList.length && currentList.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentList.map(o => o.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`確定要刪除選取的 ${selectedIds.size} 筆資料嗎？`)) return;
    
    setManualEntries(prev => prev.filter(e => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
  };

  const handleParseManual = async () => {
    if (!rawInput.trim()) return;
    
    setIsParsing(true);
    abortControllerRef.current = new AbortController();
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `請從以下文字中提取收件資訊。文字可能包含多位收件人，請將其解析為 JSON 陣列。
        
        重要規則：
        1. 名字順序：如果偵測到名字是「名字 姓氏」格式（中間有空格），請務必顛倒順序改為「姓氏名字」（例如「靖雯 顧」改為「顧靖雯」）。
        2. 郵遞區號：請分析地址並自動推算台灣 3 碼郵遞區號。若無法確定具體路段，請填寫該行政區的通用郵遞區號。
        3. 地址格式：formattedAddress 欄位「必須」包含郵遞區號在最前面（例如：110 台北市信義區...）。
        4. 輸出物件應包含：recipientName, recipientPhone, formattedAddress, zipCode。
        
        文字內容：\n${rawInput}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                recipientName: { type: Type.STRING },
                recipientPhone: { type: Type.STRING },
                formattedAddress: { type: Type.STRING },
                zipCode: { type: Type.STRING },
              },
              required: ["recipientName", "recipientPhone", "formattedAddress"]
            }
          }
        }
      });

      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const parsed: Omit<ManualEntry, 'id'>[] = JSON.parse(response.text);
      const newEntries: ManualEntry[] = parsed.map(p => {
        // Double check and fix any remaining space/order issues
        const trimmedName = p.recipientName.trim();
        let finalName = "";
        if (trimmedName.includes(" ")) {
            // "Given Surname" -> "SurnameGiven"
            finalName = trimmedName.split(/\s+/).reverse().join("");
        } else {
            finalName = trimmedName;
        }

        // Logic to ensure zip code is present and at the start of address
        let finalZip = (p.zipCode || "").trim();
        let finalAddr = (p.formattedAddress || "").trim();

        // 1. If zip is empty, try to extract first 3 digits from address
        if (!finalZip) {
            const match = finalAddr.match(/^(\d{3})/);
            if (match) {
                finalZip = match[1];
            }
        }

        // 2. If we have a zip, ensure address starts with it
        if (finalZip && !finalAddr.startsWith(finalZip)) {
            finalAddr = `${finalZip} ${finalAddr}`;
        }
        
        return {
            ...p,
            recipientName: finalName.replace(/\s+/g, ""), // Ensure NO spaces
            id: `M-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            zipCode: finalZip,
            formattedAddress: finalAddr
        };
      });

      setManualEntries(prev => [...prev, ...newEntries]);
      setRawInput("");
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Parsing aborted');
      } else {
        console.error(e);
        alert("解析失敗，請檢查輸入內容或稍後再試。");
      }
    } finally {
      setIsParsing(false);
      abortControllerRef.current = null;
    }
  };

  const stopParsing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsParsing(false);
    }
  };

  const removeManualEntry = (id: string) => {
    setManualEntries(prev => prev.filter(e => e.id !== id));
    setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });
  };

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (activeTab === "POSTAL") result = result.filter(o => o.deliveryMethod === "國內宅配");
    return result.filter(o => 
      o.id.includes(searchTerm) || o.recipientName.includes(searchTerm) || o.recipientPhone.includes(searchTerm)
    );
  }, [orders, searchTerm, activeTab]);

  const selectedOrdersData = useMemo(() => {
    if (activeTab === "MANUAL") {
        return manualEntries.filter(e => selectedIds.has(e.id));
    }
    return orders.filter(o => selectedIds.has(o.id));
  }, [orders, manualEntries, selectedIds, activeTab]);

  const handlePrint = (type: "PACKING" | "POSTAL" | "MANUAL_POSTAL") => {
    if (selectedIds.size === 0) {
      alert("請至少選擇一筆資料進行列印");
      return;
    }
    setPrintType(type);
    setTimeout(() => window.print(), 100);
  };

  return (
    <>
      <div className="min-h-screen p-6 print:hidden bg-slate-50 flex flex-col">
        <header className="max-w-6xl mx-auto w-full mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">Wix 訂單出貨系統</h1>
                    <div className="text-gray-500 text-sm mt-1">
                        {fileName ? <p>當前檔案: <span className="font-medium">{fileName}</span> ({uploadTime})</p> : <p>請上傳 Wix 訂單 CSV 檔案</p>}
                    </div>
                </div>
                {orders.length > 0 && <button onClick={handleClearOrders} className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2"><XCircle size={18} />清除資料</button>}
            </div>

            <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl max-w-fit mb-4">
                {[
                  { id: "ORDERS", label: "訂單列表", icon: ScrollText, color: "text-blue-600" },
                  { id: "POSTAL", label: "中華郵政託運", icon: Truck, color: "text-green-600" },
                  { id: "MANUAL", label: "手動批次列印", icon: Sparkles, color: "text-purple-600" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setSearchTerm(""); setSelectedIds(new Set()); }}
                    className={clsx(
                        "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        activeTab === tab.id ? `bg-white ${tab.color} shadow-sm` : "text-gray-600 hover:bg-gray-300/50"
                    )}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
            </div>
        </header>

        <main className="max-w-6xl mx-auto w-full flex-grow">
          {activeTab === "MANUAL" ? (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-purple-600" />
                        批次解析收件資訊
                    </h3>
                    <textarea
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder="在此貼上收件資訊（不限格式）... 例如：&#10;林大壯 0912-345678 台北市信義區...&#10;收件人：王小美，電話：0987...，地址：高雄市..."
                        className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none mb-4 font-mono text-sm"
                    />
                    <div className="flex gap-3">
                        {!isParsing ? (
                            <button
                                onClick={handleParseManual}
                                disabled={!rawInput.trim()}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition shadow-md"
                            >
                                <Sparkles size={20} />
                                解析並加入列表
                            </button>
                        ) : (
                            <button
                                onClick={stopParsing}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-md"
                            >
                                <StopCircle size={20} className="animate-pulse" />
                                停止解析
                            </button>
                        )}
                        {isParsing && (
                            <div className="flex items-center gap-2 text-purple-600 font-medium">
                                <Loader2 className="animate-spin" size={20} />
                                AI 解析中...
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                {selectedIds.size > 0 && selectedIds.size === manualEntries.length ? <CheckSquare size={18} className="text-purple-600" /> : <Square size={18} />}
                                全選 ({manualEntries.length})
                            </button>
                            <span className="text-sm text-gray-500">已選取 {selectedIds.size} 筆</span>
                            
                            {selectedIds.size > 0 && (
                                <button 
                                    onClick={handleBatchDelete}
                                    className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition text-sm font-medium ml-2"
                                >
                                    <Trash2 size={16} />
                                    刪除選取
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => handlePrint("MANUAL_POSTAL")}
                            disabled={selectedIds.size === 0}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium transition"
                        >
                            <Printer size={18} />
                            列印中華郵政託運單
                        </button>
                    </div>

                    {/* Table Headers */}
                    {manualEntries.length > 0 && (
                        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center gap-4 text-sm font-bold text-gray-600 hidden md:flex">
                            <div className="w-5" /> {/* Spacer for checkbox */}
                            <div className="grid grid-cols-3 gap-4 flex-grow">
                                <div>收件人姓名</div>
                                <div>收件人手機</div>
                                <div>收件人地址</div>
                            </div>
                            <div className="w-9" /> {/* Spacer for delete button */}
                        </div>
                    )}

                    <div className="divide-y divide-gray-100">
                        {manualEntries.length === 0 ? (
                            <div className="p-20 text-center text-gray-400">
                                <Sparkles size={48} className="mx-auto mb-4 opacity-20" />
                                <p>尚未輸入任何資料</p>
                            </div>
                        ) : (
                            manualEntries.map(entry => (
                                <div key={entry.id} className={clsx("p-4 flex items-center gap-4 hover:bg-gray-50 transition", selectedIds.has(entry.id) && "bg-purple-50/50")}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(entry.id)}
                                        onChange={() => toggleSelection(entry.id)}
                                        className="w-5 h-5 rounded text-purple-600 shrink-0"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
                                        <div className="font-bold text-slate-800 flex items-center">{entry.recipientName}</div>
                                        <div className="font-mono text-gray-600 flex items-center">{entry.recipientPhone}</div>
                                        <div className="text-sm text-gray-500 leading-snug flex items-center">{entry.formattedAddress}</div>
                                    </div>
                                    <button onClick={() => removeManualEntry(entry.id)} className="p-2 text-gray-400 hover:text-red-600 transition shrink-0">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
          ) : orders.length === 0 ? (
            <div 
                className={clsx("flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed min-h-[400px]", isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300")}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
                <div className="p-4 bg-blue-50 rounded-full mb-4"><FileUp size={48} className="text-blue-500" /></div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">尚無訂單資料</h2>
                <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 shadow-lg transition">
                    <Upload size={20} />
                    <span className="font-medium">選擇 CSV 檔案</span>
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-2 z-10">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="搜尋姓名、電話..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white" />
                    </div>
                    {activeTab === "ORDERS" && (
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer">
                            <option value="ALL">全部狀態</option>
                            <option value="PAID">已付款</option>
                            <option value="UNPAID">未付款</option>
                        </select>
                    )}
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={toggleAll} className="flex items-center gap-1 text-gray-600 hover:text-blue-600 font-medium text-sm mr-2">
                     {selectedIds.size > 0 && selectedIds.size === filteredOrders.length ? <CheckSquare size={18} /> : <Square size={18} />}
                     全選 ({filteredOrders.length})
                   </button>
                   <button onClick={() => handlePrint(activeTab === "ORDERS" ? "PACKING" : "POSTAL")} disabled={selectedIds.size === 0} className={clsx("flex items-center gap-2 px-5 py-2.5 text-white rounded-lg shadow-md transition disabled:opacity-50", activeTab === "ORDERS" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700")}>
                        <Printer size={18} />
                        <span className="font-medium">列印{activeTab === "ORDERS" ? "出貨單" : "託運單"} ({selectedIds.size})</span>
                   </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {filteredOrders.map(order => <OrderCard key={order.id} order={order} isSelected={selectedIds.has(order.id)} onToggle={toggleSelection} />)}
              </div>
            </>
          )}
        </main>
      </div>

      {selectedOrdersData.length > 0 && (
          <>
            {activeTab !== "MANUAL" && printType === "PACKING" && <PrintLayout orders={selectedOrdersData as Order[]} />}
            {(activeTab === "MANUAL" || printType === "POSTAL" || printType === "MANUAL_POSTAL") && <PostOfficeLabelLayout orders={selectedOrdersData as any} />}
          </>
      )}
    </>
  );
}

export default App;
