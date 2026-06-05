import React from "react"
import styled from "styled-components"

const FooterWrapper = styled.footer`
  margin-top: ${props => props.theme.space[16]};
  padding: ${props => props.theme.space[8]} 0 ${props => props.theme.space[12]};
  border-top: 1px solid ${props => props.theme.colors.divider};
`

const FooterInner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${props => props.theme.space[4]};
  max-width: ${props => props.theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 ${props => props.theme.space[8]};
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  letter-spacing: 0.02em;

  @media (max-width: ${props => props.theme.bp.md}) {
    padding: 0 ${props => props.theme.space[5]};
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
