"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMenuCategories, createMenuCategory, deleteMenuCategory, getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/snook-api";
import type { MenuCategory, MenuItem } from "@/types/snook";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { fmt } from "@/lib/utils";

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [catDialog, setCatDialog] = useState(false);
  const [itemDialog, setItemDialog] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [catForm, setCatForm] = useState({ name: "", sortOrder: 0 });
  const [itemForm, setItemForm] = useState({ name: "", category: "", price: 0, costPrice: 0, quantity: 0, unit: "", status: "ACTIVE", imageUrl: "" });
  const [filterCat, setFilterCat] = useState("");

  const load = () =>
    Promise.all([getMenuCategories(), getMenuItems(filterCat)]).then(([cats, its]) => {
      setCategories(cats || []);
      setItems(its || []);
    });

  useEffect(() => { load(); }, [filterCat]);

  const handleCreateCat = async () => {
    try { await createMenuCategory(catForm); toast.success("สร้างหมวดหมู่แล้ว"); setCatDialog(false); setCatForm({ name: "", sortOrder: 0 }); load(); } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm("ลบหมวดหมู่?")) return;
    try { await deleteMenuCategory(id); toast.success("ลบแล้ว"); load(); } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleSaveItem = async () => {
    try {
      if (editItem) { await updateMenuItem(editItem.id, itemForm); toast.success("อัปเดตแล้ว"); }
      else { await createMenuItem(itemForm); toast.success("สร้างแล้ว"); }
      setItemDialog(false); setEditItem(null); setItemForm({ name: "", category: "", price: 0, costPrice: 0, quantity: 0, unit: "", status: "ACTIVE", imageUrl: "" }); load();
    } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("ลบรายการ?")) return;
    try { await deleteMenuItem(id); toast.success("ลบแล้ว"); load(); } catch { toast.error("ไม่สำเร็จ"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">จัดการเมนู</h1>
      <Tabs defaultValue="items">
        <TabsList><TabsTrigger value="items">รายการเมนู</TabsTrigger><TabsTrigger value="categories">หมวดหมู่</TabsTrigger></TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={filterCat || "ALL"} onValueChange={(v) => setFilterCat(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="ทุกหมวดหมู่" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={itemDialog} onOpenChange={(o) => { setItemDialog(o); if (!o) setEditItem(null); }}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />เพิ่มรายการ</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editItem ? "แก้ไขรายการ" : "รายการใหม่"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>ชื่อ</Label><Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} /></div>
                  <div className="space-y-1">
                    <Label>หมวดหมู่</Label>
                    <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                      <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>ราคา</Label><Input type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })} /></div>
                    <div className="space-y-1"><Label>ต้นทุน</Label><Input type="number" value={itemForm.costPrice} onChange={(e) => setItemForm({ ...itemForm, costPrice: Number(e.target.value) })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>จำนวน</Label><Input type="number" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })} /></div>
                    <div className="space-y-1"><Label>หน่วย</Label><Input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} /></div>
                  </div>
                  <Button className="w-full" onClick={handleSaveItem}>บันทึก</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>ชื่อ</TableHead><TableHead>หมวดหมู่</TableHead><TableHead>ราคา</TableHead><TableHead>คงเหลือ</TableHead><TableHead>สถานะ</TableHead><TableHead>จัดการ</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell>{i.category}</TableCell>
                    <TableCell>{fmt(i.price)}</TableCell>
                    <TableCell>{i.quantity} {i.unit}</TableCell>
                    <TableCell><Badge variant={i.status === "ACTIVE" ? "default" : "secondary"}>{i.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditItem(i); setItemForm({ name: i.name, category: i.category, price: i.price, costPrice: i.costPrice, quantity: i.quantity, unit: i.unit, status: i.status, imageUrl: i.imageUrl }); setItemDialog(true); }}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteItem(i.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">ไม่มีรายการ</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center justify-between">
            <span />
            <Dialog open={catDialog} onOpenChange={setCatDialog}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />เพิ่มหมวดหมู่</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>หมวดหมู่ใหม่</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>ชื่อ</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></div>
                  <div className="space-y-1"><Label>ลำดับ</Label><Input type="number" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) })} /></div>
                  <Button className="w-full" onClick={handleCreateCat}>บันทึก</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>ชื่อ</TableHead><TableHead>ลำดับ</TableHead><TableHead>จัดการ</TableHead></TableRow></TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.sortOrder}</TableCell>
                    <TableCell><Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteCat(c.id)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
