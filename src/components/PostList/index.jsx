import React, { useState } from "react"
import styled from "styled-components"
import { navigate } from "gatsby"

import TagList from "components/TagList"

const POSTS_PER_PAGE = 10

const PostListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (max-width: ${props => props.theme.bp.md}) {
    padding: 0 4px;
  }
`

const PostCard = styled.article`
  padding: ${props => props.theme.space[6]} ${props => props.theme.space[7]};
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: ${props => props.theme.radius.xl};
  transition: all ${props => props.theme.transition.base} ease;
  background-color: ${props => props.theme.colors.bodyBackground};
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.activatedBorder};
    box-shadow: ${props => props.theme.shadow.cardHover}
      ${props => props.theme.colors.headerShadow};
    transform: translateY(-2px);
  }
`

const PostTitle = styled.h2`
  margin: ${props => props.theme.space[2]} 0 10px;
  font-size: ${props => props.theme.font.h3};
  font-weight: 700;
  line-height: 1.45;
  color: ${props => props.theme.colors.text};
  word-break: break-word;
  transition: color ${props => props.theme.transition.fast};

  ${PostCard}:hover & {
    color: ${props => props.theme.colors.accentText};
  }
`

const Excerpt = styled.p`
  margin-bottom: 14px;
  line-height: 1.65;
  font-size: ${props => props.theme.font.lg};
  color: ${props => props.theme.colors.secondaryText};
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const PostMeta = styled.div`
  margin-top: ${props => props.theme.space[1]};
  font-size: ${props => props.theme.font.base};
  color: ${props => props.theme.colors.tertiaryText};
`

const TagWrapper = styled.div`
  & a {
    position: relative;
    z-index: 1;
  }
`

/* ── Pagination ── */

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${props => props.theme.space[1]};
  margin-top: ${props => props.theme.space[9]};
  margin-bottom: ${props => props.theme.space[2]};
`

const PageButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border-radius: ${props => props.theme.radius.md};
  border: 1px solid
    ${props =>
      props.active ? props.theme.colors.accent : props.theme.colors.divider};
  background-color: ${props =>
    props.active ? props.theme.colors.accentBg : "transparent"};
  color: ${props =>
    props.active
      ? props.theme.colors.accentText
      : props.disabled
      ? props.theme.colors.mutedText
      : props.theme.colors.secondaryText};
  font-size: ${props => props.theme.font.base};
  font-weight: ${props => (props.active ? "600" : "400")};
  cursor: ${props => (props.disabled ? "default" : "pointer")};
  transition: all ${props => props.theme.transition.fast};
  pointer-events: ${props => (props.disabled ? "none" : "auto")};

  &:hover {
    border-color: ${props =>
      props.active
        ? props.theme.colors.accent
        : props.theme.colors.activatedBorder};
    color: ${props =>
      props.active ? props.theme.colors.accentText : props.theme.colors.text};
  }
`

const getPageNumbers = (current, total) => {
  const delta = 2
  const pages = []
  for (
    let i = Math.max(1, current - delta);
    i <= Math.min(total, current + delta);
    i++
  ) {
    pages.push(i)
  }
  return pages
}

const PostList = ({ postList, currentPage: controlledPage, onPageChange }) => {
  const isControlled = controlledPage !== undefined
  const [internalPage, setInternalPage] = useState(1)
  const currentPage = isControlled
    ? Number.isNaN(controlledPage) ? 1 : Math.max(1, controlledPage)
    : internalPage
  const totalPages = Math.ceil(postList.length / POSTS_PER_PAGE)

  const startIdx = (currentPage - 1) * POSTS_PER_PAGE
  const currentPosts = postList.slice(startIdx, startIdx + POSTS_PER_PAGE)

  const handlePageChange = page => {
    if (isControlled && onPageChange) {
      onPageChange(page)
    } else {
      setInternalPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <>
      <PostListWrapper>
        {currentPosts.map(post => {
          const { title, description, date, tags } = post.frontmatter
          const { excerpt } = post
          const { slug } = post.fields

          const handleCardClick = e => {
            if (e.target.closest("a")) return
            navigate(slug)
          }

          return (
            <PostCard key={slug} onClick={handleCardClick}>
              <TagWrapper>
                <TagList tagList={tags} />
              </TagWrapper>
              <PostTitle>{title}</PostTitle>
              {(description || excerpt) && (
                <Excerpt>{description || excerpt}</Excerpt>
              )}
              <PostMeta>{date}</PostMeta>
            </PostCard>
          )
        })}
      </PostListWrapper>

      {totalPages > 1 && (
        <PaginationWrapper>
          <PageButton
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            ←
          </PageButton>

          {pageNumbers[0] > 1 && (
            <>
              <PageButton onClick={() => handlePageChange(1)}>1</PageButton>
              {pageNumbers[0] > 2 && (
                <PageButton disabled style={{ border: "none" }}>
                  …
                </PageButton>
              )}
            </>
          )}

          {pageNumbers.map(num => (
            <PageButton
              key={num}
              active={num === currentPage}
              onClick={() => handlePageChange(num)}
            >
              {num}
            </PageButton>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <PageButton disabled style={{ border: "none" }}>
                  …
                </PageButton>
              )}
              <PageButton onClick={() => handlePageChange(totalPages)}>
                {totalPages}
              </PageButton>
            </>
          )}

          <PageButton
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            →
          </PageButton>
        </PaginationWrapper>
      )}
    </>
  )
}

export default PostList
