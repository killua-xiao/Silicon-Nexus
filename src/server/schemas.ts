import { z } from 'zod';
import type { HandoffPacket } from './types.ts';

export const idSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_\-]+$/);
export const memoryKeySchema = z.string().min(1).max(100);
export const memoryDataSchema = z.record(memoryKeySchema, z.any()).refine(
  (data) => JSON.stringify(data).length <= 50000,
  'Memory payload too large (max ~50KB)'
);

export const searchMemoryQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  agentId: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    idSchema.optional()
  ),
});

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

/** Max serialized size of the structured continuity packet (~8KB). */
export const HANDOFF_PACKET_MAX_BYTES = 8192;

const packetLine = z.string().trim().min(1).max(500);
const packetLines = z.array(packetLine).max(20);

/** Empty string → omitted so clients can send `""` without a validation error. */
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().min(1).max(max).optional()
  );

export const handoffProvenanceSchema = z.object({
  actor: optionalText(200),
  task: optionalText(200),
  conditions: optionalText(500),
});

export const handoffPacketSchema = z.object({
  decisions: packetLines.optional(),
  constraints: packetLines.optional(),
  evidence: packetLines.optional(),
  nextAction: optionalText(1000),
  provenance: handoffProvenanceSchema.optional(),
});

function compactLines(lines: string[] | undefined): string[] | undefined {
  if (!lines?.length) return undefined;
  const out = lines.map((s) => s.trim()).filter(Boolean).slice(0, 20);
  return out.length ? out : undefined;
}

/** Drop empty fields so stored/returned packets stay sparse. */
export function compactHandoffPacket(
  input: {
    decisions?: string[];
    constraints?: string[];
    evidence?: string[];
    nextAction?: string;
    provenance?: { actor?: string; task?: string; conditions?: string };
  } | null | undefined
): HandoffPacket | null {
  if (!input) return null;
  const packet: HandoffPacket = {};
  const decisions = compactLines(input.decisions);
  const constraints = compactLines(input.constraints);
  const evidence = compactLines(input.evidence);
  const nextAction = input.nextAction?.trim().slice(0, 1000) || undefined;
  const actor = input.provenance?.actor?.trim().slice(0, 200) || undefined;
  const task = input.provenance?.task?.trim().slice(0, 200) || undefined;
  const conditions = input.provenance?.conditions?.trim().slice(0, 500) || undefined;
  if (decisions) packet.decisions = decisions;
  if (constraints) packet.constraints = constraints;
  if (evidence) packet.evidence = evidence;
  if (nextAction) packet.nextAction = nextAction;
  if (actor || task || conditions) {
    packet.provenance = {
      ...(actor ? { actor } : {}),
      ...(task ? { task } : {}),
      ...(conditions ? { conditions } : {}),
    };
  }
  return Object.keys(packet).length ? packet : null;
}

export function parseStoredHandoffPacket(raw: string | null | undefined): HandoffPacket | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = handoffPacketSchema.safeParse(parsed);
    if (!result.success) return null;
    return compactHandoffPacket(result.data);
  } catch {
    return null;
  }
}

function packetWithinSizeLimit(packet: HandoffPacket | null): boolean {
  if (!packet) return true;
  return JSON.stringify(packet).length <= HANDOFF_PACKET_MAX_BYTES;
}

export const handoffCreateSchema = z
  .object({
    note: z.string().max(500).optional(),
    includeKeys: z.array(memoryKeySchema).max(200).optional(),
    /** Hours until the handoff expires. Default 168 (7 days). */
    ttlHours: z.coerce.number().int().min(1).max(720).optional().default(168),
    decisions: packetLines.optional(),
    constraints: packetLines.optional(),
    evidence: packetLines.optional(),
    nextAction: optionalText(1000),
    provenance: handoffProvenanceSchema.optional(),
  })
  .refine((v) => packetWithinSizeLimit(compactHandoffPacket(v)), {
    message: 'Handoff packet too large (max 8KB)',
  });

export const handoffAssumeSchema = z.object({
  handoffId: z
    .string()
    .min(8)
    .max(80)
    .regex(/^hof_[a-f0-9]+$/i),
  /** Rotate nxa_* so the prior session cannot keep writing. Default true. */
  rotateToken: z.boolean().optional().default(true),
});
