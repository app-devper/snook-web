"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBookings, createBooking, updateBookingStatus, deleteBooking, getTables } from "@/lib/snook-api";
import type { Booking, Table as TableType } from "@/types/snook";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(Date.now() + 7 * 86400000), "yyyy-MM-dd"));
  const [form, setForm] = useState({ tableId: "", customerName: "", customerPhone: "", bookingDate: format(new Date(), "yyyy-MM-dd"), startTime: "10:00", endTime: "12:00", note: "" });

  const load = async () => {
    try {
      const [b, t] = await Promise.all([getBookings(startDate, endDate), getTables()]);
      setBookings(b || []);
      setTables(t || []);
    } catch { toast.error("โหลดไม่สำเร็จ"); }
  };

  useEffect(() => { load(); }, [startDate, endDate]);

  const handleCreate = async () => {
    if (!form.tableId) { toast.error("กรุณาเลือกโต๊ะ"); return; }
    if (!form.customerName.trim()) { toast.error("กรุณากรอกชื่อลูกค้า"); return; }
    if (!form.bookingDate) { toast.error("กรุณาเลือกวันที่จอง"); return; }
    try {
      await createBooking(form);
      toast.success("สร้างการจองแล้ว");
      setDialogOpen(false);
      setForm({ tableId: "", customerName: "", customerPhone: "", bookingDate: format(new Date(), "yyyy-MM-dd"), startTime: "10:00", endTime: "12:00", note: "" });
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "สร้างไม่สำเร็จ");
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateBookingStatus(id, status);
      toast.success("อัปเดตสถานะแล้ว");
      load();
    } catch { toast.error("อัปเดตไม่สำเร็จ"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบการจอง?")) return;
    try { await deleteBooking(id); toast.success("ลบแล้ว"); load(); } catch { toast.error("ไม่สำเร็จ"); }
  };

  const statusColor = (s: string) => {
    switch (s) { case "PENDING": return "secondary"; case "CONFIRMED": return "default"; case "CANCELLED": return "destructive"; default: return "outline" as const; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">การจอง</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />จองใหม่</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>จองใหม่</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>โต๊ะ</Label>
                <Select value={form.tableId} onValueChange={(v) => setForm({ ...form, tableId: v })}>
                  <SelectTrigger><SelectValue placeholder="เลือกโต๊ะ" /></SelectTrigger>
                  <SelectContent>{tables.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>ชื่อลูกค้า</Label><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
              <div className="space-y-2"><Label>โทรศัพท์</Label><Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></div>
              <div className="space-y-2"><Label>วันที่จอง</Label><Input type="date" value={form.bookingDate} onChange={(e) => setForm({ ...form, bookingDate: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>เริ่ม</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
                <div className="space-y-2"><Label>สิ้นสุด</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>หมายเหตุ</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
              <Button className="w-full" onClick={handleCreate}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex gap-4">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto" />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>โต๊ะ</TableHead><TableHead>ลูกค้า</TableHead><TableHead>วันที่</TableHead><TableHead>เวลา</TableHead><TableHead>สถานะ</TableHead><TableHead>จัดการ</TableHead></TableRow></TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.tableName}</TableCell>
                <TableCell>{b.customerName}</TableCell>
                <TableCell>{b.bookingDate?.slice(0, 10)}</TableCell>
                <TableCell>{b.startTime} - {b.endTime}</TableCell>
                <TableCell><Badge variant={statusColor(b.status) as "default" | "secondary" | "destructive" | "outline"}>{b.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {b.status === "PENDING" && <Button size="sm" variant="outline" onClick={() => handleStatus(b.id, "CONFIRMED")}>ยืนยัน</Button>}
                    {b.status !== "CANCELLED" && <Button size="sm" variant="outline" onClick={() => handleStatus(b.id, "CANCELLED")}>ยกเลิก</Button>}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">ไม่มีการจอง</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
