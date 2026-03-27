import { z } from 'zod';

export const createInfluencerSchema = z.object({
  name: z
    .string({ required_error: 'Nome do influenciador é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  socialHandle: z.string().max(255).optional().nullable(),
  negotiatedValue: z
    .number({ required_error: 'Valor negociado é obrigatório' })
    .nonnegative('Valor negociado não pode ser negativo'),
  negotiationDate: z.string().optional().nullable(),
  paymentDeadline: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateInfluencerSchema = createInfluencerSchema.partial();

export const createPaymentSchema = z.object({
  value: z
    .number({ required_error: 'Valor do pagamento é obrigatório' })
    .positive('Valor do pagamento deve ser positivo'),
  paymentDate: z.string().optional().nullable(),
  paymentMethod: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateInfluencerInput = z.infer<typeof createInfluencerSchema>;
export type UpdateInfluencerInput = z.infer<typeof updateInfluencerSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
