import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z
    .string({ required_error: 'Nome da campanha é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  clientId: z.string({ required_error: 'Cliente é obrigatório' }).uuid('ID do cliente inválido'),
  executiveId: z.string().uuid('ID do executivo inválido').optional().nullable(),
  operationId: z.string().uuid('ID do operacional inválido').optional().nullable(),
  costCenterId: z.string().uuid('ID do centro de custo inválido').optional().nullable(),
  status: z.enum([
    'RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'PAUSADA',
  ], {
    errorMap: () => ({ message: 'Status inválido' }),
  }).default('RASCUNHO'),
  soldValue: z
    .number({ required_error: 'Valor vendido é obrigatório' })
    .positive('Valor vendido deve ser positivo'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
