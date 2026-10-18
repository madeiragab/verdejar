import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(80),
  email: z.string().trim().email('E-mail inválido').max(160),
  password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
