import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error(
    "Integration tests only run against a local development server.",
  );
const email = `integration-${Date.now()}@marginly.test`;
const password = "Local test password 12345";
const registration = await fetch(base + "/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Integration Writer", email, password }),
});
assert.equal(registration.status, 201, await registration.text());
let cookie = registration.headers
  .getSetCookie()
  .map((value) => value.split(";")[0])
  .join("; ");
assert.ok(cookie.includes("marginly_session="));
assert.match(registration.headers.get("set-cookie"), /HttpOnly/i);
assert.match(registration.headers.get("set-cookie"), /SameSite=lax/i);
async function request(path, method = "GET", body, auth = true, extra = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Cookie: cookie } : {}),
      ...extra,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
const draft = {
  title: "Integration test story",
  excerpt: "A disposable local test of the writing workflow.",
  content:
    "A temporary story created only by the local integration test. It will be cleaned up.",
  category: "Technology",
  image: "",
  status: "draft",
};
let id;
try {
  assert.equal(
    (
      await request(
        "/api/auth/login",
        "POST",
        { email, password: "incorrect-password" },
        false,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/api/posts", "POST", draft, false, {
        "oai-authenticated-user-id": "forged",
        "oai-authenticated-user-email": email,
      })
    ).status,
    401,
  );
  const list = await request("/api/posts");
  assert.equal(list.status, 200);
  assert.ok(list.data.posts.length >= 6);
  assert.ok(list.data.viewer);
  assert.equal((await request("/api/posts", "POST", draft, false)).status, 401);
  assert.equal(
    (await request("/api/posts", "POST", { ...draft, title: "" })).status,
    400,
  );
  assert.equal(
    (
      await request("/api/posts", "POST", draft, true, {
        Origin: "https://untrusted.example",
      })
    ).status,
    403,
  );
  const created = await request("/api/posts", "POST", draft);
  assert.equal(created.status, 201);
  id = created.data.id;
  assert.equal((await request(`/api/posts/${id}`)).data.post.status, "draft");
  assert.equal(
    (await request(`/api/posts/${id}`, "GET", undefined, false)).status,
    404,
  );
  assert.ok(
    !(await request("/api/posts", "GET", undefined, false)).data.posts.some(
      (p) => p.id === id,
    ),
  );
  assert.equal(
    (await request("/api/posts/the-art-of-noticing", "PUT", draft)).status,
    403,
  );
  assert.equal(
    (
      await request(`/api/posts/${id}`, "PUT", {
        ...draft,
        title: "Updated test story",
        status: "published",
      })
    ).status,
    200,
  );
  assert.equal(
    (await request(`/api/posts/${id}`, "GET", undefined, false)).data.post
      .title,
    "Updated test story",
  );
  await request(`/api/posts/${id}`, "POST", {
    action: "bookmark",
    active: true,
  });
  assert.equal((await request(`/api/posts/${id}`)).data.post.bookmarked, true);
  await request(`/api/posts/${id}`, "POST", { action: "like", active: true });
  await request(`/api/posts/${id}`, "POST", { action: "like", active: true });
  assert.equal((await request(`/api/posts/${id}`)).data.post.likes, 1);
  assert.equal(
    (
      await request(`/api/posts/${id}`, "POST", {
        action: "comment",
        content: "  ",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/api/posts/${id}`, "POST", {
        action: "comment",
        content: "A useful perspective.",
      })
    ).status,
    201,
  );
  assert.equal((await request(`/api/posts/${id}`)).data.comments.length, 1);
  await request(`/api/posts/${id}`, "POST", {
    action: "bookmark",
    active: false,
  });
  assert.equal((await request(`/api/posts/${id}`)).data.post.bookmarked, false);
  console.log(
    "PASS: authentication, CSRF, input validation, private drafts, ownership, publishing, updates, durable bookmarks, idempotent likes, and comments.",
  );
} finally {
  if (id) {
    assert.equal((await request(`/api/posts/${id}`, "DELETE")).status, 200);
    assert.equal((await request(`/api/posts/${id}`)).status, 404);
    console.log("PASS: deletion and test cleanup.");
    await request("/api/auth/logout", "POST");
    assert.equal(
      (await request("/api/posts")).data.viewer,
      null,
      "Logged-out session must be revoked",
    );
    const login = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(login.status, 200);
    cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    assert.ok(
      (await request("/api/posts")).data.viewer,
      "Password login must restore identity",
    );
    await request("/api/auth/logout", "POST");
    console.log(
      "PASS: password login, logout revocation and spoofed identity rejection.",
    );
  }
}
