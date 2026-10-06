import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["app/components/**/*.tsx"],
    rules: {
      // Document navigation preserves the editor's beforeunload protection
      // and reloads cookie-backed identity after sign-in and sign-out.
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-location-assign-relative-destination": "off",
      // Authors supply arbitrary HTTPS covers, loaded directly by the browser
      // with a custom error fallback instead of a server-side image proxy.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
