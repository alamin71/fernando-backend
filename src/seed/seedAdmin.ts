import mongoose from "mongoose";
import { User } from "../app/modules/user/user.model";
import { Admin } from "../app/modules/admin/admin.model";
import config from "../config";
import { USER_ROLES } from "../enums/user";
import { logger } from "../shared/logger";
import colors from "colors";
import bcrypt from "bcrypt";

const usersData = [
  {
    name: "Administrator",
    email: config.super_admin.email,
    role: USER_ROLES.ADMIN,
    password: config.super_admin.password,
    verified: true,
  },
  {
    name: "User",
    email: "user@gmail.com",
    role: USER_ROLES.ADMIN,
    password: "hello123",
    verified: true,
  },
];

// Function to hash passwords
const hashPassword = async (password: string) => {
  const salt = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
  return await bcrypt.hash(password, salt);
};

// Function to seed users
const seedUsers = async () => {
  try {
    await User.deleteMany();

    const hashedUsersData = await Promise.all(
      usersData.map(async (user: any) => {
        const hashedPassword = await hashPassword(user.password);
        return { ...user, password: hashedPassword };
      })
    );

    // Insert users into the database
    await User.insertMany(hashedUsersData);
    logger.info(
      colors.green(
        "✨ --------------> Users seeded successfully <-------------- ✨"
      )
    );
  } catch (err) {
    logger.error(colors.red("💥 Error seeding users: 💥"), err);
  }
};

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

    // Start seeding admin and users
    await seedAdmin();
    await seedUsers();
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
