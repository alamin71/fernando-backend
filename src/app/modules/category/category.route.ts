import { Router } from "express";
import adminAuth from "../../middleware/adminAuth";
import { categoryControllers } from "./category.controller";
import upload from "../../middleware/fileUpload";

const router = Router();

// Create category (with image and cover photo upload)
router.post(
  "/",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  categoryControllers.createCategory
);

// Get all categories
router.get("/", categoryControllers.getAllCategories);

// Get category by ID
router.get("/:id", categoryControllers.getCategoryById);

// Update category
router.patch(
  "/:id",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  categoryControllers.updateCategory
);

// Delete category
router.delete("/:id", adminAuth, categoryControllers.deleteCategory);

// Bulk delete categories
router.post(
  "/bulk-delete",
  adminAuth,
  categoryControllers.bulkDeleteCategories
);

export const categoryRoutes = router;
