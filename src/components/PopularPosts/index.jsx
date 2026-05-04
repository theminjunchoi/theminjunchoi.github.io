import React, { useEffect, useState } from "react"
import styled from "styled-components"
import { navigate } from "gatsby"
import { getTopPosts } from "../../utils/supabase"

const Card = styled.div``

const CardHeader = styled.p`
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.theme.colors.secondaryText};
`

const PostItem = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  cursor: pointer;

  &:last-child {
    margin-bottom: 4px;
  }

  &:hover > * {
    opacity: 0.6;
  }
`

const Rank = styled.span`
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  color: ${props => props.theme.colors.accentText};
  transition: opacity 0.15s;
`

const PostTitle = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  color: ${props => props.theme.colors.text};
  word-break: keep-all;
  transition: opacity 0.15s;
`

const EmptyText = styled.p`
  margin: 0 0 4px;
  font-size: 12.5px;
  color: ${props => props.theme.colors.tertiaryText};
`

const SkeletonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  align-items: flex-start;
`

const SkeletonBar = styled.div`
  height: 11px;
  border-radius: 4px;
  background-color: ${props => props.theme.colors.divider};
  width: ${props => props.width || "100%"};
  margin-top: 2px;
  flex-shrink: ${props => (props.fixed ? 0 : 1)};
`

const PopularPosts = ({ allPosts }) => {
  const [popularPosts, setPopularPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await getTopPosts(3)
      if (data && data.length > 0) {
        const enriched = data
          .map(({ slug, view_count }) => {
            const post = allPosts.find(p => p.fields.slug === slug)
            if (!post) return null
            return { slug, view_count, title: post.frontmatter.title }
          })
          .filter(Boolean)
        setPopularPosts(enriched)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  return (
    <Card>
        <CardHeader>인기 있는 글</CardHeader>
        {isLoading ? (
          [80, 65, 75].map((w, i) => (
            <SkeletonRow key={i}>
              <SkeletonBar fixed width="10px" />
              <SkeletonBar width={`${w}%`} />
            </SkeletonRow>
          ))
        ) : popularPosts.length === 0 ? (
          <EmptyText>아직 방문 기록이 없어요</EmptyText>
        ) : (
          popularPosts.map((post, i) => (
            <PostItem key={post.slug} onClick={() => navigate(post.slug)}>
              <Rank>{i + 1}</Rank>
              <PostTitle>{post.title}</PostTitle>
            </PostItem>
          ))
        )}
    </Card>
  )
}

export default PopularPosts
