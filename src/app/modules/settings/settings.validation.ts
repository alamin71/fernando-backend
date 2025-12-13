import { z } from "zod";

const updateContentValidation = z.object({
  body: z.object({
    content: z.string().min(1, "Content is required"),
  }),
});

export const settingsValidation = {
  updateContentValidation,
};
