// Shared, theme-independent design tokens.
// Spread into both `light` and `dark` in ./index.js so components can read
// them via props.theme.* (e.g. props.theme.radius.lg, props.theme.bp.md)
// alongside props.theme.colors.*.
//
// Values are derived from the magic numbers previously hardcoded across
// components, rounded into clean scales while staying visually equivalent.

// Type scale (px). Fractional sizes in the old code (14.5, 13.5, 12.5…)
// collapse to the nearest step.
const font = {
  xs: "11px", // mono labels, eyebrows, chips, counts
  sm: "12px", // small meta, mono links
  base: "13px", // pagination, TOC items, preview
  md: "14px", // nav, tabs, code blocks, arrows
  lg: "15px", // excerpts, list-row titles
  body: "16px", // markdown / about body
  h6: "14px",
  h5: "15px",
  h4: "17px",
  h3: "19px",
  h2: "22px",
  h1Sm: "24px",
  // Responsive page/post titles — kept as clamps.
  titlePost: "clamp(28px, 4vw, 38px)",
  titlePage: "clamp(32px, 4.2vw, 44px)",
}

// 4px-based spacing scale (px). Keys are the multiple of 4.
const space = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  9: "36px",
  10: "40px",
  11: "44px",
  12: "48px",
  14: "56px",
  16: "64px",
  18: "72px",
}

// Border radius scale (px).
const radius = {
  xs: "4px", // tiny chips
  sm: "6px", // tags, inline code
  md: "8px", // buttons, nav, filter chips
  lg: "12px", // code blocks, images, tables, series preview
  xl: "14px", // post cards, nav cards
  xxl: "16px", // featured / series cards
  pill: "999px",
}

// Canonical breakpoints (px values). Use in media queries:
//   @media (max-width: ${props => props.theme.bp.md}) { ... }
// `toc` is an intentional exception for the floating table-of-contents.
const bp = {
  xs: "480px",
  sm: "576px",
  md: "768px",
  lg: "880px", // sidebar drop (archive / about)
  xl: "1080px",
  xxl: "1180px", // container max width as a query
  toc: "1300px", // floating TOC visibility boundary
}

// Transition timings.
const transition = {
  fast: "0.18s",
  base: "0.22s",
  slow: "0.4s",
  card: "0.28s cubic-bezier(0.2, 0.7, 0.2, 1)", // hero/feature card easing
}

// Elevation. Combine the offset/spread here with theme.colors.headerShadow
// for the color, e.g. box-shadow: ${s.shadow.cardHover} ${c.headerShadow}.
const shadow = {
  cardHover: "0 4px 20px -8px",
  navHover: "0 4px 16px -4px",
  hairline: "0 1px 0",
}

// Layout-level dimensions.
const layout = {
  maxWidth: "1180px",
}

export const tokens = {
  font,
  space,
  radius,
  bp,
  transition,
  shadow,
  layout,
}
