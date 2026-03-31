"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "@/lib/snook-api";
import type { Expense } from "@/types/snook";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fmt } from "@/lib/utils";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editExp, setEditExp] = useState<Expense | null>(null);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [form, setForm] = useState({ category: "", description: "", amount: 0, date: format(new Date(), "yyyy-MM-dd") });

  const load = async () => {
    try { const e = await getExpenses(startDate, endDate); setExpenses(e || []); } catch { toast.error("โหลดไม่สำเร็จ"); }
  };

  useEffect(() => { load(); }, [startDate, endDate]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const handleSave = async () => {
    try {
      if (editExp) { await updateExpense(editExp.id, form); toast.success("อัปเดตแล้ว"); }
      else { await createExpense(form); toast.success("สร้างแล้ว"); }
      setDialogOpen(false); setEditExp(null); setForm({ category: "", description: "", amount: 0, date: format(new Date(), "yyyy-MM-dd") }); load();
    } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบ?")) return;
    try { await deleteExpense(id); toast.success("ลบแล้ว"); load(); } catch { toast.error("ไม่สำเร็จ"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">รายจ่าย</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditExp(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />เพิ่มรายจ่าย</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editExp ? "แก้ไข" : "เพิ่ม"}รายจ่าย</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label>หมวดหมู่</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="อาหาร, สาธารณูปโภค, ค่าเช่า..." /></div>
              <div className="space-y-1"><Label>รายละเอียด</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-1"><Label>จำนวนเงิน</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>วันที่</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <Button className="w-full" onClick={handleSave}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center gap-4">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto" />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto" />
        <span className="text-sm font-medium">รวม: <span className="text-red-600">{fmt(total)}</span></span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>วันที่</TableHead><TableHead>หมวดหมู่</TableHead><TableHead>รายละเอียด</TableHead><TableHead className="text-right">จำนวนเงิน</TableHead><TableHead>จัดการ</TableHead></TableRow></TableHeader>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.date?.slice(0, 10)}</TableCell>
                <TableCell className="font-medium">{e.category}</TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell className="text-right font-medium">{fmt(e.amount)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditExp(e); setForm({ category: e.category, description: e.description, amount: e.amount, date: e.date?.slice(0, 10) }); setDialogOpen(true); }}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">ไม่มีรายจ่าย</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
