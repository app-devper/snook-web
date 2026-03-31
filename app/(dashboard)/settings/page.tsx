"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getSetting, updateSetting } from "@/lib/snook-api";
import { getUserInfo, updateUserInfo, changePassword } from "@/lib/um-api";
import type { Setting } from "@/types/snook";
import type { UmUser } from "@/types/um";
import { toast } from "sonner";

export default function SettingsPage() {
  const [setting, setSetting] = useState<Setting>({ companyName: "", companyAddress: "", companyPhone: "", companyTaxId: "", receiptFooter: "", promptPayId: "" });
  const [user, setUser] = useState<UmUser | null>(null);
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "" });

  useEffect(() => {
    getSetting().then((r) => { if (r) setSetting(r); }).catch(() => {});
    getUserInfo().then((u) => { setUser(u); setProfileForm({ firstName: u.firstName, lastName: u.lastName, phone: u.phone, email: u.email }); }).catch(() => {});
  }, []);

  const handleSaveSetting = async () => {
    try { await updateSetting(setting); toast.success("บันทึกแล้ว"); } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleSaveProfile = async () => {
    try { await updateUserInfo(profileForm); toast.success("อัปเดตโปรไฟล์แล้ว"); } catch { toast.error("ไม่สำเร็จ"); }
  };

  const handleChangePassword = async () => {
    try { await changePassword(pwForm); toast.success("เปลี่ยนรหัสผ่านแล้ว"); setPwForm({ oldPassword: "", newPassword: "" }); } catch { toast.error("ไม่สำเร็จ"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ตั้งค่า</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>ตั้งค่าร้าน</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>ชื่อบริษัท</Label><Input value={setting.companyName} onChange={(e) => setSetting({ ...setting, companyName: e.target.value })} /></div>
            <div className="space-y-1"><Label>ที่อยู่</Label><Input value={setting.companyAddress} onChange={(e) => setSetting({ ...setting, companyAddress: e.target.value })} /></div>
            <div className="space-y-1"><Label>โทรศัพท์</Label><Input value={setting.companyPhone} onChange={(e) => setSetting({ ...setting, companyPhone: e.target.value })} /></div>
            <div className="space-y-1"><Label>เลขประจำตัวผู้เสียภาษี</Label><Input value={setting.companyTaxId} onChange={(e) => setSetting({ ...setting, companyTaxId: e.target.value })} /></div>
            <div className="space-y-1"><Label>ท้ายใบเสร็จ</Label><Input value={setting.receiptFooter} onChange={(e) => setSetting({ ...setting, receiptFooter: e.target.value })} /></div>
            <div className="space-y-1"><Label>PromptPay ID</Label><Input value={setting.promptPayId} onChange={(e) => setSetting({ ...setting, promptPayId: e.target.value })} /></div>
            <Button onClick={handleSaveSetting}>บันทึกการตั้งค่า</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>โปรไฟล์</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">ชื่อผู้ใช้: <span className="font-medium">{user?.username}</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>ชื่อ</Label><Input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} /></div>
                <div className="space-y-1"><Label>นามสกุล</Label><Input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>โทรศัพท์</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>อีเมล</Label><Input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></div>
              <Button onClick={handleSaveProfile}>อัปเดตโปรไฟล์</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>เปลี่ยนรหัสผ่าน</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>รหัสผ่านปัจจุบัน</Label><Input type="password" value={pwForm.oldPassword} onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })} /></div>
              <div className="space-y-1"><Label>รหัสผ่านใหม่</Label><Input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
              <Button onClick={handleChangePassword}>เปลี่ยนรหัสผ่าน</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
