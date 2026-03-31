"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRevenueReport, getTables } from "@/lib/snook-api";
import type { RevenueReport, Table as TableType } from "@/types/snook";
import { Search, DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { fmt } from "@/lib/utils";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<TableType[]>([]);
  const [filterTable, setFilterTable] = useState("");

  useEffect(() => {
    getTables().then((t) => setTables(t || [])).catch(() => {});
  }, []);

  const setPreset = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case "today":
        setStartDate(format(now, "yyyy-MM-dd"));
        setEndDate(format(now, "yyyy-MM-dd"));
        break;
      case "week":
        setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
        setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
        break;
      case "month":
        setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(now), "yyyy-MM-dd"));
        break;
      case "lastMonth": {
        const lm = subMonths(now, 1);
        setStartDate(format(startOfMonth(lm), "yyyy-MM-dd"));
        setEndDate(format(endOfMonth(lm), "yyyy-MM-dd"));
        break;
      }
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const r = await getRevenueReport(startDate, endDate);
      setReport(r);
    } catch { toast.error("โหลดรายงานไม่สำเร็จ"); }
    setLoading(false);
  };

  const filteredSessions = report?.sessions?.filter((s) => {
    if (s.status !== "CLOSED") return false;
    if (filterTable && s.tableName !== filterTable) return false;
    return true;
  }) || [];

  const filteredIncome = filteredSessions.reduce((s, ses) => s + ses.grandTotal, 0);
  const filteredTableCharge = filteredSessions.reduce((s, ses) => s + ses.tableCharge, 0);
  const filteredFoodIncome = filteredSessions.reduce((s, ses) => s + ses.foodTotal, 0);

  const expensesByCategory = (report?.expenses || []).reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">รายงานรายได้</h1>

      {/* Date Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPreset("today")}>วันนี้</Button>
        <Button variant="outline" size="sm" onClick={() => setPreset("week")}>สัปดาห์นี้</Button>
        <Button variant="outline" size="sm" onClick={() => setPreset("month")}>เดือนนี้</Button>
        <Button variant="outline" size="sm" onClick={() => setPreset("lastMonth")}>เดือนที่แล้ว</Button>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto" />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto" />
        <Button onClick={handleSearch} disabled={loading}><Search className="mr-2 h-4 w-4" />{loading ? "กำลังโหลด..." : "สร้างรายงาน"}</Button>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">รายได้รวม</CardTitle><DollarSign className="h-4 w-4 text-green-600" /></CardHeader><CardContent><p className="text-2xl font-bold text-green-600">{fmt(report.totalIncome)}</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">รายจ่ายรวม</CardTitle><TrendingDown className="h-4 w-4 text-red-600" /></CardHeader><CardContent><p className="text-2xl font-bold text-red-600">{fmt(report.totalExpense)}</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">กำไรสุทธิ</CardTitle><TrendingUp className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><p className={`text-2xl font-bold ${report.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(report.netProfit)}</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">เซสชัน</CardTitle><BarChart3 className="h-4 w-4 text-purple-600" /></CardHeader><CardContent><p className="text-2xl font-bold">{report.totalSessions}</p></CardContent></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Income Breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base">รายละเอียดรายได้</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>ค่าโต๊ะ</span><span className="font-medium">{fmt(report.totalTableCharge)}</span></div>
                <div className="flex justify-between"><span>ยอดอาหาร</span><span className="font-medium">{fmt(report.totalFoodIncome)}</span></div>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base">รายละเอียดรายจ่าย</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(expensesByCategory).length === 0 ? (
                  <p className="text-muted-foreground">ไม่มีรายจ่าย</p>
                ) : (
                  Object.entries(expensesByCategory).map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between"><span>{cat}</span><span className="font-medium text-red-600">{fmt(amt)}</span></div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Filtered Summary */}
            {filterTable && (
              <Card>
                <CardHeader><CardTitle className="text-base">โต๊ะ: {filterTable}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>เซสชัน</span><span className="font-medium">{filteredSessions.length}</span></div>
                  <div className="flex justify-between"><span>ค่าโต๊ะ</span><span className="font-medium">{fmt(filteredTableCharge)}</span></div>
                  <div className="flex justify-between"><span>ยอดอาหาร</span><span className="font-medium">{fmt(filteredFoodIncome)}</span></div>
                  <div className="flex justify-between font-bold"><span>รายได้รวม</span><span>{fmt(filteredIncome)}</span></div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sessions Table with Filter */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">เซสชัน</CardTitle>
              <Select value={filterTable || "ALL"} onValueChange={(v) => setFilterTable(v === "ALL" ? "" : v)}>
                <SelectTrigger className="w-48"><SelectValue placeholder="ทุกโต๊ะ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทุกโต๊ะ</SelectItem>
                  {tables.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>โต๊ะ</TableHead><TableHead>เริ่ม</TableHead><TableHead>ระยะเวลา</TableHead><TableHead className="text-right">ค่าโต๊ะ</TableHead><TableHead className="text-right">อาหาร</TableHead><TableHead className="text-right">รวม</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredSessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.tableName}</TableCell>
                        <TableCell className="text-sm">{s.startTime?.slice(0, 16).replace("T", " ")}</TableCell>
                        <TableCell>{Math.round(s.durationMins)}m</TableCell>
                        <TableCell className="text-right">{fmt(s.tableCharge)}</TableCell>
                        <TableCell className="text-right">{fmt(s.foodTotal)}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(s.grandTotal)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredSessions.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">ไม่พบเซสชัน</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
