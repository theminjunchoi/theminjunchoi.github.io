import React from "react"
import styled from "styled-components"

import { writer } from "../../../../gatsby-meta-config"

import Divider from "components/Divider"
import TagList from "components/TagList"

const Wrapper = styled.div`
  margin-top: 32px;
  @media (max-width: 768px) {
    padding: 0 15px;
  }
`

const ArticleTitle = styled.h1`
  margin-bottom: 20px;
  line-height: 1.25;
  font-size: 36px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  word-break: break-word;
`

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 14px;
  color: ${props => props.theme.colors.tertiaryText};
`

const Author = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.secondaryText};
`

const Dot = styled.span`
  opacity: 0.4;
`

const TagsRow = styled.div`
  margin-top: 16px;
  margin-bottom: 4px;
`

const Header = ({ title, date, tags, minToRead, updated }) => {
  return (
    <Wrapper>
      <ArticleTitle>{title}</ArticleTitle>
      <MetaRow>
        <Author>@{writer}</Author>
        <Dot>·</Dot>
        <span>{minToRead} min read</span>
        <Dot>·</Dot>
        <span>{date}</span>
      </MetaRow>
      {updated && (
        <MetaRow>
          <span>Updated {updated}</span>
        </MetaRow>
      )}
      {tags && (
        <TagsRow>
          <TagList tagList={tags} />
        </TagsRow>
      )}
      <Divider mt="24px" mb="32px" />
    </Wrapper>
  )
}

export default Header
