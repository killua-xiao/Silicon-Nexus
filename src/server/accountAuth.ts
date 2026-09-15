import { z } from 'zod';

export const accountCredentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

export const registerBodySchema = accountCredentialsSchema.extend({
  acceptLegal: z.literal(true),
});
