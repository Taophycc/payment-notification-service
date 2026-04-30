import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { config } from "../config/index";
import { env } from "../config/env";

const hashToken = (token: string) =>
  crypto.createHmac("sha256", env.JWT_REFRESH_SECRET).update(token).digest("hex");

export const registerUser = async (email: string, password: string) => {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (existingUser.length > 0) {
    throw new Error("Email already exists");
  }

  const hash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hash,
    })
    .returning();
  return newUser;
};

export const loginUser = async (email: string, password: string) => {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingUser.length === 0) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, existingUser[0].passwordHash);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }
  return existingUser[0];
};

export const saveRefreshToken = async (
  userId: string,
  refreshToken: string,
) => {
  const hashed = hashToken(refreshToken);
  await db
    .update(users)
    .set({ refreshToken: hashed })
    .where(eq(users.id, userId));
};

export const rotateRefreshToken = async (
  userId: string,
  refreshToken: string,
) => {
  const user = await db.select().from(users).where(eq(users.id, userId));

  if (user.length === 0) {
    throw new Error("User not found");
  }

  if (user[0].refreshToken !== hashToken(refreshToken)) {
    await db
      .update(users)
      .set({ refreshToken: null })
      .where(eq(users.id, userId));
    throw new Error("Invalid refresh token");
  }

  return user[0];
};

export const logOutUser = async (userId: string) => {
  await db
    .update(users)
    .set({ refreshToken: null })
    .where(eq(users.id, userId));
};
