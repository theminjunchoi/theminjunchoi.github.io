import React from "react"
import styled from "styled-components"

import { Link } from "gatsby"

import Divider from "components/Divider"

import { useAbout } from "../../../gatsby-meta-config"

const TabWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.space[1]};
  border-bottom: 1px solid ${props => props.theme.colors.divider};
  margin-top: ${props => props.theme.space[7]};
  margin-bottom: ${props => props.theme.space[7]};

  & a {
    text-decoration: none;
  }
`

const TabButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0 14px;
  height: ${props => props.theme.space[10]};
  background-color: transparent;
  border: none;
  border-bottom: 2px solid;
  border-bottom-color: ${props =>
    props.active ? props.theme.colors.accent : "transparent"};
  font-size: ${props => props.theme.font.md};
  color: ${props =>
    props.active ? props.theme.colors.accentText : props.theme.colors.tertiaryText};
  font-weight: ${props => (props.active ? "600" : "normal")};
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};

  &:hover {
    color: ${props => props.theme.colors.text};
    border-bottom-color: ${props =>
      props.active ? props.theme.colors.accent : props.theme.colors.divider};
  }

  & svg {
    margin-right: 8px;
    height: 18px;
  }
`

const Badge = styled.span`
  display: inline-block;
  margin-left: 7px;
  padding: 3px 6px;
  border-radius: ${props => props.theme.radius.pill};
  background-color: ${props =>
    props.active ? props.theme.colors.accentBg : props.theme.colors.tagBackground};
  color: ${props =>
    props.active ? props.theme.colors.accentText : props.theme.colors.tagText};
  font-weight: normal;
  font-size: ${props => props.theme.font.base};
  letter-spacing: 0.3px;
  transition: all ${props => props.theme.transition.fast};
`

const Tab = ({ postsCount, activeTab }) => {
  if (!useAbout) return <Divider />

  return (
    <TabWrapper>
      <Link to="/posts">
        <TabButton active={activeTab == "posts"}>
          POSTS <Badge active={activeTab == "posts"}>{postsCount}</Badge>
        </TabButton>
      </Link>
      <Link to="/about">
        <TabButton active={activeTab == "about"}>ABOUT</TabButton>
      </Link>
    </TabWrapper>
  )
}

export default Tab