import { prisma } from '@/lib/db';
import { toNumber } from '@/lib/types';

export interface ReimbursementRuleResult {
  approvedValue: number;
  isPartial: boolean;
}

export async function applyReimbursementRules(
  category: string,
  requestedValue: number
): Promise<ReimbursementRuleResult> {
  const rule = await prisma.reimbursementRule.findFirst({
    where: {
      category,
      active: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!rule) {
    return {
      approvedValue: requestedValue,
      isPartial: false,
    };
  }

  const maxValuePerDay = toNumber(rule.maxValuePerDay);

  if (maxValuePerDay > 0 && requestedValue > maxValuePerDay) {
    return {
      approvedValue: maxValuePerDay,
      isPartial: true,
    };
  }

  return {
    approvedValue: requestedValue,
    isPartial: false,
  };
}
