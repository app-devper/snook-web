"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getTables, getActiveSession, getTableSessionById,
  getMenuItems, createTableOrder, deleteTableOrder,
  createPayment, closeTable, pauseTable, resumeTable, transferTable,
  getActivePromotions, applyPromotion, getRevenueByTable,
} from "@/lib/snook-api";
import type { Table as TableType, TableSessionDetail, TableSession, MenuItem, Promotion } from "@/types/snook";
import {
  ArrowLeft, Play, Pause, Square, Timer, Plus, Trash2,
  CreditCard, DollarSign, ArrowRightLeft, Tag, Printer, History, Search,
} from "lucide-react";
import { format } from "date-fns";
import { fmt } from "@/lib/utils";
import { toast } from "sonner";

function TableDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get("id") || "";

  const [table, setTable] = useState<TableType | null>(null);
  const [session, setSession] = useState<TableSessionDetail | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [elapsed, setElapsed] = useState("");
  const [liveCharge, setLiveCharge] = useState(0);
  const [liveHours, setLiveHours] = useState(0);

  const [orderDialog, setOrderDialog] = useState(false);
  const [payDialog, setPayDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [promoDialog, setPromoDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);

  const [orderForm, setOrderForm] = useState({ menuItemId: "", quantity: 1, discount: 0 });
  const [payForm, setPayForm] = useState({ type: "CASH", amount: 0, note: "" });
  const [transferTargetId, setTransferTargetId] = useState("");
  const [selectedPromoId, setSelectedPromoId] = useState("");
  const [closeForm, setCloseForm] = useState({ discount: 0, note: "", payType: "CASH", payNote: "" });
  const [menuFilter, setMenuFilter] = useState("");

  // History
  const [history, setHistory] = useState<TableSession[]>([]);
  const [histStart, setHistStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [histEnd, setHistEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [histLoading, setHistLoading] = useState(false);

  const loadHistory = async () => {
    if (!tableId) return;
    setHistLoading(true);
    try {
      const s = await getRevenueByTable(tableId, histStart, histEnd);
      setHistory((s || []).filter((x) => x.status === "CLOSED"));
    } catch { toast.error("โหลดประวัติไม่สำเร็จ"); }
    setHistLoading(false);
  };

  const load = useCallback(async () => {
    if (!tableId) return;
    try {
      const allTables = await getTables();
      const t = (allTables || []).find((tb: TableType) => tb.id === tableId);
      if (!t) { toast.error("ไม่พบโต๊ะ"); router.push("/tables"); return; }
      setTable(t);
      setTables(allTables || []);

      if (t.status === "IN_USE") {
        const activeSession = await getActiveSession(tableId);
        if (activeSession) {
          const detail = await getTableSessionById(activeSession.id);
          setSession(detail);
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch {
      toast.error("โหลดข้อมูลไม่สำเร็จ");
    }
  }, [tableId, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getMenuItems().then((r) => setMenuItems(r || [])).catch(() => {});
    if (tableId) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  useEffect(() => {
    if (!session || session.status === "CLOSED") return;
    const tick = () => {
      if (session.status === "PAUSED") {
        const pausedAt = session.pausedAt ? new Date(session.pausedAt).getTime() : Date.now();
        const totalMins = Math.max(0, (pausedAt - new Date(session.startTime).getTime()) / 60000 - session.totalPausedMins);
        const billable = Math.max(60, totalMins);
        const bh = Math.ceil(billable / 60);
        setLiveHours(bh);
        setLiveCharge(Math.round(bh * session.ratePerHour * 100) / 100);
        const h = Math.floor(totalMins / 60);
        const m = Math.floor(totalMins % 60);
        setElapsed(`${h}:${String(m).padStart(2, "0")} (Paused)`);
      } else {
        const totalMins = Math.max(0, (Date.now() - new Date(session.startTime).getTime()) / 60000 - session.totalPausedMins);
        const billable = Math.max(60, totalMins);
        const bh = Math.ceil(billable / 60);
        setLiveHours(bh);
        setLiveCharge(Math.round(bh * session.ratePerHour * 100) / 100);
        const h = Math.floor(totalMins / 60);
        const m = Math.floor(totalMins % 60);
        setElapsed(`${h}:${String(m).padStart(2, "0")}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (promoDialog && table) {
      getActivePromotions(table.type).then((r) => setPromotions(r || [])).catch(() => {});
    }
  }, [promoDialog, table]);

  const handlePause = async () => {
    if (!session) return;
    try { await pauseTable(session.id); toast.success("พักแล้ว"); load(); } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleResume = async () => {
    if (!session) return;
    try { await resumeTable(session.id); toast.success("เล่นต่อแล้ว"); load(); } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleAddOrder = async () => {
    if (!session || !orderForm.menuItemId) return;
    try {
      await createTableOrder({ sessionId: session.id, menuItemId: orderForm.menuItemId, quantity: orderForm.quantity, discount: orderForm.discount });
      toast.success("เพิ่มรายการแล้ว");
      setOrderDialog(false);
      setOrderForm({ menuItemId: "", quantity: 1, discount: 0 });
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "เพิ่มรายการไม่สำเร็จ");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("ลบรายการนี้?")) return;
    try { await deleteTableOrder(orderId); toast.success("ลบแล้ว"); load(); } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleAddPayment = async () => {
    if (!session || payForm.amount <= 0) return;
    try {
      await createPayment({ sessionId: session.id, type: payForm.type, amount: payForm.amount, note: payForm.note });
      toast.success("เพิ่มการชำระแล้ว");
      setPayDialog(false);
      setPayForm({ type: "CASH", amount: 0, note: "" });
      load();
    } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleTransfer = async () => {
    if (!session || !transferTargetId) return;
    try {
      await transferTable(session.id, transferTargetId);
      toast.success("ย้ายโต๊ะแล้ว");
      setTransferDialog(false);
      router.push("/tables");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "ย้ายโต๊ะไม่สำเร็จ");
    }
  };

  const handleApplyPromotion = async () => {
    if (!session || !selectedPromoId) return;
    try {
      await applyPromotion(session.id, selectedPromoId);
      toast.success("ใช้โปรโมชั่นแล้ว");
      setPromoDialog(false);
      setSelectedPromoId("");
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "ใช้โปรโมชั่นไม่สำเร็จ");
    }
  };

  const handleClose = async () => {
    if (!session) return;
    try {
      await closeTable(session.id, {
        tableCharge: liveCharge,
        discount: closeForm.discount,
        note: closeForm.note,
        paymentType: closeForm.payType,
        paymentNote: closeForm.payNote,
      });
      toast.success("ปิดโต๊ะแล้ว");
      setCloseDialog(false);
      load();
      loadHistory();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "ปิดโต๊ะไม่สำเร็จ");
    }
  };

  const handlePrint = () => {
    if (session) window.open(`/tables/receipt?sessionId=${session.id}`, "_blank");
  };

  if (!tableId) return <div className="p-6">ไม่ได้เลือกโต๊ะ</div>;
  if (!table) return <div className="p-6">กำลังโหลด...</div>;

  const orders = session?.orders || [];
  const payments = session?.payments || [];
  const foodTotal = orders.reduce((s, o) => s + o.total, 0);
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const availableTables = tables.filter((t) => t.status === "AVAILABLE" && t.id !== tableId);
  const filteredMenuItems = menuFilter ? menuItems.filter((m) => m.category === menuFilter) : menuItems;
  const activeMenuItems = filteredMenuItems.filter((m) => m.status === "ACTIVE");
  const menuCategories = [...new Set(menuItems.map((m) => m.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/tables")}>
          <ArrowLeft className="mr-1 h-4 w-4" />กลับ
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{table.name}</h1>
          <p className="text-sm text-muted-foreground">{table.type} &bull; {table.ratePerHour}/ชม.</p>
        </div>
        <Badge className={table.status === "IN_USE" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
          {table.status}
        </Badge>
      </div>

      {!session ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">ไม่มีเซสชันที่ใช้งานอยู่</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Session Info Bar */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card><CardContent className="pt-4 text-center"><Timer className="mx-auto mb-1 h-5 w-5 text-blue-600" /><p className="text-xs text-muted-foreground">เวลา</p><p className="text-lg font-bold">{elapsed}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><DollarSign className="mx-auto mb-1 h-5 w-5 text-purple-600" /><p className="text-xs text-muted-foreground">ค่าโต๊ะ</p><p className="text-lg font-bold">{fmt(session.status === "CLOSED" ? session.tableCharge : liveCharge)}</p>{session.status !== "CLOSED" && <p className="text-xs text-muted-foreground">{liveHours}ชม. × {fmt(session.ratePerHour)}/ชม.</p>}</CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><DollarSign className="mx-auto mb-1 h-5 w-5 text-orange-600" /><p className="text-xs text-muted-foreground">ยอดอาหาร</p><p className="text-lg font-bold">{fmt(foodTotal)}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><Tag className="mx-auto mb-1 h-5 w-5 text-green-600" /><p className="text-xs text-muted-foreground">ส่วนลด</p><p className="text-lg font-bold">{fmt(session.discount + session.promotionDiscount)}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><CreditCard className="mx-auto mb-1 h-5 w-5 text-green-600" /><p className="text-xs text-muted-foreground">ชำระแล้ว</p><p className="text-lg font-bold">{fmt(paidTotal)}</p></CardContent></Card>
          </div>

          {session.promotionName && (
            <div className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-800">
              โปรโมชั่น: <strong>{session.promotionName}</strong> — ส่วนลด: {fmt(session.promotionDiscount)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {session.status === "ACTIVE" && (
              <Button variant="outline" size="sm" onClick={handlePause}><Pause className="mr-1 h-3 w-3" />พัก</Button>
            )}
            {session.status === "PAUSED" && (
              <Button variant="outline" size="sm" onClick={handleResume}><Play className="mr-1 h-3 w-3" />เล่นต่อ</Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setOrderDialog(true)}><Plus className="mr-1 h-3 w-3" />เพิ่มรายการ</Button>
            <Button variant="outline" size="sm" onClick={() => { setPayForm({ type: "CASH", amount: 0, note: "" }); setPayDialog(true); }}><CreditCard className="mr-1 h-3 w-3" />เพิ่มการชำระ</Button>
            <Button variant="outline" size="sm" onClick={() => setTransferDialog(true)}><ArrowRightLeft className="mr-1 h-3 w-3" />ย้ายโต๊ะ</Button>
            <Button variant="outline" size="sm" onClick={() => setPromoDialog(true)}><Tag className="mr-1 h-3 w-3" />โปรโมชั่น</Button>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-1 h-3 w-3" />พิมพ์</Button>
            <div className="flex-1" />
            <Button variant="destructive" size="sm" onClick={() => { setCloseForm({ discount: session.discount, note: session.note, payType: "CASH", payNote: "" }); setCloseDialog(true); }}><Square className="mr-1 h-3 w-3" />ปิดโต๊ะ</Button>
          </div>

          {/* Orders & Payments Tabs */}
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">รายการ ({orders.length})</TabsTrigger>
              <TabsTrigger value="payments">การชำระ ({payments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow><TableHead>รายการ</TableHead><TableHead className="text-right">ราคา</TableHead><TableHead className="text-right">จำนวน</TableHead><TableHead className="text-right">ส่วนลด</TableHead><TableHead className="text-right">รวม</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.name}</TableCell>
                        <TableCell className="text-right">{fmt(o.price)}</TableCell>
                        <TableCell className="text-right">{o.quantity}</TableCell>
                        <TableCell className="text-right">{o.discount > 0 ? fmt(o.discount) : "-"}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(o.total)}</TableCell>
                        <TableCell>{session.status !== "CLOSED" && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteOrder(o.id)}><Trash2 className="h-3 w-3" /></Button>}</TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">ยังไม่มีรายการ</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="payments" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader><TableRow><TableHead>ประเภท</TableHead><TableHead className="text-right">จำนวน</TableHead><TableHead>หมายเหตุ</TableHead><TableHead>เวลา</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><Badge variant={p.type === "CASH" ? "default" : p.type === "OUTSTANDING" ? "destructive" : "secondary"}>{p.type}</Badge></TableCell>
                        <TableCell className="text-right font-medium">{fmt(p.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.note || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.createdDate?.slice(11, 16)}</TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">ยังไม่มีการชำระ</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          {/* Add Order Dialog */}
          <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>เพิ่มรายการ</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>หมวดหมู่</Label>
                  <Select value={menuFilter || "ALL"} onValueChange={(v) => setMenuFilter(v === "ALL" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ทั้งหมด</SelectItem>
                      {menuCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>เมนู</Label>
                  <Select value={orderForm.menuItemId} onValueChange={(v) => setOrderForm({ ...orderForm, menuItemId: v })}>
                    <SelectTrigger><SelectValue placeholder="เลือกรายการ" /></SelectTrigger>
                    <SelectContent>
                      {activeMenuItems.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name} — {fmt(m.price)} (คงเหลือ: {m.quantity})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>จำนวน</Label><Input type="number" min={1} value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })} /></div>
                  <div className="space-y-1"><Label>ส่วนลด</Label><Input type="number" min={0} value={orderForm.discount || ""} onChange={(e) => setOrderForm({ ...orderForm, discount: Number(e.target.value) })} /></div>
                </div>
                <Button className="w-full" onClick={handleAddOrder}>เพิ่มรายการ</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Payment Dialog */}
          <Dialog open={payDialog} onOpenChange={setPayDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>เพิ่มการชำระ</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>ประเภท</Label>
                  <Select value={payForm.type} onValueChange={(v) => setPayForm({ ...payForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">เงินสด</SelectItem>
                      <SelectItem value="CREDIT">บัตรเครดิต</SelectItem>
                      <SelectItem value="TRANSFER">โอนเงิน</SelectItem>
                      <SelectItem value="OUTSTANDING">ค้างชำระ (ลูกหนี้)</SelectItem>
                      <SelectItem value="FREE">ฟรี</SelectItem>
                      <SelectItem value="EXECUTIVE_CREDIT">เครดิตผู้บริหาร</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>จำนวนเงิน</Label><Input type="number" min={0} value={payForm.amount || ""} onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label>หมายเหตุ {payForm.type === "OUTSTANDING" && "(ชื่อลูกค้า)"}</Label><Input value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} /></div>
                <Button className="w-full" onClick={handleAddPayment}>บันทึกการชำระ</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Transfer Dialog */}
          <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>ย้ายโต๊ะ</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>ย้ายไปที่</Label>
                  <Select value={transferTargetId} onValueChange={setTransferTargetId}>
                    <SelectTrigger><SelectValue placeholder="เลือกโต๊ะ" /></SelectTrigger>
                    <SelectContent>
                      {availableTables.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.type})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {availableTables.length === 0 && <p className="text-sm text-muted-foreground">ไม่มีโต๊ะว่าง</p>}
                <Button className="w-full" onClick={handleTransfer} disabled={!transferTargetId}>ย้าย</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Promotion Dialog */}
          <Dialog open={promoDialog} onOpenChange={setPromoDialog}>
            <DialogContent>
              <DialogHeader><DialogTitle>ใช้โปรโมชั่น</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {promotions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ไม่มีโปรโมชั่นสำหรับโต๊ะประเภทนี้</p>
                ) : (
                  <div className="space-y-2">
                    {promotions.map((p) => (
                      <div key={p.id} className={`cursor-pointer rounded-md border p-3 text-sm transition-colors ${selectedPromoId === p.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`} onClick={() => setSelectedPromoId(p.id)}>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-muted-foreground">
                          {p.type === "FREE_HOURS" && `เล่น ${p.playHours} ชม. → ฟรี ${p.freeHours} ชม.`}
                          {p.type === "DISCOUNT_PCT" && `ลด ${p.discountPct}% ค่าโต๊ะ`}
                          {p.type === "DISCOUNT_AMT" && `ลด ${fmt(p.discountAmt)} บาท`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <Button className="w-full" onClick={handleApplyPromotion} disabled={!selectedPromoId}>ใช้โปรโมชั่น</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Close Table Dialog */}
          <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>ปิดโต๊ะ — สรุปบิล</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Bill Summary */}
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span>ค่าโต๊ะ ({liveHours}ชม. × {fmt(session.ratePerHour)}/ชม.)</span><span>{fmt(liveCharge)}</span></div>
                  {orders.length > 0 && orders.map((o) => (
                    <div key={o.id} className="flex justify-between text-muted-foreground"><span className="pl-2">• {o.name} x{o.quantity}</span><span>{fmt(o.total)}</span></div>
                  ))}
                  <div className="flex justify-between"><span>ยอดอาหาร</span><span>{fmt(foodTotal)}</span></div>
                  {session.promotionDiscount > 0 && <div className="flex justify-between text-green-600"><span>โปรโมชั่น ({session.promotionName})</span><span>-{fmt(session.promotionDiscount)}</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold"><span>รวมย่อย</span><span>{fmt(liveCharge + foodTotal - session.promotionDiscount)}</span></div>
                </div>

                <div className="space-y-1"><Label>ส่วนลดเพิ่มเติม</Label><Input type="number" min={0} value={closeForm.discount || ""} onChange={(e) => setCloseForm({ ...closeForm, discount: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label>หมายเหตุ</Label><Input value={closeForm.note} onChange={(e) => setCloseForm({ ...closeForm, note: e.target.value })} /></div>

                {/* Grand Total */}
                <div className="rounded-md bg-primary/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">ยอดรวม (ประมาณ)</p>
                  <p className="text-2xl font-bold">{fmt(Math.max(0, liveCharge + foodTotal - session.promotionDiscount - closeForm.discount))}</p>
                </div>

                {/* Existing Payments */}
                {payments.length > 0 && (
                  <div className="rounded-md border p-2 text-sm space-y-1">
                    <p className="font-medium text-xs text-muted-foreground">การชำระก่อนหน้า</p>
                    {payments.map((p) => (
                      <div key={p.id} className="flex justify-between"><span>{p.type}{p.note ? ` (${p.note})` : ""}</span><span>{fmt(p.amount)}</span></div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-medium"><span>ชำระแล้ว</span><span>{fmt(paidTotal)}</span></div>
                  </div>
                )}

                {/* Remaining */}
                {(() => {
                  const grandTotal = Math.max(0, liveCharge + foodTotal - session.promotionDiscount - closeForm.discount);
                  const remaining = Math.max(0, grandTotal - paidTotal);
                  return remaining > 0 ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-2">
                      <div className="flex justify-between text-sm font-bold text-red-700"><span>คงเหลือ</span><span>{fmt(remaining)}</span></div>
                      <Separator />
                      <div className="space-y-1">
                        <Label className="text-xs">วิธีชำระ</Label>
                        <Select value={closeForm.payType} onValueChange={(v) => setCloseForm({ ...closeForm, payType: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">เงินสด</SelectItem>
                            <SelectItem value="CREDIT">บัตรเครดิต</SelectItem>
                            <SelectItem value="TRANSFER">โอนเงิน</SelectItem>
                            <SelectItem value="OUTSTANDING">ค้างชำระ (ลูกหนี้)</SelectItem>
                            <SelectItem value="FREE">ฟรี</SelectItem>
                            <SelectItem value="EXECUTIVE_CREDIT">เครดิตผู้บริหาร</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {closeForm.payType === "OUTSTANDING" && (
                        <div className="space-y-1"><Label className="text-xs">ชื่อลูกค้า</Label><Input value={closeForm.payNote} onChange={(e) => setCloseForm({ ...closeForm, payNote: e.target.value })} placeholder="ชื่อลูกค้า" /></div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md bg-green-50 p-2 text-center text-sm text-green-700 font-medium">ชำระครบแล้ว</div>
                  );
                })()}

                <Button className="w-full" variant="destructive" onClick={handleClose}>
                  {Math.max(0, Math.max(0, liveCharge + foodTotal - session.promotionDiscount - closeForm.discount) - paidTotal) > 0 ? "ชำระและปิดโต๊ะ" : "ปิดโต๊ะ"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Revenue History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />ประวัติรายได้</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={histStart} onChange={(e) => setHistStart(e.target.value)} className="w-auto" />
            <Input type="date" value={histEnd} onChange={(e) => setHistEnd(e.target.value)} className="w-auto" />
            <Button size="sm" onClick={loadHistory} disabled={histLoading}><Search className="mr-1 h-3 w-3" />{histLoading ? "กำลังโหลด..." : "ค้นหา"}</Button>
          </div>
          {history.length > 0 && (
            <div className="grid gap-3 md:grid-cols-4 mb-4">
              <div className="rounded-md bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">เซสชัน</p>
                <p className="text-lg font-bold">{history.length}</p>
              </div>
              <div className="rounded-md bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">ค่าโต๊ะ</p>
                <p className="text-lg font-bold">{fmt(history.reduce((s, h) => s + h.tableCharge, 0))}</p>
              </div>
              <div className="rounded-md bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">ยอดอาหาร</p>
                <p className="text-lg font-bold">{fmt(history.reduce((s, h) => s + h.foodTotal, 0))}</p>
              </div>
              <div className="rounded-md bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">รายได้รวม</p>
                <p className="text-lg font-bold text-green-600">{fmt(history.reduce((s, h) => s + h.grandTotal, 0))}</p>
              </div>
            </div>
          )}
          <div className="rounded-md border max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ระยะเวลา</TableHead>
                  <TableHead className="text-right">ค่าโต๊ะ</TableHead>
                  <TableHead className="text-right">อาหาร</TableHead>
                  <TableHead className="text-right">ส่วนลด</TableHead>
                  <TableHead className="text-right">รวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="text-sm">{h.startTime?.slice(0, 16).replace("T", " ")}</TableCell>
                    <TableCell>{Math.floor(h.durationMins / 60)}:{String(Math.floor(h.durationMins % 60)).padStart(2, "0")}</TableCell>
                    <TableCell className="text-right">{fmt(h.tableCharge)}</TableCell>
                    <TableCell className="text-right">{fmt(h.foodTotal)}</TableCell>
                    <TableCell className="text-right">{fmt(h.discount + h.promotionDiscount)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(h.grandTotal)}</TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">ไม่พบข้อมูล — กดค้นหา</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TableDetailPage() {
  return (
    <Suspense fallback={<div className="p-6">กำลังโหลด...</div>}>
      <TableDetailContent />
    </Suspense>
  );
}
