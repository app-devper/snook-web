import axios from "axios";
import { getToken } from "./auth";
import type {
  LoginRequest,
  LoginResponse,
  KeepAliveResponse,
  UmSystem,
  UmUser,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "@/types/um";

const umApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_UM_API_URL || "http://localhost:8585/api/um/v1",
});

umApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await umApi.post<LoginResponse>("/auth/login", data);
  return res.data;
}

export async function keepAlive(): Promise<KeepAliveResponse> {
  const res = await umApi.get<KeepAliveResponse>("/auth/keep-alive");
  return res.data;
}

export async function getSystem(): Promise<UmSystem> {
  const res = await umApi.get<UmSystem>("/auth/system");
  return res.data;
}

export async function logout(): Promise<void> {
  await umApi.post("/auth/logout");
}

export async function getUserInfo(): Promise<UmUser> {
  const res = await umApi.get<UmUser>("/user/info");
  return res.data;
}

export async function updateUserInfo(data: UpdateUserRequest): Promise<void> {
  await umApi.put("/user/info", data);
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await umApi.put("/user/change-password", data);
}

export async function getUsers(): Promise<UmUser[]> {
  const res = await umApi.get<UmUser[]>("/user");
  return res.data;
}

export async function createUser(data: { firstName: string; lastName: string; username: string; password: string; clientId: string; phone?: string; email?: string }): Promise<UmUser> {
  const res = await umApi.post<UmUser>("/user", data);
  return res.data;
}

export async function updateUser(id: string, data: { firstName: string; lastName: string; phone?: string; email?: string }): Promise<UmUser> {
  const res = await umApi.put<UmUser>(`/user/${id}`, data);
  return res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await umApi.delete(`/user/${id}`);
}

export async function updateUserStatus(id: string, status: string): Promise<UmUser> {
  const res = await umApi.patch<UmUser>(`/user/${id}/status`, { status });
  return res.data;
}

export async function updateUserRole(id: string, role: string): Promise<UmUser> {
  const res = await umApi.patch<UmUser>(`/user/${id}/role`, { role });
  return res.data;
}

export async function setUserPassword(id: string, password: string): Promise<void> {
  await umApi.patch(`/user/${id}/set-password`, { password });
}

export default umApi;
