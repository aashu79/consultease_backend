import { z } from "zod";

export const studentDashboardSchema = z.object({
  params: z.object({ studentId: z.string().uuid() }),
});
