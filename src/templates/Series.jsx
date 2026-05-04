import React from "react"
import { graphql } from "gatsby"
import styled from "styled-components"

import Layout from "components/Layout"
import SEO from "components/SEO"
import PostList from "components/PostList"
import Divider from "components/Divider"

import { description, siteUrl } from "../../gatsby-meta-config"

const Header = styled.div`
  margin-bottom: 8px;

  @media (max-width: 768px) {
    padding: 0 15px;
  }
`

const SeriesLabel = styled.span`
  display: inline-block;
  margin-bottom: 14px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  background-color: ${props => props.theme.colors.accentBg};
  color: ${props => props.theme.colors.accentText};
`

const Title = styled.h1`
  margin: 0 0 16px;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.25;
  color: ${props => props.theme.colors.text};
  word-break: break-word;
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.theme.colors.tertiaryText};
  margin-bottom: 28px;
`

const Dot = styled.span`
  opacity: 0.4;
`

const Series = ({ pageContext, data }) => {
  const seriesName = pageContext.series
  const posts = data.posts.nodes

  return (
    <Layout>
      <SEO
        title={`SERIES: ${seriesName}`}
        description={description}
        url={siteUrl}
      />

      <Header>
        <SeriesLabel>Series</SeriesLabel>
        <Title>{seriesName}</Title>
        <Meta>
          <span>{posts.length} Posts</span>
          <Dot>·</Dot>
          <span>Last updated {posts[posts.length - 1].frontmatter.date}</span>
        </Meta>
        <Divider />
      </Header>

      <PostList postList={posts} />
    </Layout>
  )
}

export default Series

export const pageQuery = graphql`
  query BlogSeriesBySeriesName($series: String) {
    posts: allMarkdownRemark(
      sort: { order: ASC, fields: [frontmatter___date] }
      filter: { frontmatter: { series: { eq: $series } } }
    ) {
      nodes {
        excerpt(pruneLength: 200, truncate: true)
        fields {
          slug
        }
        frontmatter {
          date(formatString: "YYYY년 MM월 DD일")
          updated(formatString: "YYYY년 MM월 DD일")
          title
          tags
        }
      }
    }
  }
`
