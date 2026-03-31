"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getTableSessionById, getSetting } from "@/lib/snook-api";
import type { TableSessionDetail, Setting } from "@/types/snook";
import { fmt } from "@/lib/utils";

function ReceiptContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [session, setSession] = useState<TableSessionDetail | null>(null);
  const [setting, setSetting] = useState<Setting>({ companyName: "", companyAddress: "", companyPhone: "", companyTaxId: "", receiptFooter: "", promptPayId: "" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    Promise.all([
      getTableSessionById(sessionId),
      getSetting(),
    ]).then(([s, st]) => {
      setSession(s);
      if (st) setSetting(st);
      setReady(true);
    }).catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    if (ready && session) {
      setTimeout(() => window.print(), 500);
    }
  }, [ready, session]);

  if (!session) return <div className="p-8 text-center">กำลังโหลด...</div>;

  const orders = session.orders || [];
  const payments = session.payments || [];
  const foodTotal = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="mx-auto max-w-[80mm] p-4 font-mono text-xs print:p-0">
      <style>{`
        @media print {
          @page { margin: 2mm; size: 80mm auto; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div className="text-center">
        <p className="text-sm font-bold">{setting.companyName || "Snooker Club"}</p>
        {setting.companyAddress && <p>{setting.companyAddress}</p>}
        {setting.companyPhone && <p>โทร: {setting.companyPhone}</p>}
        {setting.companyTaxId && <p>เลขประจำตัวผู้เสียภาษี: {setting.companyTaxId}</p>}
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <div className="space-y-0.5">
        <div className="flex justify-between"><span>โต๊ะ:</span><span className="font-bold">{session.tableName}</span></div>
        <div className="flex justify-between"><span>ประเภท:</span><span>{session.tableType}</span></div>
        <div className="flex justify-between"><span>เริ่ม:</span><span>{session.startTime?.slice(0, 16).replace("T", " ")}</span></div>
        {session.endTime && <div className="flex justify-between"><span>สิ้นสุด:</span><span>{session.endTime?.slice(0, 16).replace("T", " ")}</span></div>}
        <div className="flex justify-between"><span>ระยะเวลา:</span><span>{Math.round(session.durationMins)} นาที</span></div>
        <div className="flex justify-between"><span>อัตรา:</span><span>{session.ratePerHour}/ชม.</span></div>
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      <div className="flex justify-between font-bold">
        <span>ค่าโต๊ะ</span>
        <span>{fmt(session.tableCharge)}</span>
      </div>

      {orders.length > 0 && (
        <>
          <div className="my-1 border-t border-dotted border-gray-400" />
          <p className="font-bold">รายการ</p>
          {orders.map((o) => (
            <div key={o.id} className="flex justify-between">
              <span>{o.name} x{o.quantity}{o.discount > 0 ? ` (-${o.discount})` : ""}</span>
              <span>{fmt(o.total)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold">
            <span>ยอดอาหาร</span>
            <span>{fmt(foodTotal)}</span>
          </div>
        </>
      )}

      <div className="my-2 border-t border-dashed border-black" />

      <div className="space-y-0.5">
        <div className="flex justify-between"><span>รวมย่อย</span><span>{fmt(session.tableCharge + foodTotal)}</span></div>
        {session.promotionDiscount > 0 && <div className="flex justify-between"><span>โปรโมชั่น ({session.promotionName})</span><span>-{fmt(session.promotionDiscount)}</span></div>}
        {session.discount > 0 && <div className="flex justify-between"><span>ส่วนลด</span><span>-{fmt(session.discount)}</span></div>}
        <div className="flex justify-between text-sm font-bold">
          <span>ยอดรวม</span>
          <span>{fmt(session.grandTotal)}</span>
        </div>
      </div>

      {payments.length > 0 && (
        <>
          <div className="my-2 border-t border-dashed border-black" />
          <p className="font-bold">การชำระ</p>
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span>{p.type}{p.note ? ` (${p.note})` : ""}</span>
              <span>{fmt(p.amount)}</span>
            </div>
          ))}
        </>
      )}

      <div className="my-2 border-t border-dashed border-black" />

      {setting.promptPayId && <div className="text-center"><p>PromptPay: {setting.promptPayId}</p></div>}
      {setting.receiptFooter && <div className="mt-2 text-center"><p>{setting.receiptFooter}</p></div>}
      <div className="mt-2 text-center text-[10px] text-gray-400"><p>{new Date().toLocaleString()}</p></div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลด...</div>}>
      <ReceiptContent />
    </Suspense>
  );
}
