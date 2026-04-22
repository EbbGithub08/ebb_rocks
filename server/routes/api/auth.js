import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "../../db/pool.js";

const router = Router();

const TOKEN_COOKIE_NAME = "auth_token";
const DEFAULT_JWT_SECRET = "dev-only-secret";
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;

function getJwtSecret() {
  return process.env.AUTH_JWT_SECRET || DEFAULT_JWT_SECRET;
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_WEEK_SECONDS * 1000,
  };
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function readTokenPayload(req) {
  const token = req.cookies?.[TOKEN_COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

function requireDb(res) {
  const pool = getPool();
  if (!pool) {
    res.status(500).json({ error: "Database is not configured" });
    return null;
  }
  return pool;
}

router.post("/register", async (req, res) => {
  const pool = requireDb(res);
  if (!pool) return;

  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password || password.length < 8) {
    res.status(400).json({ error: "Email and password (min 8 chars) are required" });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", [email, passwordHash]);

    const user = { id: Number(result.insertId), email };
    const token = jwt.sign(user, getJwtSecret(), { expiresIn: ONE_WEEK_SECONDS });
    res.cookie(TOKEN_COOKIE_NAME, token, getCookieOptions());
    res.status(201).json({ user });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "An account with that email already exists" });
      return;
    }
    console.error("register error", error);
    res.status(500).json({ error: "Unable to register user" });
  }
});

router.post("/login", async (req, res) => {
  const pool = requireDb(res);
  if (!pool) return;

  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const [rows] = await pool.execute("SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1", [email]);
    const account = rows[0];
    if (!account) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, account.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = { id: Number(account.id), email: account.email };
    const token = jwt.sign(user, getJwtSecret(), { expiresIn: ONE_WEEK_SECONDS });
    res.cookie(TOKEN_COOKIE_NAME, token, getCookieOptions());
    res.json({ user });
  } catch (error) {
    console.error("login error", error);
    res.status(500).json({ error: "Unable to login" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, getCookieOptions());
  res.status(204).end();
});

router.get("/me", (req, res) => {
  const user = readTokenPayload(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: { id: Number(user.id), email: user.email } });
});

export { router as authRouter };
