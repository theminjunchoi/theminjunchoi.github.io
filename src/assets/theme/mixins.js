import { css } from "styled-components"

// ── Shared hover treatments ───────────────────────────────
// One source of truth for the blog's hover interactions, grouped
// by the ROLE of the element. The same kind of element should feel
// the same everywhere — tweak a mixin here to change it site-wide.
//
//   cardHover        clickable cards (lift + border emphasis + shadow)
//   cardTitleHover   title nested inside a hovered card (→ accent)
//   linkHover        inline / list links (→ accent)
//   chipHover        neutral chips/buttons (→ accent background)
//   chipHoverSubtle  chips already accent-colored at rest (subtle fade)
//
// Every standalone card uses the SAME hover, so each needs its own resting
// border + border-radius. The one exception is the joined PopularPosts grid:
// its cells share borders, so it reproduces this same look (border ring +
// lift + shadow) locally with box-shadow instead of using this mixin.

// Clickable cards: lift + border emphasis + soft shadow.
export const cardHover = css`
  transition: all ${props => props.theme.transition.card};

  &:hover {
    border-color: ${props => props.theme.colors.text};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadow.cardHover}
      ${props => props.theme.colors.headerShadow};
  }
`

// Title nested inside a card — shifts to the accent color when the parent
// card is hovered. Pass the parent styled-component as the argument.
export const cardTitleHover = parent => css`
  transition: color ${props => props.theme.transition.fast};

  ${parent}:hover & {
    color: ${props => props.theme.colors.accent};
  }
`

// Inline / standalone links and list items — accent color on hover.
export const linkHover = css`
  transition: color ${props => props.theme.transition.fast};

  &:hover {
    color: ${props => props.theme.colors.accent};
  }
`

// Neutral chips / pill buttons (neutral or transparent at rest) — fill with
// the accent background and accent text on hover.
export const chipHover = css`
  transition: all ${props => props.theme.transition.fast};

  &:hover {
    background: ${props => props.theme.colors.accentBg};
    color: ${props => props.theme.colors.accentText};
  }
`

// Chips that already sit on the accent background at rest — a fill hover
// would be invisible, so give them a subtle fade instead.
export const chipHoverSubtle = css`
  transition: opacity ${props => props.theme.transition.fast};

  &:hover {
    opacity: 0.8;
  }
`
