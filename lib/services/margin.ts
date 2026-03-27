import { prisma } from '@/lib/db';
import { toNumber } from '@/lib/types';

export interface MarginResult {
  soldValue: number;
  totalInfluencers: number;
  totalReimbursements: number;
  margin: number;
  marginPercent: number;
}

export async function calculateCampaignMargin(campaignId: string): Promise<MarginResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      influencers: {
        where: { deletedAt: null },
        select: { negotiatedValue: true },
      },
      reimbursements: {
        where: {
          deletedAt: null,
          status: { in: ['APROVADO', 'APROVADO_PARCIAL', 'PAGO'] },
        },
        select: { approvedValue: true },
      },
    },
  });

  if (!campaign) {
    throw new Error('Campanha não encontrada');
  }

  const soldValue = toNumber(campaign.soldValue);

  const totalInfluencers = campaign.influencers.reduce(
    (sum, inf) => sum + toNumber(inf.negotiatedValue),
    0
  );

  const totalReimbursements = campaign.reimbursements.reduce(
    (sum, r) => sum + toNumber(r.approvedValue),
    0
  );

  const margin = soldValue - totalInfluencers - totalReimbursements;
  const marginPercent = soldValue > 0 ? (margin / soldValue) * 100 : 0;

  return {
    soldValue,
    totalInfluencers,
    totalReimbursements,
    margin,
    marginPercent: Math.round(marginPercent * 100) / 100,
  };
}
