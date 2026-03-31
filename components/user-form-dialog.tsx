"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UmUser } from "@/types/um";

interface CreateUserForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  username: string;
  password: string;
  clientId: string;
}

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserForm) => Promise<void>;
  loading?: boolean;
  clientId: string;
}

export function CreateUserDialog({ open, onOpenChange, onSubmit, loading, clientId }: CreateDialogProps) {
  const [form, setForm] = useState<CreateUserForm>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    clientId: "",
  });

  useEffect(() => {
    if (open) {
      setForm({ firstName: "", lastName: "", phone: "", email: "", username: "", password: "", clientId });
    }
  }, [open, clientId]);

  const handleChange = (field: keyof CreateUserForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>สร้างผู้ใช้</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="c-firstName">ชื่อ</Label>
              <Input id="c-firstName" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-lastName">นามสกุล</Label>
              <Input id="c-lastName" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-username">ชื่อผู้ใช้ *</Label>
            <Input id="c-username" value={form.username} onChange={(e) => handleChange("username", e.target.value)} required minLength={3} maxLength={50} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-password">รหัสผ่าน *</Label>
            <Input id="c-password" type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} required minLength={8} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="c-email">อีเมล</Label>
              <Input id="c-email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-phone">โทรศัพท์</Label>
              <Input id="c-phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>ยกเลิก</Button>
            <Button type="submit" disabled={loading}>{loading ? "กำลังสร้าง..." : "สร้าง"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface UpdateUserForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UmUser | null;
  onSubmit: (id: string, data: UpdateUserForm) => Promise<void>;
  loading?: boolean;
}

export function EditUserDialog({ open, onOpenChange, user, onSubmit, loading }: EditDialogProps) {
  const [form, setForm] = useState<UpdateUserForm>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleChange = (field: keyof UpdateUserForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) await onSubmit(user.id, form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>แก้ไขผู้ใช้</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="e-firstName">ชื่อ *</Label>
              <Input id="e-firstName" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} required minLength={1} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="e-lastName">นามสกุล *</Label>
              <Input id="e-lastName" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} required minLength={1} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="e-email">อีเมล</Label>
            <Input id="e-email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="e-phone">โทรศัพท์</Label>
            <Input id="e-phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>ยกเลิก</Button>
            <Button type="submit" disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UmUser | null;
  onSubmit: (id: string, password: string) => Promise<void>;
  loading?: boolean;
}

export function SetPasswordDialog({ open, onOpenChange, user, onSubmit, loading }: SetPasswordDialogProps) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (open) setPassword("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) await onSubmit(user.id, password);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>ตั้งรหัสผ่านสำหรับ {user?.username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="sp-password">รหัสผ่านใหม่ *</Label>
            <Input id="sp-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>ยกเลิก</Button>
            <Button type="submit" disabled={loading}>{loading ? "กำลังตั้งค่า..." : "ตั้งรหัสผ่าน"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
