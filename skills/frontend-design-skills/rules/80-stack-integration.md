# 80 — Stack Integration

The design system survives only if the framework serves it. This document maps
the same tokens and components into static HTML, React, Next.js, Vue, Svelte,
Astro, and Tailwind without creating parallel systems.

## 1. The contract

Every stack follows the same contract:

1. **One token source.** Color, type, space, radius, shadow, duration, and
   container values come from one CSS custom-property file or one framework theme.
2. **One component source.** A button, card, field, and section header are defined
   once per project. Pages compose them; pages do not restyle them ad hoc.
3. **One layout source.** The container, grid, and section budget live in shared
   layout primitives, not in page-level margins.
4. **Static output.** The final artifact must render without a Node server unless
   the client explicitly requires one. Marketing pages and portfolios are static.
5. **No framework-specific fork of the visual system.** A React card and an Astro
   card must compute the same styles.

If a stack forces a second visual system, fix the integration before continuing.

## 2. Static HTML and CSS

Use this as the reference implementation. Every other stack must match it.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page title</title>
    <link rel="stylesheet" href="/styles/tokens.css" />
    <link rel="stylesheet" href="/styles/base.css" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">…</header>
    <main id="main">
      <section class="section" data-budget="1">…</section>
    </main>
    <footer class="site-footer">…</footer>
  </body>
