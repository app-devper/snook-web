"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardSummary, getDailyChart, getDashboardLowStock } from "@/lib/snook-api";
import type { SessionSummary, SessionDailyChart, LowStockMenuItem } from "@/types/snook";
import { BarChart3, DollarSign, Clock, UtensilsCrossed, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fmt } from "@/lib/utils";

export default function DashboardPage() {
  const [summary, setSummary] = useState<SessionSummary>({ totalSessions: 0, totalRevenue: 0, totalTable: 0, totalFood: 0 });
  const [chart, setChart] = useState<SessionDailyChart[]>([]);
  const [lowStock, setLowStock] = useState<LowStockMenuItem[]>([]);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    getDashboardSummary(today, today).then((r) => setSummary(r || { totalSessions: 0, totalRevenue: 0, totalTable: 0, totalFood: 0 })).catch(() => {});
    getDailyChart(format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd"), today).then((r) => setChart(r || [])).catch(() => {});
    getDashboardLowStock(10).then((r) => setLowStock(r || [])).catch(() => {});
  }, [today]);

  const cards = [
    { title: "เซสชันวันนี้", value: summary.totalSessions, icon: BarChart3, color: "text-blue-600" },
    { title: "รายได้วันนี้", value: `${fmt(summary.totalRevenue)}`, icon: DollarSign, color: "text-green-600" },
    { title: "ค่าโต๊ะ", value: `${fmt(summary.totalTable)}`, icon: Clock, color: "text-purple-600" },
    { title: "ยอดอาหาร", value: `${fmt(summary.totalFood)}`, icon: UtensilsCrossed, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายได้รายวัน (30 วันล่าสุด)</CardTitle>
          </CardHeader>
          <CardContent>
            {chart.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-2">
                {chart.slice(-10).map((d) => (
                  <div key={d.date} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{d.date}</span>
                    <span className="font-medium">{fmt(d.totalRevenue)} ({d.totalSessions} เซสชัน)</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              สินค้าใกล้หมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">สินค้าทุกรายการเพียงพอ</p>
            ) : (
              <div className="space-y-2">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>{item.name} <span className="text-muted-foreground">({item.category})</span></span>
                    <span className="font-medium text-red-600">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
