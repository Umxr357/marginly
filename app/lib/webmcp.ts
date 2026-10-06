"use client";
import { useEffect } from "react";
import type { Post } from "./types";
type Registry = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function useStoryTools(
  view: string,
  posts: Post[],
  setQuery: (v: string) => void,
  setCategory: (v: string) => void,
) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: Registry })
      .modelContext;
    if (!context?.registerTool || view !== "explore") return;
    const lifecycle = new AbortController();
    const tool = {
      name: "search_stories",
      description:
        "Filter the visible Explore page by a search phrase and return matching published stories.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", maxLength: 200 } },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input: unknown) {
        if (
          !input ||
          typeof input !== "object" ||
          !("query" in input) ||
          typeof input.query !== "string" ||
          input.query.length > 200
        )
          throw new Error("query must be a string of at most 200 characters");
        const query = input.query;
        setQuery(query);
        setCategory("All stories");
        return new Promise((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() =>
              resolve({
                stories: posts
                  .filter(
                    (p) =>
                      p.status === "published" &&
                      `${p.title} ${p.excerpt} ${p.author} ${p.category}`
                        .toLowerCase()
                        .includes(query.trim().toLowerCase()),
                  )
                  .map((p) => ({
                    id: p.id,
                    title: p.title,
                    url: `/post/${p.id}`,
                  })),
              }),
            ),
          ),
        );
      },
    };
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [view, posts, setQuery, setCategory]);
}