</html>
```

Structure rules:

- One `tokens.css`, one `base.css`, and one file per component or a small number
  of grouped files. Do not use a single 4,000-line stylesheet.
- Use layers: `@layer tokens, base, layout, components, utilities;`.
- Class names describe role: `.site-header`, `.hero`, `.feature-split`,
  `.plan-card`. No `.mt-40` as the primary layout mechanism.
- Keep markup semantic before adding utility classes.
- Inline `<style>` only for critical above-the-fold CSS, and only when it is
  generated from the same tokens.
- No CSS `@import` chains in production; bundle or link directly.

## 3. React

- One `App` or route tree; shared layout components own the container and section
  spacing.
- Components accept `className` and forward refs only when needed; do not build a
  parallel styling API for every wrapper.
- Use CSS Modules, plain CSS with class names, or Tailwind. Do not mix three
  styling methods in one page.
- Keep state local. A marketing page does not need a global store.
- Avoid `useEffect` for layout. If an effect measures the DOM, use
  `useLayoutEffect` only after a documented need, and clean up listeners.
- Entrance animation runs after hydration but content is visible in the initial
  HTML. Never render a blank hero while waiting for JS.
- Images use explicit dimensions and `loading` attributes.
- Lists use stable keys; do not key by array index for reorderable content.
- Split interactive islands from static content. A pricing table does not need to
  be client-rendered.

```tsx
export function Section({
  budget,
  children,
  ...rest
}: { budget: "0.5" | "1" | "2" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className="section" data-budget={budget} {...rest}>
      <div className="container">{children}</div>
    </section>
  );
}
```

## 4. Next.js

- Use the App Router for new projects. Keep marketing routes as server components.
- Put `"use client"` only on components that need state, effects, or browser APIs.
- Fonts: `next/font` with `display: "swap"`, explicit subsets, and only the
  weights in the type system. Do not load six weights "just in case".
- Images: `next/image` with `sizes`, explicit `width`/`height` or `fill` plus a
  sized parent. Set `priority` only on the hero image.
- Metadata: title, description, canonical, Open Graph image, and `lang` on the
  root layout. No duplicate H1s from a template.
- Static export when possible:

```js
// next.config.mjs
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
```

- With `output: "export"`, no server actions, route handlers, or ISR. If the
  client needs them, document the hosting requirement and verify the deployed
  build, not only `next dev`.
- Avoid hydration mismatches: no `Date.now()`, `Math.random()`, or `window` reads
  during render. Render a stable initial state.
- Do not wrap the entire page in a client provider to support one dropdown.
- Verify the exported `out/` directory, not the dev server.

## 5. Vue

- Use single-file components with `<script setup>` and scoped styles, or a shared
  global stylesheet. Do not mix scoped and global rules for the same component.
- Tokens live in a global CSS file imported once in the app entry.
- Props carry content and variants; slots carry composition. Do not pass raw HTML
  through props unless the content is trusted.
- Use `v-if` for presence and `v-show` for frequent toggles; do not animate a
  `v-if` element without a transition wrapper.
- Keep the router layout component responsible for the header, main, and footer.
- Static builds: `vite build` for a SPA or Nuxt `generate` for prerendered pages.
  Verify the generated files with a static server.
- Avoid `:deep()` selectors to restyle child components; expose a variant or a
  CSS custom property instead.

## 6. Svelte and SvelteKit

- Use SvelteKit with `adapter-static` for marketing pages unless the client needs
  server rendering.
- Put global tokens in `src/app.css`; scope component styles by default.
- Use `$props()` and typed props; avoid implicit any.
- Use `onMount` for browser-only work and always return cleanup.
- Use `{#if}` for presence; transitions require a local block and must honor
  reduced motion.
- Set `export const prerender = true` for static routes.
- Verify the `build/` output with `npx serve build` or an equivalent static
  server. Do not judge the page from `vite dev` only.
- Do not use stores for values that can be props; do not create a store per
  component.

## 7. Astro

- One layout component owns `<html>`, `<head>`, header, main, and footer.
- Static by default. Add a framework island only for a genuinely interactive
  surface and use the correct hydration directive (`client:visible`,
  `client:idle`, `client:load` only when necessary).
- Global tokens in `src/styles/tokens.css`, imported once in the layout.
- Images use `astro:assets` with explicit dimensions and responsive widths.
- Content collections for editorial pages; validate frontmatter with a schema.
- Do not hydrate a static pricing table or a footer.
- Build with `astro build` and serve `dist/`. Check that no island fails to
  hydrate and no interactive control is dead without JS.
- Avoid duplicate `<h1>` from a Markdown body plus a layout title.

## 8. Tailwind

- Define the system in `tailwind.config` or the CSS-first `@theme` block: colors,
  font families, font sizes, spacing, radii, shadows, breakpoints.
- Ban arbitrary values for core design decisions. `w-[137px]`, `text-[15px]`, and
  `bg-[#7c3aed]` are symptoms of a missing token.
- Arbitrary values are allowed only for one-off optical corrections, documented
  in a comment.
- Use component classes for repeated structures:

```css
@layer components {
  .btn-primary {
    @apply inline-flex min-h-12 items-center justify-center rounded-md
      bg-accent px-6 text-base font-semibold text-accent-ink
      transition-colors duration-150 hover:bg-accent-strong;
  }
}
```

- Keep class lists readable with `clsx` or a small variant helper; do not build a
  string-concatenation maze.
- Do not disable Preflight without replacing the reset behavior.
- Do not use `dark:` variants to produce a second brand; dark mode is a token set.
- Verify the production CSS build, not the JIT dev output. Purged classes are a
  common cause of missing styles.

## 9. Framework anti-patterns

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| Page-level max-widths | Sections drift by 20–80px | Shared container primitive |
| Client-rendering static content | Blank first paint, poor LCP | Server or static render |
| Effect-driven layout | Jumping grids, resize bugs | CSS grid and container queries |
| Global store for a toggle | Coupling and hydration noise | Local state |
| Inline style soup | Tokens bypassed, dark mode breaks | Classes or variants |
| Duplicate component libraries | Two button systems | One primitive, extend variants |
| Hydrating the whole page | Large JS for one menu | Island or progressive enhancement |
| Dev-server sign-off | Broken exported assets | Serve the built output |
| Unoptimized hero image | 2MB LCP | Responsive AVIF/WebP |
| Font weight sprawl | Slow load, inconsistent hierarchy | Limit weights in tokens |
| Framework default theme shipped | Looks like a starter | Replace tokens and components |
| Animation gated on JS | Invisible content | Visible default, additive motion |

## 10. Built-page checks

Run against the production build served over HTTP, never `file://`.

```bash
# Static HTML
python3 -m http.server 4173 --directory dist

# Node-based static server
npx serve dist -l 4173

# Next static export
npx next build && npx serve out -l 4173

# Astro
npx astro build && npx serve dist -l 4173
```

Check:

- All assets return 200; no 404 for fonts, images, or CSS.
- No absolute `localhost` URLs in HTML, CSS, or JS.
- Base path works when deployed under a subdirectory.
- No hydration mismatch warnings in the console.
- No framework dev overlay, source map, or unminified bundle in production.
- Canonical, metadata, and `lang` are correct in the built HTML.
- The page works with JS disabled for content and navigation.
- The page works with the network throttled and with cache disabled.

## 11. SYS checks

| ID | Check | Pass condition |
|----|-------|----------------|
| SYS-01 | One visual system | One token source, one button/card/field primitive, one radius family |
| SYS-02 | Depth limit | No styled box nested more than two levels deep |
| SYS-03 | No fake product UI | Product surfaces are real or faithful fragments, not gray boxes |
| SYS-04 | No script errors | Page renders with zero console or runtime errors |

Supporting checks without separate gate IDs:

- Built page serves without a dev server; no 404 or absolute local URL.
- No hydration mismatch or dead interactive control.
- Production build is minified and hashed, with no source maps.
- Metadata, canonical, and `lang` are correct.
- One primary styling method per page.
- Static sections are not hydrated unnecessarily.

## 12. Integration sequence

1. Copy tokens from the direction lock into the stack's token file.
2. Build the layout primitives: container, grid, section, stack.
3. Build the primitives: button, link, card, field, icon wrapper.
4. Build one page end to end and audit it before scaling.
5. Add routes by composing the same primitives.
6. Build for production.
7. Serve the built output and run the browser checks in
   `references/browser-checks.md`.
8. Record the results in `references/gate.md`.
