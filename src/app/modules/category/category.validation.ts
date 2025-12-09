import { z } from "zod";

const createCategoryValidation = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
  }),
});

const updateCategoryValidation = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required").optional(),
    description: z.string().optional(),
  }),
});

const toggleStatusValidation = z.object({
  body: z.object({
    isActive: z.boolean({
      required_error: "isActive is required",
    }),
  }),
});

export const categoryValidations = {
  createCategoryValidation,
  updateCategoryValidation,
  toggleStatusValidation,
};
