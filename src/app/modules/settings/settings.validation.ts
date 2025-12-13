import { z } from "zod";

const updateContentValidation = z.object({
  body: z.object({
    content: z
      .string({
        required_error: "Content is required",
      })
      .min(1, "Content cannot be empty"),
  }),
});

export const settingsValidation = {
  updateContentValidation,
};
