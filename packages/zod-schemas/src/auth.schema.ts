import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const JwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
