import { LeadStage } from "@prisma/client";
import { z } from "zod";

export const createLeadSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().min(7).optional(),
    source: z.string().optional(),
    assignedToUserId: z.string().uuid().optional(),
    notes: z.string().optional(),
  }),
});

export const listLeadsSchema = z.object({
  query: z.object({
    stage: z.nativeEnum(LeadStage).optional(),
    assignedTo: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(7).optional(),
    source: z.string().optional(),
    assignedToUserId: z.string().uuid().nullable().optional(),
    notes: z.string().optional(),
    stage: z.nativeEnum(LeadStage).optional(),
    status: z.enum(["OPEN", "WON", "LOST"]).optional(),
  }),
});

export const addLeadActivitySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ type: z.string().min(2), note: z.string().optional() }),
});

export const convertLeadSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    intake: z.string().optional(),
    targetCountry: z.string().optional(),
  }),
});
