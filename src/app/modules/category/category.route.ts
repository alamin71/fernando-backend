import { Router } from "express";
import adminAuth from "../../middleware/adminAuth";
import { categoryControllers } from "./category.controller";
import upload from "../../middleware/fileUpload";

const router = Router();

// Create category (with image and cover photo upload)
router.post(
  "/create-category",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  categoryControllers.createCategory
);

// Bulk delete categories
router.post(
  "/bulk-delete",
  adminAuth,
  categoryControllers.bulkDeleteCategories
);

// Get all categories
router.get("/", categoryControllers.getAllCategories);

// Get category by ID
router.get("/:id", categoryControllers.getCategoryById);

// Update category
router.patch(
  "/update/:id",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  categoryControllers.updateCategory
);

// Delete category
router.delete("/delete/:id", adminAuth, categoryControllers.deleteCategory);

export const categoryRoutes = router;
