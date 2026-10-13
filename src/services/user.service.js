import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { AppError } from "../utils/appError.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserService {
  constructor(
    userRepository,
    {
      passwordRounds = 10,
      requireEmailConfirmation = false
    } = {}
  ) {
    this.userRepository = userRepository;
    this.passwordRounds = passwordRounds;
    this.requireEmailConfirmation = requireEmailConfirmation;
  }

  async register({ email, password }) {
    return this.createUser({
      email,
      password,
      role: "user",
      confirmed: !this.requireEmailConfirmation
    });
  }

  async createAdmin({ email, password }) {
    return this.createUser({
      email,
      password,
      role: "admin",
      confirmed: true
    });
  }

  async createUser({ email, password, role, confirmed }) {
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      throw new AppError(
        "El email no tiene un formato válido",
        400,
        "INVALID_EMAIL"
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      throw new AppError(
        "La contraseña debe tener al menos 8 caracteres",
        400,
        "WEAK_PASSWORD"
      );
    }

    const existingUser =
      await this.userRepository.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new AppError(
        "Ya existe una cuenta con ese email",
        409,
        "EMAIL_ALREADY_EXISTS"
      );
    }

    const passwordHash = await bcrypt.hash(password, this.passwordRounds);
    const now = new Date().toISOString();

    const user = await this.userRepository.create({
      id: randomUUID(),
      email: normalizedEmail,
      passwordHash,
      role,
      confirmed,
      deletedAt: null,
      createdAt: now,
      updatedAt: now
    });

    return this.toPublicUser(user);
  }

  async authenticate({ email, password }) {
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user || user.deletedAt) {
      throw new AppError(
        "Email o contraseña incorrectos",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    if (!user.confirmed) {
      throw new AppError(
        "La cuenta todavía no ha sido confirmada",
        403,
        "ACCOUNT_PENDING"
      );
    }

    const passwordIsValid = await bcrypt.compare(
      password ?? "",
      user.passwordHash
    );

    if (!passwordIsValid) {
      throw new AppError(
        "Email o contraseña incorrectos",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    return this.toPublicUser(user);
  }

  async listUsers(actorId) {
    await this.requireAdministrator(actorId);
    const users = await this.userRepository.findAll();
    return users.map((user) => this.toPublicUser(user));
  }

  async isUserActive(actorId, targetUserId) {
    await this.requireAdministrator(actorId);
    const targetUser = await this.findExistingUser(targetUserId);
    return targetUser.confirmed && !targetUser.deletedAt;
  }

  async deleteUser(actorId, targetUserId) {
    const actor = await this.findActiveActor(actorId);

    if (actor.role !== "admin" && actor.id !== targetUserId) {
      throw new AppError(
        "No tienes permiso para eliminar este usuario",
        403,
        "FORBIDDEN"
      );
    }

    const targetUser = await this.findExistingUser(targetUserId);

    if (targetUser.deletedAt) {
      throw new AppError(
        "El usuario ya ha sido eliminado",
        404,
        "USER_NOT_FOUND"
      );
    }

    const deletedUser = await this.userRepository.update(targetUserId, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return this.toPublicUser(deletedUser);
  }

  async requireAdministrator(actorId) {
    const actor = await this.findActiveActor(actorId);

    if (actor.role !== "admin") {
      throw new AppError(
        "Esta operación requiere permisos de administrador",
        403,
        "ADMIN_REQUIRED"
      );
    }

    return actor;
  }

  async findActiveActor(actorId) {
    const actor = await this.userRepository.findById(actorId);

    if (!actor || actor.deletedAt || !actor.confirmed) {
      throw new AppError(
        "La sesión no corresponde a un usuario activo",
        401,
        "INVALID_ACTOR"
      );
    }

    return actor;
  }

  async findExistingUser(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError(
        "Usuario no encontrado",
        404,
        "USER_NOT_FOUND"
      );
    }

    return user;
  }

  toPublicUser(user) {
    const active = user.confirmed && !user.deletedAt;
    let status = "pending";

    if (user.deletedAt) {
      status = "deleted";
    } else if (user.confirmed) {
      status = "active";
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status,
      active,
      createdAt: user.createdAt
    };
  }
}