import React from "react"
import styled from "styled-components"

const BodyWrapper = styled.div`
  margin: 0 auto;
  padding-top: 80px;
  max-width: 900px;
  padding-left: 16px;
  padding-right: 16px;
  box-sizing: border-box;
  min-height: calc(100vh - 120px);

  @media (min-width: 576px) {
    padding-left: 24px;
    padding-right: 24px;
  }
`

const Body = ({ children }) => {
  return <BodyWrapper>{children}</BodyWrapper>
}

export default Body
