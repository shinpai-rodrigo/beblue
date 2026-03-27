import { z } from 'zod';

export const createClosingSchema = z.object({
  weekStart: z.string({ required_error: 'Data de início da semana é obrigatória' }),
  weekEnd: z.string({ required_error: 'Data de fim da semana é obrigatória' }),
  openingBalance: z
    .number({ required_error: 'Saldo de abertura é obrigatório' })
    .default(0),
  actualBalance: z
    .number({ required_error: 'Saldo real é obrigatório' }),
  notes: z.string().optional().nullable(),
});

export const updateClosingSchema = z.object({
  actualBalance: z.number().optional(),
  status: z.enum(['ABERTO', 'FECHADO']).optional(),
  justification: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateClosingInput = z.infer<typeof createClosingSchema>;
export type UpdateClosingInput = z.infer<typeof updateClosingSchema>;
