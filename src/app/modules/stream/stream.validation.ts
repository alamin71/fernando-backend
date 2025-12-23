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

const updateStreamSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  categoryId: z.string().optional(),
  thumbnail: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  whoCanMessage: z.enum(["everyone", "followers"]).optional(),
  isMature: z.coerce.boolean().optional(),
});

export const streamValidation = {
  createStreamSchema,
  endStreamSchema,
  updateStreamSchema,
};

// Chat message validation
export const chatValidation = {
  sendMessage: z.object({
    message: z
      .string()
      .min(1, "Message cannot be empty")
      .max(500, "Message cannot exceed 500 characters"),
  }),
  getMessages: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};
