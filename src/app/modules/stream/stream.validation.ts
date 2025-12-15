import { z } from "zod";

const createStreamSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  categoryId: z.string().optional(),
  thumbnail: z.string().optional().default(""),
  isPublic: z.coerce.boolean().optional().default(true),
  whoCanMessage: z
    .enum(["everyone", "followers"])
    .optional()
    .default("everyone"),
  isMature: z.coerce.boolean().optional().default(false),
});

const endStreamSchema = z.object({
  recordingUrl: z.string().url().optional(),
  playbackUrl: z.string().url().optional(),
  durationSeconds: z.coerce.number().int().nonnegative().optional(),
});

export const streamValidation = {
  createStreamSchema,
  endStreamSchema,
};
