import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .email('E-mail inválido'),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
