import mongoose from "mongoose";
import { Admin } from "../app/modules/admin/admin.model";
import config from "../config";
import { logger } from "../shared/logger";
import colors from "colors";

// Function to seed admin (Admin collection)
const seedAdmin = async () => {
  try {
    await Admin.deleteMany();

    const adminPayload = {
      email: config.super_admin.email,
      password: config.super_admin.password,
      role: "super_admin",
      fullName: "Super Admin",
    };

    await Admin.create(adminPayload); // pre-save hook hashes password

    logger.info(
      colors.green(
        "✨ --------------> Admin seeded successfully <-------------- ✨"
      )
    );
  } catch (err) {
    logger.error(colors.red("💥 Error seeding admin: 💥"), err);
    throw err;
  }
};

// Connect to MongoDB
mongoose.connect(config.database_url as string);

const seedSuperAdmin = async () => {
  try {
    logger.info(
      colors.cyan(
        "🎨 --------------> Database seeding start <--------------- 🎨"
      )
    );

    // Start seeding admin only
    await seedAdmin();
    logger.info(
      colors.green(
        "🎉 --------------> Database seeding completed <--------------- 🎉"
      )
    );
  } catch (error) {
    logger.error(colors.red("🔥 Error creating Super Admin: 🔥"), error);
  } finally {
    mongoose.disconnect();
  }
};

seedSuperAdmin();
