import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { database } from "../../db";

const cookieName = "marginly_session";
const lifetime = 30 * 24 * 60 * 60;
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export type User = { userId: string; email: string; fullName: string };

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const result = await database().query<User>(
    'SELECT u.id AS "userId", u.email, u.name AS "fullName" FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2',
    [digest(token), Date.now()],
  );
  return result.rows[0] ?? null;
}

export async function createSession(userId: string) {
  const jar = await cookies();
  const previous = jar.get(cookieName)?.value;
  const token = randomBytes(32).toString("hex");
  await database().transaction([
    {
      sql: "DELETE FROM sessions WHERE expires_at<=$1 OR token_hash=$2",
      values: [Date.now(), digest(previous ?? "")],
    },
    {
      sql: "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)",
      values: [digest(token), userId, Date.now() + lifetime * 1000],
    },
  ]);
  jar.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: lifetime,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token)
    await database().query("DELETE FROM sessions WHERE token_hash=$1", [
      digest(token),
    ]);
  jar.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Shared database counters work across application instances and restarts. */
export async function allowAuthAttempt(email: string) {
  const now = Date.now();
  const result = await database().query<{ attempts: number }>(
    `INSERT INTO auth_attempts(key,attempts,expires_at) VALUES($1,1,$2)
     ON CONFLICT(key) DO UPDATE SET
       attempts=CASE WHEN auth_attempts.expires_at<=$3 THEN 1 ELSE auth_attempts.attempts+1 END,
       expires_at=CASE WHEN auth_attempts.expires_at<=$3 THEN $2 ELSE auth_attempts.expires_at END
     RETURNING attempts`,
    [digest(email), now + 15 * 60 * 1000, now],
  );
  return result.rows[0].attempts <= 10;
}
