import { z } from "zod";

const createAdminZodSchema = z.object({
  name: z.string().nonempty({ message: "Name is required" }),
  email: z.string().nonempty({ message: "Email is required" }),
  password: z.string().nonempty({ message: "Password is required" }),
  role: z.string().nonempty({ message: "Role is required" }),
});

export const AdminValidation = {
  createAdminZodSchema,
};
