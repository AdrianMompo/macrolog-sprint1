import {
  createDatabasePool,
  initializeDatabase
} from "./database.js";
import {
  PostgresUserRepository
} from "../repositories/postgresUser.repository.js";
import { UserService } from "../services/user.service.js";

export async function createDependencies({
  databaseUrl,
  requireEmailConfirmation = false,
  adminEmail,
  adminPassword,
  passwordRounds = 10
} = {}) {
  const pool = createDatabasePool(databaseUrl);
  await initializeDatabase(pool);

  const userRepository =
    new PostgresUserRepository(pool);

  const userService = new UserService(
    userRepository,
    {
      requireEmailConfirmation,
      passwordRounds
    }
  );

  if (adminEmail && adminPassword) {
    const normalizedAdminEmail =
      adminEmail.trim().toLowerCase();

    const existingAdmin =
      await userRepository.findByEmail(
        normalizedAdminEmail
      );

    if (!existingAdmin) {
      await userService.createAdmin({
        email: normalizedAdminEmail,
        password: adminPassword
      });
    }
  }

  return {
    pool,
    userRepository,
    userService
  };
}