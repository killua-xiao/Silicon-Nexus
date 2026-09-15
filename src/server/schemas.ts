import { z } from 'zod';

export const idSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_\-]+$/);
export const memoryKeySchema = z.string().min(1).max(100);
export const memoryDataSchema = z.record(memoryKeySchema, z.any()).refine(
  (data) => JSON.stringify(data).length <= 50000,
  'Memory payload too large (max ~50KB)'
);

export const createTaskSchema = z.object({
  creatorId: idSchema.optional(),
  type: z.string().min(1).max(100),
  payload: z.any().refine((p) => JSON.stringify(p).length <= 50000, 'Payload too large'),
});

export const acceptTaskSchema = z.object({
  agentId: idSchema.optional(),
});

export const completeTaskSchema = z.object({
  agentId: idSchema.optional(),
  status: z.enum(['completed', 'failed']).optional().default('completed'),
  result: z.any().refine((p) => JSON.stringify(p).length <= 100000, 'Result payload too large'),
});

export const registerAgentSchema = z.object({
  agentId: idSchema,
  label: z.string().max(200).optional(),
  rotate: z.boolean().optional().default(false),
});

export const patchAgentSchema = z
  .object({
    label: z.string().min(1).max(200).optional(),
    listed: z.boolean().optional(),
    blurb: z.string().max(280).nullable().optional(),
  })
  .refine((v) => v.label !== undefined || v.listed !== undefined || v.blurb !== undefined, {
    message: 'Provide label, listed, and/or blurb',
  });

export const failTaskSchema = z.object({
  lastError: z.string().min(1).max(2000),
});
