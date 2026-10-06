import { randomUUID } from "node:crypto";
import { database } from "../../../../db";
import {
  allowAuthAttempt,
  createSession,
  destroySession,
} from "../../../lib/auth";
import {
  isSameOrigin,
  loginInput,
  registerInput,
} from "../../../lib/auth-input";
import {
  hashPassword,
  missingPasswordHash,
  verifyPassword,
} from "../../../lib/password";
import { failure, HttpError, json, readJson } from "../../../lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  try {
    if (!isSameOrigin(request))
      throw new HttpError(
        403,
        "This request couldn't be verified. Reload and try again.",
      );
    const { action } = await context.params;
    if (action === "logout") {
      await destroySession();
      return json({ success: true });
    }
    if (action !== "login" && action !== "register")
      throw new HttpError(404, "This action isn't available.");
    const body = await readJson(request);
    const input = loginInput.parse(body);
    if (!(await allowAuthAttempt(input.email)))
      throw new HttpError(
        429,
        "Too many attempts. Please try again in 15 minutes.",
      );

    let id: string;
    if (action === "register") {
      const registration = registerInput.parse(body);
      id = randomUUID();
      const passwordHash = await hashPassword(input.password);
      const created = await database().query(
        "INSERT INTO users(id,email,name,password_hash,created_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(email) DO NOTHING RETURNING id",
        [id, input.email, registration.name, passwordHash, Date.now()],
      );
      if (!created.rows.length)
        throw new HttpError(
          409,
          "Unable to create this account. Try signing in instead.",
        );
    } else {
      const found = await database().query<{
        id: string;
        password_hash: string;
      }>("SELECT id,password_hash FROM users WHERE email=$1", [input.email]);
      const user = found.rows[0];
      const valid = await verifyPassword(
        input.password,
        user?.password_hash ?? missingPasswordHash,
      );
      if (!user || !valid)
        throw new HttpError(401, "Email or password is incorrect.");
      id = user.id;
    }
    await createSession(id);
    return json({ success: true }, action === "register" ? 201 : 200);
  } catch (error) {
    return failure(error);
  }
}
