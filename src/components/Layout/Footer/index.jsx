import React from "react"
import styled from "styled-components"

const FooterWrapper = styled.footer`
  margin-top: 64px;
  padding: 32px 0 48px;
  border-top: 1px solid ${props => props.theme.colors.divider};
`

const FooterInner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 32px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  color: ${props => props.theme.colors.tertiaryText};
  letter-spacing: 0.02em;

  @media (max-width: 720px) {
    padding: 0 20px;
  }
`

const Footer = () => {
  const currentYear = new Date().getFullYear()
  return (
    <FooterWrapper>
      <FooterInner>
        <span>© {currentYear} minjun.blog · written by 최민준</span>
      </FooterInner>
    </FooterWrapper>
  )
}

export default Footer
