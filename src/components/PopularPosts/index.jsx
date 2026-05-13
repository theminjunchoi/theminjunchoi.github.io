import React, { useEffect, useState } from "react"
import styled from "styled-components"
import { navigate } from "gatsby"
import { getTopPosts } from "../../utils/supabase"

/* ── Outer border container ─────────────────────────────
   .popular: single outer border, border-radius, overflow hidden
   Cards separated by border-right (not individual card borders)
   ──────────────────────────────────────────────────── */

const PopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: 14px;
  overflow: hidden;
  background: ${props => props.theme.colors.bodyBackground};

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`

const PopCard = styled.div`
  position: relative;
  padding: 22px 22px 24px;
  border-right: 1px solid ${props => props.theme.colors.divider};
  cursor: pointer;
  transition: background 0.22s;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 180px;

  &:last-child {
    border-right: none;
  }

  /* 2-col layout: right items lose border */
  @media (max-width: 900px) {
    border-bottom: 1px solid ${props => props.theme.colors.divider};

    &:nth-child(2n) {
      border-right: none;
    }

    &:nth-last-child(-n + 2) {
      border-bottom: none;
    }
  }

  @media (max-width: 540px) {
    border-right: none;
    border-bottom: 1px solid ${props => props.theme.colors.divider};
    min-height: 150px;
    padding: 18px 18px 20px;

    &:last-child {
      border-bottom: none;
    }
  }

  &:hover {
    background: ${props => props.theme.colors.background};
  }
`

/* .pop-rank: JetBrains Mono, 11px, accent color (POPULAR label) */
const PopRank = styled.div`
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.theme.colors.accent};
  letter-spacing: 0.06em;
`

/* .pop-rank-num: large, dark, displayed as block above POPULAR */
const PopRankNum = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  display: block;
  font-family: "Inter Tight", sans-serif;

  @media (max-width: 540px) {
    font-size: 22px;
  }
`

/* .pop-title: pushed to bottom with margin-top: auto, 3-line clamp */
const PopTitle = styled.h3`
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.45;
  color: ${props => props.theme.colors.secondaryText};
  word-break: keep-all;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.18s;
  letter-spacing: -0.008em;
  margin-top: auto;

  ${PopCard}:hover & {
    color: ${props => props.theme.colors.accent};
  }
`

/* .pop-date: JetBrains Mono, 10.5px, muted */
const PopDate = styled.div`
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px;
  color: ${props => props.theme.colors.tertiaryText};
  letter-spacing: 0.06em;
`

/* ── Skeleton ─────────────────────────────────────────── */

const SkeletonCard = styled.div`
  padding: 22px 22px 24px;
  border-right: 1px solid ${props => props.theme.colors.divider};
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 180px;

  &:last-child {
    border-right: none;
  }
`

const SkeletonBar = styled.div`
  height: ${props => props.$h || "10px"};
  border-radius: 4px;
  background-color: ${props => props.theme.colors.divider};
  width: ${props => props.$w || "100%"};
`

const EmptyText = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${props => props.theme.colors.tertiaryText};
  padding: 24px 0;
`

/* ── Component ─────────────────────────────────────────── */

const PopularPosts = ({ allPosts }) => {
  const [popularPosts, setPopularPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await getTopPosts(5)
      if (data && data.length > 0) {
        const enriched = data
          .map(({ slug, view_count }) => {
            const post = allPosts.find(p => p.fields.slug === slug)
            if (!post) return null
            return {
              slug,
              view_count,
              title: post.frontmatter.title,
              date: post.frontmatter.date,
            }
          })
          .filter(Boolean)
        setPopularPosts(enriched)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <PopGrid>
        {[0, 1, 2, 3, 4].map(i => (
          <SkeletonCard key={i}>
            <SkeletonBar $h="24px" $w="40px" />
            <SkeletonBar $h="10px" $w="90%" />
            <SkeletonBar $h="10px" $w="70%" />
            <SkeletonBar $h="10px" $w="80%" />
          </SkeletonCard>
        ))}
      </PopGrid>
    )
  }

  if (popularPosts.length === 0) {
    return <EmptyText>아직 방문 기록이 없어요</EmptyText>
  }

  return (
    <PopGrid>
      {popularPosts.map((post, i) => (
        <PopCard key={post.slug} onClick={() => navigate(post.slug)}>
          <PopRank>
            <PopRankNum>{String(i + 1).padStart(2, "0")}</PopRankNum>
            POPULAR
          </PopRank>
          <PopTitle>{post.title}</PopTitle>
          {post.date && <PopDate>{post.date}</PopDate>}
        </PopCard>
      ))}
    </PopGrid>
  )
}

export default PopularPosts
