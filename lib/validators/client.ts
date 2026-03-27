import { z } from 'zod';

const documentRegex = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14})$/;

export const createClientSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  tradeName: z.string().max(255).optional().nullable(),
  document: z
    .string({ required_error: 'Documento é obrigatório' })
    .regex(documentRegex, 'Documento inválido. Use formato CPF ou CNPJ'),
  email: z.string().email('E-mail inválido').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zipCode: z.string().max(10).optional().nullable(),
  clientType: z.enum(['NOVO', 'CASA'], {
    errorMap: () => ({ message: 'Tipo de cliente deve ser NOVO ou CASA' }),
  }).default('NOVO'),
  notes: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
