import { z } from 'zod';

export const createReimbursementSchema = z.object({
  employeeId: z.string({ required_error: 'Funcionário é obrigatório' }).uuid('ID do funcionário inválido'),
  campaignId: z.string().uuid('ID da campanha inválido').optional().nullable(),
  category: z
    .string({ required_error: 'Categoria é obrigatória' })
    .min(1, 'Categoria é obrigatória'),
  description: z.string().optional().nullable(),
  requestedValue: z
    .number({ required_error: 'Valor solicitado é obrigatório' })
    .positive('Valor solicitado deve ser positivo'),
  receiptDate: z.string().optional().nullable(),
  receiptUrl: z.string().url('URL do comprovante inválida').optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateReimbursementSchema = z.object({
  category: z.string().optional(),
  description: z.string().optional().nullable(),
  requestedValue: z.number().positive('Valor deve ser positivo').optional(),
  approvedValue: z.number().nonnegative('Valor aprovado não pode ser negativo').optional().nullable(),
  status: z.enum([
    'ENVIADO', 'EM_ANALISE', 'APROVADO', 'APROVADO_PARCIAL', 'REJEITADO', 'PAGO',
  ]).optional(),
  rejectionReason: z.string().optional().nullable(),
  paidDate: z.string().optional().nullable(),
  paymentMethod: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateReimbursementInput = z.infer<typeof createReimbursementSchema>;
export type UpdateReimbursementInput = z.infer<typeof updateReimbursementSchema>;
