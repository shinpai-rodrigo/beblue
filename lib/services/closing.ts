import { prisma } from '@/lib/db';
import { toNumber } from '@/lib/types';

export interface ClosingEntry {
  description: string;
  type: 'ENTRADA' | 'SAIDA';
  value: number;
  category: string;
  referenceId?: string;
}

export interface WeeklyTotals {
  totalIncome: number;
  totalExpenses: number;
  entries: ClosingEntry[];
}

export async function calculateWeeklyTotals(
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyTotals> {
  const entries: ClosingEntry[] = [];
  let totalIncome = 0;
  let totalExpenses = 0;

  // Income: receivables received in the period
  const receivables = await prisma.receivable.findMany({
    where: {
      receivedDate: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: 'PAGA',
    },
    include: {
      campaign: { select: { name: true } },
      client: { select: { name: true } },
    },
  });

  for (const r of receivables) {
    const value = toNumber(r.receivedValue || r.value);
    totalIncome += value;
    entries.push({
      description: `NF ${r.invoiceNumber || 'S/N'} - ${r.client?.name || r.campaign?.name || 'Campanha'}`,
      type: 'ENTRADA',
      value,
      category: 'RECEBIVEL',
      referenceId: r.id,
    });
  }

  // Expenses: influencer payments in the period
  const influencerPayments = await prisma.influencerPayment.findMany({
    where: {
      paymentDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      campaignInfluencer: {
        select: {
          name: true,
          campaign: { select: { name: true } },
        },
      },
    },
  });

  for (const p of influencerPayments) {
    const value = toNumber(p.value);
    totalExpenses += value;
    entries.push({
      description: `Pgto influenciador ${p.campaignInfluencer.name} - ${p.campaignInfluencer.campaign?.name || ''}`,
      type: 'SAIDA',
      value,
      category: 'INFLUENCIADOR',
      referenceId: p.id,
    });
  }

  // Expenses: reimbursements paid in the period
  const reimbursements = await prisma.reimbursement.findMany({
    where: {
      paidDate: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: 'PAGO',
    },
    include: {
      employee: { select: { name: true } },
    },
  });

  for (const r of reimbursements) {
    const value = toNumber(r.approvedValue || r.requestedValue);
    totalExpenses += value;
    entries.push({
      description: `Reembolso ${r.category} - ${r.employee.name}`,
      type: 'SAIDA',
      value,
      category: 'REEMBOLSO',
      referenceId: r.id,
    });
  }

  // Expenses: commissions paid in the period
  const commissions = await prisma.commission.findMany({
    where: {
      paidDate: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: 'PAGA',
    },
    include: {
      employee: { select: { name: true } },
      campaign: { select: { name: true } },
    },
  });

  for (const c of commissions) {
    const value = toNumber(c.paidValue || c.calculatedValue);
    totalExpenses += value;
    entries.push({
      description: `Comissão ${c.basis} - ${c.employee.name} (${c.campaign?.name || ''})`,
      type: 'SAIDA',
      value,
      category: 'COMISSAO',
      referenceId: c.id,
    });
  }

  return { totalIncome, totalExpenses, entries };
}
