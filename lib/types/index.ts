export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface DashboardData {
  totalSold: number;
  totalReceivable: number;
  totalReceived: number;
  totalPayable: number;
  totalPaid: number;
  totalMargin: number;
  totalCommissionPending: number;
  totalCommissionPaid: number;
  lastClosingDifference: number | null;
  topCampaignsByMargin: CampaignSummary[];
  topCampaignsByRevenue: CampaignSummary[];
  monthlyRevenue: MonthlyRevenue[];
  recentActivity: AuditLogEntry[];
}

export interface CampaignSummary {
  id: string;
  name: string;
  clientName: string;
  soldValue: number;
  margin: number;
  marginPercent: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  expenses: number;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: Date;
}

export interface CampaignDetail {
  id: string;
  name: string;
  status: string;
  soldValue: number;
  client: { id: string; name: string };
  executive: { id: string; name: string } | null;
  operation: { id: string; name: string } | null;
  costCenter: { id: string; name: string } | null;
  influencers: InfluencerDetail[];
  receivables: ReceivableDetail[];
  reimbursements: ReimbursementDetail[];
  commissions: CommissionDetail[];
  totals: CampaignTotals;
}

export interface CampaignTotals {
  totalInfluencers: number;
  totalPaidInfluencers: number;
  totalReimbursements: number;
  totalReceivables: number;
  totalReceived: number;
  totalCommissions: number;
  margin: number;
  marginPercent: number;
}

export interface InfluencerDetail {
  id: string;
  name: string;
  socialHandle: string | null;
  negotiatedValue: number;
  paidValue: number;
  openValue: number;
  status: string;
  payments: PaymentDetail[];
}

export interface PaymentDetail {
  id: string;
  value: number;
  paymentDate: Date;
  paymentMethod: string | null;
  notes: string | null;
}

export interface ReceivableDetail {
  id: string;
  invoiceNumber: string | null;
  value: number;
  dueDate: Date;
  status: string;
  receivedValue: number | null;
  receivedDate: Date | null;
}

export interface ReimbursementDetail {
  id: string;
  category: string;
  requestedValue: number;
  approvedValue: number | null;
  status: string;
  employee: { id: string; name: string };
}

export interface CommissionDetail {
  id: string;
  employee: { id: string; name: string };
  role: string;
  basis: string;
  percentage: number;
  calculatedValue: number;
  status: string;
}

export interface WeeklyClosingDetail {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  status: string;
  entries: ClosingEntry[];
}

export interface ClosingEntry {
  id: string;
  description: string;
  type: string;
  value: number;
  category: string;
}

export type UserRole = 'ADMIN' | 'FINANCEIRO' | 'COMERCIAL' | 'OPERACAO' | 'GESTOR';

export function toNumber(decimal: any): number {
  if (decimal === null || decimal === undefined) return 0;
  return typeof decimal === 'number' ? decimal : Number(decimal);
}
