import React from "react"
import styled from "styled-components"
import { Link } from "gatsby"

const TagListWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
`

const TagBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.1px;
  transition: all 0.2s;
  background-color: ${props =>
    props.theme.name === "light" ? "#DBEAFE" : "#1e3a5f"};
  color: ${props =>
    props.theme.name === "light" ? "#2563EB" : "#93C5FD"};

  &:hover {
    background-color: ${props =>
      props.theme.name === "light" ? "#BFDBFE" : "#1e4a7a"};
    filter: none;
  }
`

const SelectedTagBadge = styled(TagBadge)`
  background-color: ${props => props.theme.colors.selectedTagBackground};
  color: ${props => props.theme.colors.selectedTagText};
`

const spaceToDash = text => text.replace(/\s+/g, "-")

const TagList = ({ tagList, count, selected }) => {
  if (!tagList) return null

  if (!count) {
    return (
      <TagListWrapper>
        {tagList.map((tag, i) => (
          <Link key={JSON.stringify({ tag, i })} to={`/posts?q=${tag}`} style={{ textDecoration: "none" }}>
            <TagBadge>{spaceToDash(tag)}</TagBadge>
          </Link>
        ))}
      </TagListWrapper>
    )
  }

  return (
    <TagListWrapper>
      {tagList.map((tag, i) => (
        <Link
          key={JSON.stringify({ tag, i })}
          to={
            selected === tag.fieldValue
              ? "/posts"
              : `/posts?q=${encodeURIComponent(tag.fieldValue)}`
          }
          style={{ textDecoration: "none" }}
        >
          {tag.fieldValue === selected ? (
            <SelectedTagBadge>
              {spaceToDash(tag.fieldValue)} ({tag.totalCount})
            </SelectedTagBadge>
          ) : (
            <TagBadge>
              {spaceToDash(tag.fieldValue)} ({tag.totalCount})
            </TagBadge>
          )}
        </Link>
      ))}
    </TagListWrapper>
  )
}

export default TagList
