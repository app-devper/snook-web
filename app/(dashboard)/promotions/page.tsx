"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPromotions, createPromotion, updatePromotion, deletePromotion } from "@/lib/snook-api";
import type { Promotion } from "@/types/snook";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { fmt } from "@/lib/utils";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [form, setForm] = useState({ name: "", description: "", type: "FREE_HOURS", playHours: 0, freeHours: 0, discountPct: 0, discountAmt: 0, tableTypes: [] as string[], startDate: "", endDate: "", status: "ACTIVE" });
  const TABLE_TYPES = ["STANDARD", "VIP", "PREMIUM"];
  const toggleTableType = (t: string) => {
    setForm((prev) => ({
      ...prev,
      tableTypes: prev.tableTypes.includes(t) ? prev.tableTypes.filter((x) => x !== t) : [...prev.tableTypes, t],
    }));
  };

  const load = async () => {
    try { const p = await getPromotions(); setPromotions(p || []); } catch { toast.error("โหลดไม่สำเร็จ"); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editPromo) { await updatePromotion(editPromo.id, form); toast.success("อัปเดตแล้ว"); }
      else { await createPromotion(form); toast.success("สร้างแล้ว"); }
      setDialogOpen(false); setEditPromo(null); load();
    } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบ?")) return;
    try { await deletePromotion(id); toast.success("ลบแล้ว"); load(); } catch { toast.error("ไม่สำเร็จ"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">โปรโมชั่น</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditPromo(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />เพิ่มโปรโมชั่น</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editPromo ? "แก้ไข" : "เพิ่ม"}โปรโมชั่น</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1"><Label>ชื่อ</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>รายละเอียด</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>ประเภท</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, playHours: 0, freeHours: 0, discountPct: 0, discountAmt: 0 })}>
                  <SelectTrigger><SelectValue placeholder="เลือกประเภท" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE_HOURS">ชั่วโมงฟรี (เช่น เล่น 2 ชม. ฟรี 1 ชม.)</SelectItem>
                    <SelectItem value="DISCOUNT_PCT">ลด % (ลดเปอร์เซ็นต์)</SelectItem>
                    <SelectItem value="DISCOUNT_AMT">ลดจำนวนเงิน (ลดคงที่)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type === "FREE_HOURS" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>ชั่วโมงเล่น</Label><Input type="number" min={0} value={form.playHours || ""} onChange={(e) => setForm({ ...form, playHours: Number(e.target.value) })} placeholder="e.g. 2" /></div>
                  <div className="space-y-1"><Label>ชั่วโมงฟรี</Label><Input type="number" min={0} value={form.freeHours || ""} onChange={(e) => setForm({ ...form, freeHours: Number(e.target.value) })} placeholder="e.g. 1" /></div>
                </div>
              )}
              {form.type === "DISCOUNT_PCT" && (
                <div className="space-y-1"><Label>ส่วนลด %</Label><Input type="number" min={0} max={100} value={form.discountPct || ""} onChange={(e) => setForm({ ...form, discountPct: Number(e.target.value) })} placeholder="e.g. 10" /></div>
              )}
              {form.type === "DISCOUNT_AMT" && (
                <div className="space-y-1"><Label>จำนวนส่วนลด</Label><Input type="number" min={0} value={form.discountAmt || ""} onChange={(e) => setForm({ ...form, discountAmt: Number(e.target.value) })} placeholder="e.g. 50" /></div>
              )}
              <div className="space-y-1">
                <Label>ประเภทโต๊ะ <span className="text-muted-foreground text-xs">(ว่าง = ทุกประเภท)</span></Label>
                <div className="flex gap-2">
                  {TABLE_TYPES.map((t) => (
                    <Badge key={t} variant={form.tableTypes.includes(t) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTableType(t)}>{t}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>วันเริ่ม</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                <div className="space-y-1"><Label>วันสิ้นสุด</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <Button className="w-full" onClick={handleSave}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>ชื่อ</TableHead><TableHead>ประเภท</TableHead><TableHead>รายละเอียด</TableHead><TableHead>ช่วงเวลา</TableHead><TableHead>สถานะ</TableHead><TableHead>จัดการ</TableHead></TableRow></TableHeader>
          <TableBody>
            {promotions.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={p.type === "FREE_HOURS" ? "border-blue-300 text-blue-700" : p.type === "DISCOUNT_PCT" ? "border-orange-300 text-orange-700" : "border-green-300 text-green-700"}>
                    {p.type === "FREE_HOURS" ? "ชั่วโมงฟรี" : p.type === "DISCOUNT_PCT" ? "ลด %" : "ลดจำนวน"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {p.type === "FREE_HOURS" && `เล่น ${p.playHours} ชม. → ฟรี ${p.freeHours} ชม.`}
                  {p.type === "DISCOUNT_PCT" && `ลด ${p.discountPct}%`}
                  {p.type === "DISCOUNT_AMT" && `ลด ${fmt(p.discountAmt)} บาท`}
                </TableCell>
                <TableCell className="text-sm">{p.startDate?.slice(0, 10)} - {p.endDate?.slice(0, 10)}</TableCell>
                <TableCell><Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>{p.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditPromo(p);
                      setForm({ name: p.name, description: p.description, type: p.type, playHours: p.playHours, freeHours: p.freeHours, discountPct: p.discountPct, discountAmt: p.discountAmt, tableTypes: p.tableTypes || [], startDate: p.startDate?.slice(0, 10), endDate: p.endDate?.slice(0, 10), status: p.status });
                      setDialogOpen(true);
                    }}><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {promotions.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">ไม่มีโปรโมชั่น</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
