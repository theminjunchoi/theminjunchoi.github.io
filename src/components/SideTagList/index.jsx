import React from "react"
import _ from "lodash"
import styled from "styled-components"
import { Link } from "gatsby"
import { linkHover } from "assets/theme/mixins"

const Title = styled.p`
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.colors.secondaryText};
`

const TagItem = styled.li`
  margin-bottom: 11px;
  font-size: 15px;
  color: ${props => props.theme.colors.secondaryText};
  cursor: pointer;
  ${linkHover}

  &:last-child {
    margin-bottom: 0;
  }

  & > a {
    color: inherit;
    text-decoration: none;
  }
`

const SideTagList = ({ tags, postCount }) => {
  return (
    <div>
      <Title>태그 목록</Title>
      <ul>
        <TagItem>
          <Link to="/posts">전체 ({postCount})</Link>
        </TagItem>
        {_.map(tags, tag => (
          <TagItem key={tag.fieldValue}>
            <Link to={`/posts?q=${tag.fieldValue}`}>
              {tag.fieldValue} ({tag.totalCount})
            </Link>
          </TagItem>
        ))}
      </ul>
    </div>
  )
}

export default SideTagList
