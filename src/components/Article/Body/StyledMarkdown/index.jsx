import styled from "styled-components"

const StyledMarkdown = styled.div`
  /* ── Base ─────────────────────────────────────────── */
  font-family: 'Noto Sans KR', sans-serif;
  font-size: ${props => props.theme.font.body};
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
    font-size: ${props => props.theme.font.h1Sm};
    letter-spacing: -0.022em;
    margin-top: ${props => props.theme.space[14]};
    margin-bottom: ${props => props.theme.space[4]};
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
    font-size: ${props => props.theme.font.h3};
    letter-spacing: -0.018em;
    margin-top: ${props => props.theme.space[10]};
    margin-bottom: ${props => props.theme.space[3]};
    line-height: 1.4;
  }

  & h4 {
    font-size: ${props => props.theme.font.h4};
    color: ${props => props.theme.colors.secondaryText};
    margin-top: ${props => props.theme.space[7]};
    margin-bottom: ${props => props.theme.space[2]};
    line-height: 1.45;
  }

  & h5 {
    font-size: ${props => props.theme.font.h5};
    margin-top: ${props => props.theme.space[5]};
    margin-bottom: ${props => props.theme.space[2]};
  }

  & h6 {
    font-size: ${props => props.theme.font.h6};
    margin-top: ${props => props.theme.space[4]};
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
    transition: all ${props => props.theme.transition.fast};
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
    border-radius: ${props => props.theme.radius.sm};
    color: ${props => props.theme.colors.text};
    border: 1px solid ${props => props.theme.colors.divider};
    font-weight: 500;
    position: relative;
    top: -0.5px;
  }

  /* ── Code blocks ──────────────────────────────────── */
  & pre {
    font-family: 'JetBrains Mono', monospace;
    font-size: ${props => props.theme.font.md};
    line-height: 1.65;
    padding: ${props => props.theme.space[5]} ${props => props.theme.space[6]};
    border-radius: ${props => props.theme.radius.lg};
    overflow-x: auto;
    margin: ${props => props.theme.space[6]} 0;

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
    font-size: ${props => props.theme.font.md};
  }

  /* ── Blockquote ───────────────────────────────────── */
  & blockquote {
    margin: ${props => props.theme.space[7]} 0;
    padding: ${props => props.theme.space[5]} ${props => props.theme.space[6]};
    border-left: 3px solid ${props => props.theme.colors.accent};
    background: ${props => props.theme.colors.bodyBackground};
    border-radius: 0 ${props => props.theme.radius.md}
      ${props => props.theme.radius.md} 0;
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
    gap: ${props => props.theme.space[2]};
    list-style: none;
  }

  & ul li,
  & ol li {
    padding-left: ${props => props.theme.space[6]};
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
    margin: ${props => props.theme.space[2]} 0 0;
  }

  & li p {
    margin: 0;
  }

  /* ── Images ───────────────────────────────────────── */
  & img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: ${props => props.theme.radius.lg};
    margin: ${props => props.theme.space[8]} auto;
    border: 1px solid ${props => props.theme.colors.divider};
    box-shadow: ${props => props.theme.shadow.hairline}
      ${props => props.theme.colors.headerShadow};
  }

  & figcaption {
    margin-top: ${props => props.theme.space[2]};
    text-align: center;
    font-size: ${props => props.theme.font.sm};
    font-style: italic;
    color: ${props => props.theme.colors.tertiaryText};
  }

  /* ── Table ────────────────────────────────────────── */
  & table {
    width: 100%;
    border-collapse: collapse;
    margin: ${props => props.theme.space[7]} 0;
    font-size: ${props => props.theme.font.lg};
    border: 1px solid ${props => props.theme.colors.divider};
    border-radius: ${props => props.theme.radius.lg};
    overflow: hidden;
    display: table;
  }

  & th,
  & td {
    padding: ${props => props.theme.space[3]} ${props => props.theme.space[4]};
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
    margin: ${props => props.theme.space[11]} 0;
  }

  /* ── KaTeX ────────────────────────────────────────── */
  & .katex-display {
    margin: ${props => props.theme.space[6]} 0;
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
  @media (max-width: ${props => props.theme.bp.md}) {
    font-size: ${props => props.theme.font.lg};
    padding: ${props => props.theme.space[8]} 0 ${props => props.theme.space[11]};

    & h2 {
      font-size: ${props => props.theme.font.h2};
    }

    & h2::before {
      display: none;
    }

    & h3 {
      font-size: ${props => props.theme.font.h4};
    }
  }
`

export default StyledMarkdown
