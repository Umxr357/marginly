"use client";
import { useEffect, useRef, useState } from "react";
import { Eye, PenLine, Save, Image as ImageIcon } from "lucide-react";
import {
  categories,
  readingTime,
  type Category,
  type Post,
} from "../lib/types";
import { covers } from "../lib/seed";
import { postInput } from "../lib/validation";
import { api } from "../lib/client";
import { Prose } from "./article";
export function Editor({
  post,
  notify,
}: {
  post?: Post;
  notify: (message: string) => void;
}) {
  const initial = {
    title: post?.title || "",
    excerpt: post?.excerpt || "",
    content: post?.content || "",
    category: post?.category || ("Design" as Category),
    image: post?.image || "",
  };
  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const postId = useRef(post?.id);
  const dirty = JSON.stringify(form) !== saved;
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  function field<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((old) => ({ ...old, [key]: value }));
  }
  async function save(status: "draft" | "published") {
    const parsed = postInput.safeParse({ ...form, status });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await api<{ id: string }>(
        postId.current ? `/api/posts/${postId.current}` : "/api/posts",
        {
          method: postId.current ? "PUT" : "POST",
          body: JSON.stringify(parsed.data),
        },
      );
      postId.current = result.id;
      setSaved(JSON.stringify(form));
      notify(
        status === "draft"
          ? "Draft saved. Come back whenever you're ready."
          : "Your story is published.",
      );
      if (status === "published") {
        window.setTimeout(() => {
          window.location.href = `/post/${result.id}`;
        }, 50);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="editor">
      <div className="editor-top">
        <div>
          <div className="eyebrow">A LITTLE SPACE FOR YOUR IDEAS</div>
          <h1>
            {post ? (
              <>
                Make it <em>even better.</em>
              </>
            ) : (
              <>
                Every story starts <em>somewhere.</em>
              </>
            )}
          </h1>
        </div>
        <a className="text-link" href="/manage">
          My stories
        </a>
      </div>
      <div className="editor-toolbar">
        <div className="editor-tabs">
          <button
            className={!preview ? "selected" : ""}
            onClick={() => setPreview(false)}
          >
            <PenLine size={16} />
            Write
          </button>
          <button
            className={preview ? "selected" : ""}
            onClick={() => setPreview(true)}
          >
            <Eye size={16} />
            Preview
          </button>
        </div>
        <span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <div className="editor-buttons">
          <button
            className="secondary"
            disabled={busy}
            onClick={() => save("draft")}
          >
            <Save size={15} />
            {busy ? "Saving…" : "Save draft"}
          </button>
          <button
            className="primary"
            disabled={busy}
            onClick={() => save("published")}
          >
            {busy
              ? "Saving…"
              : post?.status === "published"
                ? "Publish changes"
                : "Publish story"}
          </button>
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {preview ? (
        <div className="editor-preview reader">
          <div className="eyebrow">
            {form.category} · {readingTime(form.content)} MIN READ
          </div>
          <h1>{form.title || "Your story title"}</h1>
          <p className="reader-excerpt">
            {form.excerpt || "Your short description will appear here."}
          </p>
          {form.image && (
            <img
              className="preview-image"
              src={form.image}
              alt="Cover preview"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          )}
          <div className="article-body">
            <Prose content={form.content || "Your story will appear here."} />
          </div>
        </div>
      ) : (
        <div className="editor-grid">
          <div className="writing-fields">
            <label htmlFor="title">Story title</label>
            <input
              id="title"
              className="title-input"
              maxLength={140}
              value={form.title}
              onChange={(e) => field("title", e.target.value)}
              placeholder="Give your idea a headline…"
            />
            <label htmlFor="excerpt">
              Short description <span>{form.excerpt.length}/300</span>
            </label>
            <textarea
              id="excerpt"
              maxLength={300}
              value={form.excerpt}
              onChange={(e) => field("excerpt", e.target.value)}
              rows={3}
              placeholder="A few words to make someone curious."
            />
            <label htmlFor="content">
              Your story{" "}
              <span>
                {form.content.trim()
                  ? form.content.trim().split(/\s+/).length
                  : 0}{" "}
                words · {readingTime(form.content)} min read
              </span>
            </label>
            <textarea
              id="content"
              className="body-input"
              maxLength={50000}
              value={form.content}
              onChange={(e) => field("content", e.target.value)}
              rows={18}
              placeholder="Start with something you can't stop thinking about…"
            />
            <p className="field-hint">
              Separate paragraphs with a blank line. Use ## for section headings
              and &gt; for quotes. HTML is displayed as text.
            </p>
          </div>
          <aside className="story-settings">
            <h2>Story details</h2>
            <label htmlFor="category">Topic</label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => field("category", e.target.value as Category)}
            >
              {categories.slice(1).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label htmlFor="image">
              Cover image URL <span>Optional</span>
            </label>
            <input
              id="image"
              type="url"
              value={form.image}
              onChange={(e) => field("image", e.target.value)}
              placeholder="https://…"
            />
            <p className="field-hint">
              Use an HTTPS link to an image you have permission to use.
            </p>
            <p className="preset-label">
              <ImageIcon size={15} />
              Or choose a journal image
            </p>
            <div className="cover-presets">
              {Object.entries(covers).map(([name, url]) => (
                <button
                  key={name}
                  aria-label={`Use ${name} cover`}
                  aria-pressed={form.image === url}
                  className={form.image === url ? "chosen" : ""}
                  onClick={() => field("image", url)}
                >
                  <img src={url} alt={name} />
                </button>
              ))}
            </div>
            {form.image && (
              <button
                className="text-link remove-cover"
                onClick={() => field("image", "")}
              >
                Remove cover
              </button>
            )}
            <div className="editor-note">
              <strong>A note before you publish</strong>
              <p>
                Drafts are visible only to you. Published stories appear in
                Explore for everyone who can access this journal.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
