"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Pencil, Key, ShieldCheck, ToggleLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getUsers, getUserRules, createUser, updateUser, deleteUser, updateUserStatus, updateUserRole, setUserPassword, getSystem } from "@/lib/um-api";
import type { UmUser } from "@/types/um";
import { CreateUserDialog, EditUserDialog, SetPasswordDialog } from "@/components/user-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import axios from "axios";

export default function UsersPage() {
  const [users, setUsers] = useState<UmUser[]>([]);
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UmUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UmUser | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UmUser | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleUser, setRoleUser] = useState<UmUser | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<string>("USER");
  const [canCreate, setCanCreate] = useState(false);
  const [statusUser, setStatusUser] = useState<UmUser | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const [u, rules] = await Promise.all([getUsers(), getUserRules()]);
      setUsers(u || []);
      setCanCreate((rules?.creatableRoles ?? []).length > 0);
    } catch {
      toast.error("โหลดผู้ใช้ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    getSystem().then((s) => setClientId(s.clientId)).catch(() => {});
  }, [fetchUsers]);

  const handleError = (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.data) {
      toast.error((err.response.data as { message?: string }).message || "เกิดข้อผิดพลาด");
    } else {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleCreate = async (data: { firstName: string; lastName: string; username: string; password: string; clientId: string; phone?: string; email?: string }) => {
    setActionLoading(true);
    try {
      await createUser(data);
      toast.success("สร้างผู้ใช้แล้ว");
      setCreateOpen(false);
      fetchUsers();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (id: string, data: { firstName: string; lastName: string; phone?: string; email?: string }) => {
    setActionLoading(true);
    try {
      await updateUser(id, data);
      toast.success("อัปเดตแล้ว");
      setEditOpen(false);
      fetchUsers();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetPassword = async (id: string, password: string) => {
    setActionLoading(true);
    try {
      await setUserPassword(id, password);
      toast.success("ตั้งรหัสผ่านแล้ว");
      setPasswordOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success("ลบผู้ใช้แล้ว");
      setDeleteOpen(false);
      fetchUsers();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!roleUser) return;
    setActionLoading(true);
    try {
      await updateUserRole(roleUser.id, pendingRole);
      toast.success("อัปเดตบทบาทแล้ว");
      setRoleOpen(false);
      fetchUsers();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusUser) return;
    const newStatus = statusUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading(true);
    try {
      await updateUserStatus(statusUser.id, newStatus);
      toast.success(`เปลี่ยนสถานะเป็น ${newStatus}`);
      setStatusOpen(false);
      fetchUsers();
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ผู้ใช้งาน</h1>
          <p className="text-sm text-muted-foreground">จัดการบัญชีผู้ใช้</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มผู้ใช้
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ชื่อผู้ใช้</TableHead>
              <TableHead>บทบาท</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  ไม่พบผู้ใช้
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "SUPER"
                          ? "default"
                          : user.role === "ADMIN"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                  <TableCell>
                    {(() => {
                      // What UM says the signed-in user may do (um-api ADR-0006).
                      const can = user.can;
                      const roleOptions = can?.setRole ? can.assignableRoles.filter((r) => r !== "SUPER") : [];
                      if (!can || !(can.edit || can.setPassword || can.setStatus || can.delete || roleOptions.length > 0)) return null;
                      return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {can.edit && (
                          <DropdownMenuItem
                            onClick={() => {
                              setEditUser(user);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            แก้ไข
                          </DropdownMenuItem>
                        )}
                        {can.setPassword && (
                          <DropdownMenuItem
                            onClick={() => {
                              setPasswordUser(user);
                              setPasswordOpen(true);
                            }}
                          >
                            <Key className="mr-2 h-4 w-4" />
                            ตั้งรหัสผ่าน
                          </DropdownMenuItem>
                        )}
                        {roleOptions.length > 0 && <DropdownMenuSeparator />}
                        {roleOptions.map((role) => (
                          <DropdownMenuItem
                            key={role}
                            disabled={user.role === role}
                            onClick={() => {
                              setRoleUser(user);
                              setPendingRole(role);
                              setRoleOpen(true);
                            }}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            ตั้งเป็น {role}
                          </DropdownMenuItem>
                        ))}
                        {can.setStatus && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setStatusUser(user);
                                setStatusOpen(true);
                              }}
                            >
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              {user.status === "ACTIVE" ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                            </DropdownMenuItem>
                          </>
                        )}
                        {can.delete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDeleteTarget(user);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              ลบ
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} loading={actionLoading} clientId={clientId} />
      <EditUserDialog open={editOpen} onOpenChange={setEditOpen} user={editUser} onSubmit={handleEdit} loading={actionLoading} />
      <SetPasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} user={passwordUser} onSubmit={handleSetPassword} loading={actionLoading} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="ลบผู้ใช้"
        description={`คุณแน่ใจหรือว่าต้องการลบ "${deleteTarget?.username}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={handleDelete}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={roleOpen}
        onOpenChange={setRoleOpen}
        title="เปลี่ยนบทบาท"
        description={`เปลี่ยนบทบาทของ ${roleUser?.username} เป็น ${pendingRole}?`}
        onConfirm={handleChangeRole}
        loading={actionLoading}
        variant="default"
      />

      <ConfirmDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        title="เปลี่ยนสถานะ"
        description={`${statusUser?.status === "ACTIVE" ? "ปิดการใช้งาน" : "เปิดการใช้งาน"} ผู้ใช้ "${statusUser?.username}"?`}
        onConfirm={handleToggleStatus}
        loading={actionLoading}
        variant="default"
      />
    </div>
  );
}
