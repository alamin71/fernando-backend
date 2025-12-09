import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import AppError from "../../../errors/AppError";
import { StreamCategory } from "./category.model";
import { uploadToS3 } from "../../../utils/fileHelper";
import QueryBuilder from "../../builder/QueryBuilder";

// Create category
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  // Check if category already exists
  const existingCategory = await StreamCategory.findOne({ name });
  if (existingCategory) {
    throw new AppError(httpStatus.CONFLICT, "Category already exists");
  }

  let image = "";
  let coverPhoto = "";

  // Handle multiple file uploads
  if (req.files && typeof req.files === "object") {
    const files = req.files as any;
    if (files.image) {
      const imageResult = await uploadToS3(
        files.image[0],
        "categories/images/"
      );
      image = imageResult.url || "";
    }
    if (files.coverPhoto) {
      const coverResult = await uploadToS3(
        files.coverPhoto[0],
        "categories/cover/"
      );
      coverPhoto = coverResult.url || "";
    }
  }

  const categoryData = {
    name,
    description: description || "",
    image,
    coverPhoto,
    isActive: true,
  };

  const category = await StreamCategory.create(categoryData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

// Get all categories with QueryBuilder
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const queryBuilder = new QueryBuilder(StreamCategory.find(), req.query)
    .search(["name", "description"])
    .filter()
    .sort()
    .paginate();

  const result = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories fetched successfully",
    data: result,
    meta,
  });
});

// Get category by ID
const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await StreamCategory.findById(id);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category fetched successfully",
    data: category,
  });
});

// Update category
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const category = await StreamCategory.findById(id);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  // Check if new name already exists (and it's not the same category)
  if (name && name !== category.name) {
    const existingCategory = await StreamCategory.findOne({ name });
    if (existingCategory) {
      throw new AppError(httpStatus.CONFLICT, "Category name already exists");
    }
  }

  let updateData: any = { name, description };

  // Handle file uploads
  if (req.files && typeof req.files === "object") {
    const files = req.files as any;
    if (files.image) {
      const imageResult = await uploadToS3(
        files.image[0],
        "categories/images/"
      );
      updateData.image = imageResult.url || "";
    }
    if (files.coverPhoto) {
      const coverResult = await uploadToS3(
        files.coverPhoto[0],
        "categories/cover/"
      );
      updateData.coverPhoto = coverResult.url || "";
    }
  }

  const updatedCategory = await StreamCategory.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully",
    data: updatedCategory,
  });
});

// Delete category
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await StreamCategory.findByIdAndDelete(id);
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully",
    data: category,
  });
});

// Bulk delete categories
const bulkDeleteCategories = catchAsync(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide an array of category IDs"
    );
  }

  const result = await StreamCategory.deleteMany({ _id: { $in: ids } });

  if (result.deletedCount === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No categories found to delete");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${result.deletedCount} categories deleted successfully`,
    data: { deletedCount: result.deletedCount },
  });
});

export const categoryControllers = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
};
