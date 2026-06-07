import React, { useEffect, useState } from "react"
import styled from "styled-components"
import { navigate } from "gatsby"
import { getTopPosts } from "../../utils/supabase"
import { cardTitleHover } from "assets/theme/mixins"

/* ── Joined card grid ───────────────────────────────────
   A single outer border with the cards attached and divided by
   border-right (not separate, floating cards). On hover a card
   "pops out": it rounds, lifts, and gains a full border ring +
   shadow — drawn with box-shadow so neighbours don't shift. The
   grid is NOT overflow-clipped, or the lift/ring would be cut off.
   ──────────────────────────────────────────────────── */

const PopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: ${props => props.theme.radius.xl};
  background: ${props => props.theme.colors.bodyBackground};

  @media (max-width: ${props => props.theme.bp.lg}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: ${props => props.theme.bp.sm}) {
    grid-template-columns: 1fr;
  }
`

const PopCard = styled.div`
  position: relative;
  padding: ${props => props.theme.space[5]} ${props => props.theme.space[5]}
    ${props => props.theme.space[6]};
  border-right: 1px solid ${props => props.theme.colors.divider};
  cursor: pointer;
  transition: all ${props => props.theme.transition.card};
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 150px;

  /* End cards round their OUTER corners to match the container, so they pop
     out with one rounded side on hover (middle cards stay rectangular). */
  &:first-child {
    border-top-left-radius: ${props => props.theme.radius.xl};
    border-bottom-left-radius: ${props => props.theme.radius.xl};
  }

  &:last-child {
    border-right: none;
    border-top-right-radius: ${props => props.theme.radius.xl};
    border-bottom-right-radius: ${props => props.theme.radius.xl};
  }

  /* 2-col layout: dividers + corner rounding (1 = TL, 2 = TR, last = BL) */
  @media (max-width: ${props => props.theme.bp.lg}) {
    border-bottom: 1px solid ${props => props.theme.colors.divider};

    &:nth-child(2n) {
      border-right: none;
    }

    &:nth-last-child(-n + 2) {
      border-bottom: none;
    }

    &:first-child {
      border-radius: 0;
      border-top-left-radius: ${props => props.theme.radius.xl};
    }

    &:nth-child(2) {
      border-top-right-radius: ${props => props.theme.radius.xl};
    }

    &:last-child {
      border-radius: 0;
      border-bottom-left-radius: ${props => props.theme.radius.xl};
    }
  }

  @media (max-width: ${props => props.theme.bp.sm}) {
    border-right: none;
    border-bottom: 1px solid ${props => props.theme.colors.divider};
    min-height: 130px;
    padding: ${props => props.theme.space[4]} ${props => props.theme.space[4]}
      ${props => props.theme.space[5]};

    /* 1-col stack: only first (top) and last (bottom) cards round */
    &:nth-child(n) {
      border-radius: 0;
    }

    /* The 2-col block (max-width: lg) also matches here and strips the bottom
       border off the last two cards via :nth-last-child — re-assert it so every
       row keeps its divider; :last-child below still removes the final one. */
    &:nth-last-child(-n + 2) {
      border-bottom: 1px solid ${props => props.theme.colors.divider};
    }

    &:first-child {
      border-top-left-radius: ${props => props.theme.radius.xl};
      border-top-right-radius: ${props => props.theme.radius.xl};
    }

    &:last-child {
      border-bottom: none;
      border-bottom-left-radius: ${props => props.theme.radius.xl};
      border-bottom-right-radius: ${props => props.theme.radius.xl};
    }
  }

  /* Pop out on hover keeping the grid's rectangular border: a full border
     ring (box-shadow, so neighbours don't shift) + lift + shadow. */
  &:hover {
    z-index: 1;
    transform: translateY(-2px);
    background: ${props => props.theme.colors.bodyBackground};
    box-shadow: 0 0 0 1px ${props => props.theme.colors.text},
      ${props => props.theme.shadow.cardHover}
      ${props => props.theme.colors.headerShadow};
  }
`

/* .pop-meta: top eyebrow row — rank (#1, accent) + view count (muted) */
const PopMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  letter-spacing: 0.06em;
`

const PopRank = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.accent};
`

const PopViews = styled.span`
  color: ${props => props.theme.colors.tertiaryText};
`

/* .pop-title: pushed to bottom with margin-top: auto, 3-line clamp */
const PopTitle = styled.h3`
  font-size: ${props => props.theme.font.lg};
  font-weight: 600;
  line-height: 1.45;
  color: ${props => props.theme.colors.secondaryText};
  word-break: keep-all;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.008em;
  margin-top: auto;
  ${cardTitleHover(PopCard)}
`

/* .pop-date: JetBrains Mono, muted — sits at the bottom of the card */
const PopDate = styled.div`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  letter-spacing: 0.06em;
`

/* ── Skeleton ─────────────────────────────────────────── */

const SkeletonCard = styled.div`
  padding: ${props => props.theme.space[5]} ${props => props.theme.space[5]}
    ${props => props.theme.space[6]};
  border-right: 1px solid ${props => props.theme.colors.divider};
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 150px;

  &:last-child {
    border-right: none;
  }
`

const SkeletonBar = styled.div`
  height: ${props => props.$h || "10px"};
  border-radius: ${props => props.theme.radius.xs};
  background-color: ${props => props.theme.colors.divider};
  width: ${props => props.$w || "100%"};
`

/* Skeleton title block — pinned to the bottom like the real PopTitle */
const SkeletonTitle = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const EmptyText = styled.p`
  margin: 0;
  font-size: ${props => props.theme.font.base};
  color: ${props => props.theme.colors.tertiaryText};
  padding: ${props => props.theme.space[6]} 0;
`

/* ── Component ─────────────────────────────────────────── */

// Compact view count: 1234 → "1.2k", 980 → "980".
const formatViews = views => {
  const n = views || 0
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${n}`
}

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
            <SkeletonBar $h="11px" $w="55%" />
            <SkeletonTitle>
              <SkeletonBar $h="13px" $w="90%" />
              <SkeletonBar $h="13px" $w="65%" />
            </SkeletonTitle>
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
        <PopCard key={post.slug} data-clickable onClick={() => navigate(post.slug)}>
          <PopMeta>
            <PopRank>#{i + 1}</PopRank>
            <PopViews>{formatViews(post.view_count)} views</PopViews>
          </PopMeta>
          <PopTitle>{post.title}</PopTitle>
          {post.date && <PopDate>{post.date}</PopDate>}
        </PopCard>
      ))}
    </PopGrid>
  )
}

export default PopularPosts
