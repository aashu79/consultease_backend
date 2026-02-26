import { z } from "zod";

export const listAuditLogsSchema = z.object({
  query: z.object({
    actorUserId: z.string().uuid().optional(),
    action: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
