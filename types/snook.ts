export interface Table {
  id: string;
  name: string;
  type: string;
  status: string;
  ratePerHour: number;
  description: string;
  createdDate: string;
}

export interface TableSession {
  id: string;
  tableId: string;
  tableName: string;
  tableType: string;
  ratePerHour: number;
  status: string;
  startTime: string;
  endTime?: string;
  pausedAt?: string;
  totalPausedMins: number;
  durationMins: number;
  tableCharge: number;
  foodTotal: number;
  discount: number;
  promotionId?: string;
  promotionName: string;
  promotionDiscount: number;
  grandTotal: number;
  note: string;
  createdDate: string;
}

export interface TableSessionDetail extends TableSession {
  orders: TableOrder[];
  payments: Payment[];
}

export interface Booking {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  note: string;
  createdDate: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  createdDate: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  status: string;
  imageUrl: string;
  createdDate: string;
}

export interface TableOrder {
  id: string;
  sessionId: string;
  menuItemId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  discount: number;
  total: number;
  createdDate: string;
}

export interface Payment {
  id: string;
  sessionId: string;
  type: string;
  amount: number;
  note: string;
  createdDate: string;
}

export interface Creditor {
  id: string;
  sessionId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paidAmount: number;
  remaining: number;
  status: string;
  note: string;
  dueDate?: string;
  createdDate: string;
}

export interface CreditorPayment {
  id: string;
  creditorId: string;
  amount: number;
  type: string;
  note: string;
  createdDate: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: string;
  playHours: number;
  freeHours: number;
  discountPct: number;
  discountAmt: number;
  tableTypes: string[];
  startDate: string;
  endDate: string;
  status: string;
  createdDate: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  createdDate: string;
}

export interface Setting {
  id?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyTaxId: string;
  receiptFooter: string;
  promptPayId: string;
}

export interface SessionSummary {
  totalSessions: number;
  totalRevenue: number;
  totalTable: number;
  totalFood: number;
}

export interface SessionDailyChart {
  date: string;
  totalSessions: number;
  totalRevenue: number;
}

export interface LowStockMenuItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
}

export interface RevenueReport {
  startDate: string;
  endDate: string;
  totalSessions: number;
  totalIncome: number;
  totalTableCharge: number;
  totalFoodIncome: number;
  totalExpense: number;
  netProfit: number;
  sessions: TableSession[];
  expenses: Expense[];
}
