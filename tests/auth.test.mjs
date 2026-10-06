import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../app/lib/password.ts";
import {
  loginInput,
  registerInput,
  isSameOrigin,
} from "../app/lib/auth-input.ts";

test("passwords are salted, verified and reject malformed hashes", async () => {
  const password = "A long temporary test password";
  const a = await hashPassword(password);
  const b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("wrong password", a), false);
  assert.equal(await verifyPassword(password, "bad-hash"), false);
});
test("registration validates and normalizes credentials", () => {
  assert.equal(
    loginInput.parse({
      email: " Writer@Example.com ",
      password: "test-password-long",
    }).email,
    "writer@example.com",
  );
  assert.equal(
    registerInput.safeParse({ name: "X", email: "bad", password: "short" })
      .success,
    false,
  );
});
test("auth rejects cross-origin submissions", () => {
  const url = "https://marginly.example/api/auth/login";
  assert.equal(
    isSameOrigin(
      new Request(url, { headers: { origin: "https://marginly.example" } }),
    ),
    true,
  );
  assert.equal(
    isSameOrigin(
      new Request(url, { headers: { origin: "https://evil.example" } }),
    ),
    false,
  );
  assert.equal(
    isSameOrigin(
      new Request(url, { headers: { "sec-fetch-site": "cross-site" } }),
    ),
    false,
  );
});
