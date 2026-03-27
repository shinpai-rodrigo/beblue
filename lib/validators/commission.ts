import { z } from 'zod';

export const commissionRuleSchema = z.object({
  role: z.enum(['COMERCIAL', 'OPERACAO'], {
    errorMap: () => ({ message: 'Papel deve ser COMERCIAL ou OPERACAO' }),
  }),
  clientType: z.enum(['NOVO', 'CASA'], {
    errorMap: () => ({ message: 'Tipo de cliente deve ser NOVO ou CASA' }),
  }),
  basis: z.enum(['VALOR_VENDIDO', 'MARGEM'], {
    errorMap: () => ({ message: 'Base de cálculo deve ser VALOR_VENDIDO ou MARGEM' }),
  }),
  percentage: z
    .number({ required_error: 'Percentual é obrigatório' })
    .min(0, 'Percentual não pode ser negativo')
    .max(100, 'Percentual não pode exceder 100'),
  validFrom: z.string({ required_error: 'Data de início é obrigatória' }),
  validUntil: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const updateCommissionSchema = z.object({
  status: z.enum([
    'CALCULADA', 'APROVADA', 'PAGA', 'CANCELADA',
  ]).optional(),
  paidDate: z.string().optional().nullable(),
  paidValue: z.number().nonnegative().optional().nullable(),
  paymentMethod: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CommissionRuleInput = z.infer<typeof commissionRuleSchema>;
export type UpdateCommissionInput = z.infer<typeof updateCommissionSchema>;
