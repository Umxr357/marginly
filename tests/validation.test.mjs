import test from "node:test";
import assert from "node:assert/strict";
import { postInput, actionInput } from "../app/lib/validation.ts";
const valid = {
  title: "A thoughtful story",
  excerpt: "A short description of a thoughtful story.",
  content: "This is a complete paragraph with enough detail to save.",
  category: "Design",
  image: "",
  status: "draft",
};
test("accepts and trims a complete draft", () => {
  assert.equal(
    postInput.parse({ ...valid, title: "  A thoughtful story  " }).title,
    valid.title,
  );
});
test("rejects empty stories and invalid categories", () => {
  assert.equal(postInput.safeParse({ ...valid, content: " " }).success, false);
  assert.equal(
    postInput.safeParse({ ...valid, category: "Unknown" }).success,
    false,
  );
});
test("rejects unsafe cover schemes", () => {
  for (const image of [
    "javascript:alert(1)",
    "data:image/svg+xml,foo",
    "http://example.com/pic.jpg",
  ])
    assert.equal(postInput.safeParse({ ...valid, image }).success, false);
});
test("allows HTTPS covers and rejects oversized input", () => {
  assert.equal(
    postInput.safeParse({ ...valid, image: "https://example.com/image.jpg" })
      .success,
    true,
  );
  assert.equal(
    postInput.safeParse({ ...valid, content: "a".repeat(50001) }).success,
    false,
  );
});
test("validates comments and idempotent reaction targets", () => {
  assert.equal(
    actionInput.safeParse({ action: "comment", content: "  " }).success,
    false,
  );
  assert.equal(
    actionInput.safeParse({ action: "like", active: true }).success,
    true,
  );
  assert.equal(
    actionInput.safeParse({ action: "bookmark", active: "true" }).success,
    false,
  );
});
