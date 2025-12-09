import { z } from "zod";

const createCategoryValidation = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required"),
  }),
});

const updateCategoryValidation = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required").optional(),
  }),
});

const toggleStatusValidation = z.object({
  body: z.object({
    isActive: z.boolean().describe("isActive is required"),
  }),
});

export const categoryValidations = {
  createCategoryValidation,
  updateCategoryValidation,
  toggleStatusValidation,
};
