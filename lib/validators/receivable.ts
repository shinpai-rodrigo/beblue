import { z } from 'zod';

export const createReceivableSchema = z.object({
  clientId: z.string().uuid('ID do cliente inválido').optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  issueDate: z.string().optional().nullable(),
  value: z
    .number({ required_error: 'Valor é obrigatório' })
    .positive('Valor deve ser positivo'),
  dueDate: z
    .string({ required_error: 'Data de vencimento é obrigatória' }),
  installment: z.number().int().positive().optional().nullable(),
  totalInstallments: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateReceivableSchema = z.object({
  clientId: z.string().uuid('ID do cliente inválido').optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  issueDate: z.string().optional().nullable(),
  value: z.number().positive('Valor deve ser positivo').optional(),
  dueDate: z.string().optional(),
  installment: z.number().int().positive().optional().nullable(),
  totalInstallments: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['PENDENTE', 'RECEBIDO', 'VENCIDO', 'CANCELADO']).optional(),
  receivedDate: z.string().optional().nullable(),
  receivedValue: z.number().nonnegative().optional().nullable(),
  paymentMethod: z.string().max(50).optional().nullable(),
});

export type CreateReceivableInput = z.infer<typeof createReceivableSchema>;
export type UpdateReceivableInput = z.infer<typeof updateReceivableSchema>;
