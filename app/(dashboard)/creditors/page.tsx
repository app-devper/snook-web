"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCreditors, getCreditorPayments, payCreditor } from "@/lib/snook-api";
import type { Creditor, CreditorPayment } from "@/types/snook";
import { toast } from "sonner";
import { fmt } from "@/lib/utils";

export default function CreditorsPage() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [filter, setFilter] = useState("");
  const [payDialog, setPayDialog] = useState(false);
  const [selectedCreditor, setSelectedCreditor] = useState<Creditor | null>(null);
  const [payments, setPayments] = useState<CreditorPayment[]>([]);
  const [payForm, setPayForm] = useState({ amount: 0, type: "CASH", note: "" });

  const load = () =>
    getCreditors(filter)
      .then((c) => setCreditors(c || []))
      .catch(() => toast.error("โหลดไม่สำเร็จ"));

  useEffect(() => { load(); }, [filter]);

  const openPay = async (c: Creditor) => {
    setSelectedCreditor(c);
    setPayForm({ amount: c.remaining, type: "CASH", note: "" });
    try { const p = await getCreditorPayments(c.id); setPayments(p || []); } catch { setPayments([]); }
    setPayDialog(true);
  };

  const handlePay = async () => {
    if (!selectedCreditor) return;
    try {
      await payCreditor(selectedCreditor.id, payForm);
      toast.success("บันทึกการชำระแล้ว");
      setPayDialog(false);
      load();
    } catch { toast.error("ไม่สำเร็จ"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ลูกหนี้</h1>
        <Select value={filter || "ALL"} onValueChange={(v) => setFilter(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทั้งหมด</SelectItem>
            <SelectItem value="PENDING">ค้างชำระ</SelectItem>
            <SelectItem value="PAID">ชำระแล้ว</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>ลูกค้า</TableHead><TableHead>จำนวน</TableHead><TableHead>ชำระแล้ว</TableHead><TableHead>คงเหลือ</TableHead><TableHead>สถานะ</TableHead><TableHead>จัดการ</TableHead></TableRow></TableHeader>
          <TableBody>
            {creditors.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.customerName}</TableCell>
                <TableCell>{fmt(c.amount)}</TableCell>
                <TableCell>{fmt(c.paidAmount)}</TableCell>
                <TableCell className="font-medium text-red-600">{fmt(c.remaining)}</TableCell>
                <TableCell><Badge variant={c.status === "PAID" ? "default" : "destructive"}>{c.status}</Badge></TableCell>
                <TableCell>
                  {c.status === "PENDING" && <Button size="sm" onClick={() => openPay(c)}>ชำระ</Button>}
                </TableCell>
              </TableRow>
            ))}
            {creditors.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">ไม่มีลูกหนี้</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>ชำระลูกหนี้: {selectedCreditor?.customerName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">คงเหลือ: <span className="font-bold text-red-600">{selectedCreditor ? fmt(selectedCreditor.remaining) : 0}</span></p>
            {payments.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded border p-2 text-sm">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between border-b py-1 last:border-0">
                    <span>{p.type} - {fmt(p.amount)}</span>
                    <span className="text-muted-foreground">{p.createdDate?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2"><Label>จำนวนเงิน</Label><Input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} /></div>
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select value={payForm.type} onValueChange={(v) => setPayForm({ ...payForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">เงินสด</SelectItem>
                  <SelectItem value="TRANSFER">โอนเงิน</SelectItem>
                  <SelectItem value="CREDIT">บัตรเครดิต</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>หมายเหตุ</Label><Input value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} /></div>
            <Button className="w-full" onClick={handlePay}>บันทึกการชำระ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
