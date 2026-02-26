import { z } from "zod";

const recipientsConfigSchema = z.object({
  recipients: z.array(z.string().min(3)).optional(),
  includeUsers: z.boolean().optional(),
  includeStudents: z.boolean().optional(),
  includeLeads: z.boolean().optional(),
});

export const marketingEmailSchema = z.object({
  body: recipientsConfigSchema.extend({
    subject: z.string().min(2).max(200),
    message: z.string().min(2).max(5000),
  }),
});

export const marketingSmsSchema = z.object({
  body: recipientsConfigSchema.extend({
    message: z.string().min(2).max(1000),
  }),
});
