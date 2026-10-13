import { InMemoryUserRepository } from "../repositories/inMemoryUser.repository.js";
import { UserService } from "../services/user.service.js";

export async function createDependencies({
  requireEmailConfirmation = false,
  adminEmail,
  adminPassword,
  passwordRounds = 10
} = {}) {
  const userRepository = new InMemoryUserRepository();

  const userService = new UserService(userRepository, {
    requireEmailConfirmation,
    passwordRounds
  });

  if (adminEmail && adminPassword) {
    await userService.createAdmin({
      email: adminEmail,
      password: adminPassword
    });
  }

  return {
    userRepository,
    userService
  };
}