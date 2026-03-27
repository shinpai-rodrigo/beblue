import { z } from 'zod';

const documentRegex = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/;

export const createEmployeeSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  document: z
    .string({ required_error: 'CPF é obrigatório' })
    .regex(documentRegex, 'CPF inválido'),
  email: z.string().email('E-mail inválido').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  hireDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  active: z.boolean().default(true),
  createUser: z.boolean().default(false),
  userEmail: z.string().email('E-mail do usuário inválido').optional().nullable(),
  userPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().nullable(),
  userRole: z.enum(['ADMIN', 'FINANCEIRO', 'COMERCIAL', 'OPERACAO', 'VISUALIZADOR']).optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({
  createUser: true,
  userEmail: true,
  userPassword: true,
  userRole: true,
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
