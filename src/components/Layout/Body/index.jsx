import React from "react"
import styled from "styled-components"

const BodyWrapper = styled.div`
  margin: 0 auto;
  padding-top: 80px;
  max-width: ${props => props.$maxWidth || "900px"};
  padding-left: ${props => props.theme.space[4]};
  padding-right: ${props => props.theme.space[4]};
  box-sizing: border-box;
  min-height: calc(100vh - 120px);

  @media (min-width: ${props => props.theme.bp.sm}) {
    padding-left: ${props => props.theme.space[8]};
    padding-right: ${props => props.theme.space[8]};
  }
`

const Body = ({ children, maxWidth }) => {
  return <BodyWrapper $maxWidth={maxWidth}>{children}</BodyWrapper>
}

export default Body
