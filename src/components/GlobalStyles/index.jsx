import { createGlobalStyle } from "styled-components"
import reset from "styled-reset"

const GlobalStyles = createGlobalStyle`
  ${reset}

  html {
    scroll-behavior: smooth;
    scrollbar-gutter: stable;
  }

  body {
    font-family: 'Noto Sans KR', sans-serif;
    background: ${props => props.theme.colors.bodyBackground};
    color: ${props => props.theme.colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: ${props => props.theme.font.lg};
    letter-spacing: -0.005em;
  }

  ::selection {
    background: ${props => props.theme.colors.accent};
    color: #fff;
  }

  * {
    box-sizing: border-box;
  }

  a:focus-visible,
  button:focus-visible {
    outline: 2px solid ${props => props.theme.colors.accent};
    outline-offset: 2px;
    border-radius: ${props => props.theme.radius.xs};
  }

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.scrollTrack};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.scrollHandle};
    border-radius: 3px;
  }

  a {
    color: inherit;
  }
`

export default GlobalStyles
