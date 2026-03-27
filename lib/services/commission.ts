import { prisma } from '@/lib/db';
import { toNumber } from '@/lib/types';
import { calculateCampaignMargin } from './margin';

export async function generateCommissions(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      client: { select: { clientType: true } },
    },
  });

  if (!campaign) {
    throw new Error('Campanha não encontrada');
  }

  const clientType = campaign.client.clientType || 'DIRETO';
  const marginResult = await calculateCampaignMargin(campaignId);
  const now = new Date();
  const commissions: any[] = [];

  // Executive commission
  if (campaign.executiveId) {
    const rule = await prisma.commissionRule.findFirst({
      where: {
        role: 'EXECUTIVO',
        clientType,
        active: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      orderBy: { validFrom: 'desc' },
    });

    if (rule) {
      const percentage = toNumber(rule.percentage);
      let basisValue: number;
      if (rule.basis === 'VALOR_VENDIDO') {
        basisValue = marginResult.soldValue;
      } else {
        basisValue = marginResult.margin;
      }
      const calculatedValue = (percentage / 100) * basisValue;

      const existing = await prisma.commission.findFirst({
        where: {
          campaignId,
          employeeId: campaign.executiveId,
          role: 'EXECUTIVO',
          deletedAt: null,
          status: { notIn: ['CANCELADA'] },
        },
      });

      if (!existing) {
        const commission = await prisma.commission.create({
          data: {
            campaignId,
            employeeId: campaign.executiveId,
            ruleId: rule.id,
            role: 'EXECUTIVO',
            basis: rule.basis,
            basisValue,
            percentage,
            calculatedValue,
            status: 'CALCULADA',
          },
        });
        commissions.push(commission);
      }
    }
  }

  // Operation commission
  if (campaign.operationId) {
    const rule = await prisma.commissionRule.findFirst({
      where: {
        role: 'OPERACAO',
        clientType,
        active: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
      orderBy: { validFrom: 'desc' },
    });

    if (rule) {
      const percentage = toNumber(rule.percentage);
      let basisValue: number;
      if (rule.basis === 'VALOR_VENDIDO') {
        basisValue = marginResult.soldValue;
      } else {
        basisValue = marginResult.margin;
      }
      const calculatedValue = (percentage / 100) * basisValue;

      const existing = await prisma.commission.findFirst({
        where: {
          campaignId,
          employeeId: campaign.operationId,
          role: 'OPERACAO',
          deletedAt: null,
          status: { notIn: ['CANCELADA'] },
        },
      });

      if (!existing) {
        const commission = await prisma.commission.create({
          data: {
            campaignId,
            employeeId: campaign.operationId,
            ruleId: rule.id,
            role: 'OPERACAO',
            basis: rule.basis,
            basisValue,
            percentage,
            calculatedValue,
            status: 'CALCULADA',
          },
        });
        commissions.push(commission);
      }
    }
  }

  return commissions;
}

export async function recalculateCommission(commissionId: string) {
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
    include: {
      campaign: {
        include: { client: { select: { clientType: true } } },
      },
      rule: true,
    },
  });

  if (!commission) {
    throw new Error('Comissão não encontrada');
  }

  if (commission.status === 'PAGA' || commission.status === 'CONGELADA') {
    throw new Error('Não é possível recalcular comissão paga ou congelada');
  }

  const marginResult = await calculateCampaignMargin(commission.campaignId);

  let basisValue: number;
  if (commission.basis === 'VALOR_VENDIDO') {
    basisValue = marginResult.soldValue;
  } else {
    basisValue = marginResult.margin;
  }

  const percentage = toNumber(commission.percentage);
  const calculatedValue = (percentage / 100) * basisValue;

  const updated = await prisma.commission.update({
    where: { id: commissionId },
    data: {
      basisValue,
      calculatedValue,
      status: 'CALCULADA',
    },
  });

  return updated;
}

export async function freezeCommissions(campaignId: string): Promise<void> {
  await prisma.commission.updateMany({
    where: {
      campaignId,
      status: { in: ['CALCULADA', 'APROVADA'] },
      deletedAt: null,
    },
    data: {
      status: 'CONGELADA',
    },
  });
}
