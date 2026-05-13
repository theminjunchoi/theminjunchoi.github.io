import styled from "styled-components"

const StyledMarkdown = styled.div`
  /* ── Base ─────────────────────────────────────────── */
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 16px;
  line-height: 1.85;
  color: ${props => props.theme.colors.secondaryText};
  word-break: keep-all;
  word-wrap: break-word;
  letter-spacing: -0.005em;

  & > * + * {
    margin-top: 18px;
  }

  /* ── Headings ─────────────────────────────────────── */
  & h2,
  & h3,
  & h4,
  & h5,
  & h6 {
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    line-height: 1.35;
  }

  & h2 {
    font-size: 24px;
    letter-spacing: -0.022em;
    margin-top: 56px;
    margin-bottom: 16px;
    position: relative;
  }

  & h2::before {
    content: "";
    position: absolute;
    left: -20px;
    top: 0.4em;
    width: 3px;
    height: 0.85em;
    background: ${props => props.theme.colors.accent};
    border-radius: 2px;
  }

  & h2:first-child {
    margin-top: 0;
  }

  & h2:first-child::before {
    display: none;
  }

  & h3 {
    font-size: 19px;
    letter-spacing: -0.018em;
    margin-top: 40px;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  & h4 {
    font-size: 16.5px;
    color: ${props => props.theme.colors.secondaryText};
    margin-top: 28px;
    margin-bottom: 8px;
    line-height: 1.45;
  }

  & h5 {
    font-size: 15px;
    margin-top: 20px;
    margin-bottom: 8px;
  }

  & h6 {
    font-size: 14px;
    margin-top: 16px;
    margin-bottom: 6px;
  }

  & h1:first-child,
  & h2:first-child,
  & h3:first-child,
  & h4:first-child {
    margin-top: 0;
  }

  /* ── Paragraph ────────────────────────────────────── */
  & p {
    margin: 0;
  }

  & p + p {
    margin-top: 18px;
  }

  /* ── Inline styles ────────────────────────────────── */
  & strong {
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }

  & em {
    font-style: italic;
    color: ${props => props.theme.colors.text};
  }

  /* ── Links ────────────────────────────────────────── */
  & a {
    color: ${props => props.theme.colors.accent};
    border-bottom: 1px solid ${props => props.theme.colors.accentBg};
    text-decoration: none;
    transition: all 0.18s;
  }

  & a:hover {
    border-color: ${props => props.theme.colors.accent};
    background: ${props => props.theme.colors.accent}0d;
  }

  /* ── Inline code ──────────────────────────────────── */
  & *:not(pre) > code,
  & *:not(pre) > code.language-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.88em;
    padding: 1px 6px;
    background: ${props => props.theme.colors.background};
    border-radius: 5px;
    color: ${props => props.theme.colors.text};
    border: 1px solid ${props => props.theme.colors.divider};
    font-weight: 500;
    position: relative;
    top: -0.5px;
  }

  /* ── Code blocks ──────────────────────────────────── */
  & pre {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13.5px;
    line-height: 1.65;
    padding: 22px 24px;
    border-radius: 12px;
    overflow-x: auto;
    margin: 24px 0;

    ::-webkit-scrollbar {
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: ${props => props.theme.colors.scrollTrack};
    }
    ::-webkit-scrollbar-thumb {
      background: ${props => props.theme.colors.scrollHandle};
      border-radius: 3px;
    }
  }

  & pre > code {
    background: transparent;
    border: none;
    padding: 0;
    font-size: inherit;
    color: inherit;
  }

  & code[class*="language-"],
  & pre[class*="language-"] {
    font-size: 13.5px;
  }

  /* ── Blockquote ───────────────────────────────────── */
  & blockquote {
    margin: 28px 0;
    padding: 18px 24px;
    border-left: 3px solid ${props => props.theme.colors.accent};
    background: ${props => props.theme.colors.bodyBackground};
    border-radius: 0 8px 8px 0;
    color: ${props => props.theme.colors.secondaryText};
    font-style: normal;

    & p {
      margin: 0;
      line-height: 1.75;
    }

    & p + p {
      margin-top: 10px;
    }

    & *:last-child {
      margin-bottom: 0;
    }
  }

  /* ── Lists ────────────────────────────────────────── */
  & ul,
  & ol {
    margin: 18px 0;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    list-style: none;
  }

  & ul li,
  & ol li {
    padding-left: 24px;
    position: relative;
    line-height: 1.75;
  }

  & ul li::before {
    content: "";
    position: absolute;
    left: 6px;
    top: 14px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${props => props.theme.colors.accent};
  }

  & ol {
    counter-reset: list;
  }

  & ol li {
    counter-increment: list;
  }

  & ol li::before {
    content: counter(list, decimal-leading-zero);
    position: absolute;
    left: 0;
    top: 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85em;
    font-weight: 600;
    color: ${props => props.theme.colors.accent};
  }

  & ul ul,
  & ol ol,
  & ul ol,
  & ol ul {
    margin: 8px 0 0;
  }

  & li p {
    margin: 0;
  }

  /* ── Images ───────────────────────────────────────── */
  & img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 10px;
    margin: 32px auto;
    border: 1px solid ${props => props.theme.colors.divider};
    box-shadow: 0 1px 0 ${props => props.theme.colors.headerShadow};
  }

  & figcaption {
    margin-top: 8px;
    text-align: center;
    font-size: 12px;
    font-style: italic;
    color: ${props => props.theme.colors.tertiaryText};
  }

  /* ── Table ────────────────────────────────────────── */
  & table {
    width: 100%;
    border-collapse: collapse;
    margin: 28px 0;
    font-size: 14.5px;
    border: 1px solid ${props => props.theme.colors.divider};
    border-radius: 10px;
    overflow: hidden;
    display: table;
  }

  & th,
  & td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid ${props => props.theme.colors.divider};
  }

  & th {
    background: ${props => props.theme.colors.background};
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    letter-spacing: -0.01em;
  }

  & tr:last-child td {
    border-bottom: none;
  }

  & tr:nth-child(even) {
    background-color: ${props => props.theme.colors.tableBackground};
  }

  /* ── HR ───────────────────────────────────────────── */
  & hr {
    border: none;
    border-top: 1px solid ${props => props.theme.colors.divider};
    margin: 44px 0;
  }

  /* ── KaTeX ────────────────────────────────────────── */
  & .katex-display {
    margin: 24px 0;
    overflow-x: auto;
  }

  /* ── Wiki links ───────────────────────────────────── */
  & a[data-wiki-link="true"] {
    color: ${props => props.theme.colors.accent};
    text-decoration: none;
    border-bottom: 1px solid ${props => props.theme.colors.accentBg};
  }

  & a[data-wiki-link="true"]:hover {
    border-color: ${props => props.theme.colors.accent};
  }

  /* ── Anchor links (TOC headings) ──────────────────── */
  & .anchor {
    display: none;
  }

  /* ── Mobile ───────────────────────────────────────── */
  @media (max-width: 760px) {
    font-size: 15px;
    padding: 32px 0 44px;

    & h2 {
      font-size: 21px;
    }

    & h2::before {
      display: none;
    }

    & h3 {
      font-size: 17px;
    }
  }
`

export default StyledMarkdown
