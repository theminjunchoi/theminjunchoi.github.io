import React from "react"
import styled from "styled-components"

import { title } from "../../../../gatsby-meta-config"

const FooterWrapper = styled.footer`
  margin-top: 48px;
  padding: 28px 0;
  border-top: 1px solid ${props => props.theme.colors.divider};
  text-align: center;
  font-size: 13px;
  color: ${props => props.theme.colors.tertiaryText};

  & > a {
    color: ${props => props.theme.colors.secondaryText};
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: ${props => props.theme.colors.text};
    }
  }
`

const Footer = () => {
  return (
    <FooterWrapper>
      © {new Date().getFullYear()} {title}
    </FooterWrapper>
  )
}

export default Footer
