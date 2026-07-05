"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTables, createTable, updateTable, deleteTable, openTable, getActiveSession, closeTable, pauseTable, resumeTable } from "@/lib/snook-api";
import type { Table, TableSession } from "@/types/snook";
import { Plus, Play, Pause, Square, Timer, Trash2, Edit, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { fmt } from "@/lib/utils";

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [sessions, setSessions] = useState<Record<string, TableSession | null>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [form, setForm] = useState({ name: "", type: "STANDARD", ratePerHour: 0, description: "" });

  const load = useCallback(() => {
    const fetchTablesWithSessions = async () => {
      const t = await getTables();
      const sessMap: Record<string, TableSession | null> = {};
      for (const tb of t || []) {
        if (tb.status === "IN_USE") {
          try {
            sessMap[tb.id] = await getActiveSession(tb.id);
          } catch {
            sessMap[tb.id] = null;
          }
        }
      }
      return { tables: t || [], sessMap };
    };
    return fetchTablesWithSessions()
      .then(({ tables: t, sessMap }) => {
        setTables(t);
        setSessions(sessMap);
      })
      .catch(() => toast.error("โหลดข้อมูลไม่สำเร็จ"));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSave = async () => {
    try {
      if (editTable) {
        await updateTable(editTable.id, form);
        toast.success("อัปเดตโต๊ะแล้ว");
      } else {
        await createTable(form);
        toast.success("สร้างโต๊ะแล้ว");
      }
      setDialogOpen(false);
      setEditTable(null);
      setForm({ name: "", type: "STANDARD", ratePerHour: 0, description: "" });
      load();
    } catch {
      toast.error("บันทึกไม่สำเร็จ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบโต๊ะนี้?")) return;
    try {
      await deleteTable(id);
      toast.success("ลบโต๊ะแล้ว");
      load();
    } catch {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const handleOpen = async (tableId: string) => {
    try {
      await openTable(tableId);
      toast.success("เปิดโต๊ะแล้ว");
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "เปิดโต๊ะไม่สำเร็จ");
    }
  };

  const handleClose = async (sessionId: string) => {
    try {
      await closeTable(sessionId);
      toast.success("ปิดโต๊ะแล้ว");
      load();
    } catch {
      toast.error("ปิดโต๊ะไม่สำเร็จ");
    }
  };

  const handlePause = async (sessionId: string) => {
    try {
      await pauseTable(sessionId);
      toast.success("พักโต๊ะแล้ว");
      load();
    } catch {
      toast.error("พักไม่สำเร็จ");
    }
  };

  const handleResume = async (sessionId: string) => {
    try {
      await resumeTable(sessionId);
      toast.success("เล่นต่อแล้ว");
      load();
    } catch {
      toast.error("เล่นต่อไม่สำเร็จ");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-green-100 text-green-800";
      case "IN_USE": return "bg-red-100 text-red-800";
      case "RESERVED": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">โต๊ะ</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditTable(null); setForm({ name: "", type: "STANDARD", ratePerHour: 0, description: "" }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />เพิ่มโต๊ะ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editTable ? "แก้ไขโต๊ะ" : "โต๊ะใหม่"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อ</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>ประเภท</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ราคา/ชั่วโมง</Label>
                <Input type="number" value={form.ratePerHour} onChange={(e) => setForm({ ...form, ratePerHour: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>รายละเอียด</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleSave}>บันทึก</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((t) => {
          const session = sessions[t.id];
          return (
            <Card key={t.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg cursor-pointer hover:underline" onClick={() => router.push(`/tables/detail?id=${t.id}`)}>{t.name}</CardTitle>
                  <Badge className={statusColor(t.status)}>{t.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.type} &bull; {t.ratePerHour}/ชม.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {session && (() => {
                  const now = session.status === "PAUSED" && session.pausedAt ? new Date(session.pausedAt).getTime() : Date.now();
                  const totalMins = Math.max(0, (now - new Date(session.startTime).getTime()) / 60000 - (session.totalPausedMins || 0));
                  const billable = Math.max(60, totalMins);
                  const charge = Math.round(Math.ceil(billable / 60) * t.ratePerHour * 100) / 100;
                  return (
                    <div className="rounded-md bg-muted p-2 text-sm space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        {Math.floor(totalMins / 60)}:{String(Math.floor(totalMins % 60)).padStart(2, "0")}{session.status === "PAUSED" ? " (Paused)" : ""}
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-3 w-3" />
                        ~{fmt(charge)}
                      </div>
                      {session.status === "PAUSED" && <Badge variant="outline" className="mt-1">พัก</Badge>}
                    </div>
                  );
                })()}
                <div className="flex gap-2 flex-wrap">
                  {t.status === "AVAILABLE" && (
                    <Button size="sm" onClick={() => handleOpen(t.id)}>
                      <Play className="mr-1 h-3 w-3" />เปิด
                    </Button>
                  )}
                  {session && session.status === "ACTIVE" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handlePause(session.id)}>
                        <Pause className="mr-1 h-3 w-3" />พัก
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => router.push(`/tables/detail?id=${t.id}`)}>
                        <Square className="mr-1 h-3 w-3" />ปิด
                      </Button>
                    </>
                  )}
                  {session && session.status === "PAUSED" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleResume(session.id)}>
                        <Play className="mr-1 h-3 w-3" />เล่นต่อ
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => router.push(`/tables/detail?id=${t.id}`)}>
                        <Square className="mr-1 h-3 w-3" />ปิด
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setEditTable(t); setForm({ name: t.name, type: t.type, ratePerHour: t.ratePerHour, description: t.description }); setDialogOpen(true); }}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  {t.status !== "IN_USE" && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
