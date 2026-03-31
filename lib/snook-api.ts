import axios from "axios";
import { getToken, getSnookApiHost } from "./auth";
import type {
  Table,
  TableSession,
  TableSessionDetail,
  Booking,
  MenuCategory,
  MenuItem,
  TableOrder,
  Payment,
  Creditor,
  CreditorPayment,
  Promotion,
  Expense,
  Setting,
  SessionSummary,
  SessionDailyChart,
  LowStockMenuItem,
  RevenueReport,
} from "@/types/snook";

const snookApi = axios.create();

snookApi.interceptors.request.use((config) => {
  const host = getSnookApiHost();
  if (host) config.baseURL = `${host}/api/snook/v1`;
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Tables ─────────────────────────────────────────
export const getTables = () => snookApi.get<Table[]>("/tables").then((r) => r.data);
export const createTable = (data: Partial<Table>) => snookApi.post<Table>("/tables", data).then((r) => r.data);
export const updateTable = (id: string, data: Partial<Table>) => snookApi.put(`/tables/${id}`, data).then((r) => r.data);
export const deleteTable = (id: string) => snookApi.delete(`/tables/${id}`).then((r) => r.data);
export const updateTableStatus = (id: string, status: string) => snookApi.patch(`/tables/${id}/status`, { status }).then((r) => r.data);

// ─── Sessions ───────────────────────────────────────
export const getTableSessions = (startDate: string, endDate: string) =>
  snookApi.get<TableSession[]>("/sessions", { params: { startDate, endDate } }).then((r) => r.data);
export const getTableSessionById = (id: string) =>
  snookApi.get<TableSessionDetail>(`/sessions/${id}`).then((r) => r.data);
export const getActiveSession = (tableId: string) =>
  snookApi.get<TableSession | null>(`/sessions/table/${tableId}/active`).then((r) => r.data);
export const openTable = (tableId: string) =>
  snookApi.post<TableSession>("/sessions/open", { tableId }).then((r) => r.data);
export const closeTable = (sessionId: string, data?: { tableCharge?: number; discount?: number; note?: string; paymentType?: string; paymentNote?: string }) =>
  snookApi.post<TableSession>(`/sessions/${sessionId}/close`, data || {}).then((r) => r.data);
export const pauseTable = (sessionId: string) =>
  snookApi.post<TableSession>(`/sessions/${sessionId}/pause`).then((r) => r.data);
export const resumeTable = (sessionId: string) =>
  snookApi.post<TableSession>(`/sessions/${sessionId}/resume`).then((r) => r.data);
export const transferTable = (sessionId: string, newTableId: string) =>
  snookApi.post<TableSession>(`/sessions/${sessionId}/transfer`, { newTableId }).then((r) => r.data);
export const applyPromotion = (sessionId: string, promotionId: string) =>
  snookApi.post<TableSession>(`/sessions/${sessionId}/apply-promotion`, { promotionId }).then((r) => r.data);

// ─── Bookings ───────────────────────────────────────
export const getBookings = (startDate: string, endDate: string) =>
  snookApi.get<Booking[]>("/bookings", { params: { startDate, endDate } }).then((r) => r.data);
export const createBooking = (data: Partial<Booking>) => snookApi.post<Booking>("/bookings", data).then((r) => r.data);
export const updateBooking = (id: string, data: Partial<Booking>) => snookApi.put(`/bookings/${id}`, data).then((r) => r.data);
export const updateBookingStatus = (id: string, status: string) => snookApi.patch(`/bookings/${id}/status`, { status }).then((r) => r.data);
export const getBookingById = (id: string) => snookApi.get<Booking>(`/bookings/${id}`).then((r) => r.data);
export const deleteBooking = (id: string) => snookApi.delete(`/bookings/${id}`).then((r) => r.data);

// ─── Menu Categories ────────────────────────────────
export const getMenuCategories = () => snookApi.get<MenuCategory[]>("/menu-categories").then((r) => r.data);
export const createMenuCategory = (data: Partial<MenuCategory>) => snookApi.post<MenuCategory>("/menu-categories", data).then((r) => r.data);
export const updateMenuCategory = (id: string, data: Partial<MenuCategory>) => snookApi.put(`/menu-categories/${id}`, data).then((r) => r.data);
export const deleteMenuCategory = (id: string) => snookApi.delete(`/menu-categories/${id}`).then((r) => r.data);

// ─── Menu Items ─────────────────────────────────────
export const getMenuItems = (category?: string) =>
  snookApi.get<MenuItem[]>("/menu-items", { params: category ? { category } : {} }).then((r) => r.data);
export const getMenuItemById = (id: string) => snookApi.get<MenuItem>(`/menu-items/${id}`).then((r) => r.data);
export const createMenuItem = (data: Partial<MenuItem>) => snookApi.post<MenuItem>("/menu-items", data).then((r) => r.data);
export const updateMenuItem = (id: string, data: Partial<MenuItem>) => snookApi.put(`/menu-items/${id}`, data).then((r) => r.data);
export const deleteMenuItem = (id: string) => snookApi.delete(`/menu-items/${id}`).then((r) => r.data);
export const updateMenuItemQuantity = (id: string, quantity: number) => snookApi.patch(`/menu-items/${id}/quantity`, { quantity }).then((r) => r.data);
export const getLowStockMenuItems = (threshold?: number) =>
  snookApi.get<LowStockMenuItem[]>("/menu-items/low-stock", { params: threshold ? { threshold } : {} }).then((r) => r.data);

// ─── Table Orders ───────────────────────────────────
export const getOrdersBySession = (sessionId: string) =>
  snookApi.get<TableOrder[]>(`/table-orders/session/${sessionId}`).then((r) => r.data);
export const createTableOrder = (data: { sessionId: string; menuItemId: string; quantity: number; discount?: number }) =>
  snookApi.post<TableOrder>("/table-orders", data).then((r) => r.data);
export const deleteTableOrder = (id: string) => snookApi.delete(`/table-orders/${id}`).then((r) => r.data);

// ─── Payments ───────────────────────────────────────
export const getPaymentsBySession = (sessionId: string) =>
  snookApi.get<Payment[]>(`/payments/session/${sessionId}`).then((r) => r.data);
export const getPayments = (startDate: string, endDate: string) =>
  snookApi.get<Payment[]>("/payments", { params: { startDate, endDate } }).then((r) => r.data);
export const createPayment = (data: { sessionId: string; type: string; amount: number; note?: string }) =>
  snookApi.post<Payment>("/payments", data).then((r) => r.data);
export const deletePayment = (id: string) => snookApi.delete(`/payments/${id}`).then((r) => r.data);

// ─── Creditors ──────────────────────────────────────
export const getCreditors = (status?: string) =>
  snookApi.get<Creditor[]>("/creditors", { params: status ? { status } : {} }).then((r) => r.data);
export const getCreditorById = (id: string) => snookApi.get<Creditor>(`/creditors/${id}`).then((r) => r.data);
export const getCreditorPayments = (id: string) =>
  snookApi.get<CreditorPayment[]>(`/creditors/${id}/payments`).then((r) => r.data);
export const payCreditor = (id: string, data: { amount: number; type: string; note?: string }) =>
  snookApi.post<Creditor>(`/creditors/${id}/pay`, data).then((r) => r.data);

// ─── Promotions ─────────────────────────────────────
export const getPromotions = () => snookApi.get<Promotion[]>("/promotions").then((r) => r.data);
export const getActivePromotions = (tableType?: string) =>
  snookApi.get<Promotion[]>("/promotions/active", { params: tableType ? { tableType } : {} }).then((r) => r.data);
export const getPromotionById = (id: string) => snookApi.get<Promotion>(`/promotions/${id}`).then((r) => r.data);
export const createPromotion = (data: Partial<Promotion>) => snookApi.post<Promotion>("/promotions", data).then((r) => r.data);
export const updatePromotion = (id: string, data: Partial<Promotion>) => snookApi.put(`/promotions/${id}`, data).then((r) => r.data);
export const deletePromotion = (id: string) => snookApi.delete(`/promotions/${id}`).then((r) => r.data);

// ─── Expenses ───────────────────────────────────────
export const getExpenses = (startDate: string, endDate: string) =>
  snookApi.get<Expense[]>("/expenses", { params: { startDate, endDate } }).then((r) => r.data);
export const createExpense = (data: Partial<Expense>) => snookApi.post<Expense>("/expenses", data).then((r) => r.data);
export const updateExpense = (id: string, data: Partial<Expense>) => snookApi.put(`/expenses/${id}`, data).then((r) => r.data);
export const deleteExpense = (id: string) => snookApi.delete(`/expenses/${id}`).then((r) => r.data);

// ─── Settings ───────────────────────────────────────
export const getSetting = () => snookApi.get<Setting>("/settings").then((r) => r.data);
export const updateSetting = (data: Partial<Setting>) => snookApi.put("/settings", data).then((r) => r.data);

// ─── Dashboard ──────────────────────────────────────
export const getDashboardSummary = (startDate: string, endDate: string) =>
  snookApi.get<SessionSummary>("/dashboard/summary", { params: { startDate, endDate } }).then((r) => r.data);
export const getDailyChart = (startDate: string, endDate: string) =>
  snookApi.get<SessionDailyChart[]>("/dashboard/daily-chart", { params: { startDate, endDate } }).then((r) => r.data);
export const getDashboardLowStock = (threshold?: number) =>
  snookApi.get<LowStockMenuItem[]>("/dashboard/low-stock", { params: threshold ? { threshold } : {} }).then((r) => r.data);

// ─── Reports ────────────────────────────────────────
export const getRevenueReport = (startDate: string, endDate: string) =>
  snookApi.get<RevenueReport>("/reports/revenue", { params: { startDate, endDate } }).then((r) => r.data);
export const getRevenueByTable = (tableId: string, startDate: string, endDate: string) =>
  snookApi.get<TableSession[]>(`/reports/revenue/by-table/${tableId}`, { params: { startDate, endDate } }).then((r) => r.data);

export default snookApi;
