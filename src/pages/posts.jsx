import React from "react"
import _ from "lodash"
import styled from "styled-components"
import SEO from "components/SEO"
import filter from "lodash/filter"

import { graphql, navigate } from "gatsby"

import queryString from "query-string"

import Layout from "components/Layout"
import Title from "components/Title"
import TagList from "components/TagList"
import PostList from "components/PostList"
import VerticalSpace from "components/VerticalSpace"

import { title, description, siteUrl } from "../../gatsby-meta-config"

const TagListWrapper = styled.div`
  margin-top: 20px;

  @media (max-width: 768px) {
    padding: 0 15px;
  }
`

const PostsPage = ({ data, location }) => {
  const tags = _.sortBy(data.allMarkdownRemark.group, ["totalCount"]).reverse()
  const posts = data.allMarkdownRemark.nodes

  const parsed = queryString.parse(location?.search || "")
  const selectedTag = decodeURIComponent(parsed.q || "")
  const currentPage = Math.max(1, parseInt(parsed.page || "1", 10) || 1)

  const filteredPosts = selectedTag
    ? filter(posts, post => post.frontmatter.tags?.includes(selectedTag))
    : posts

  const handlePageChange = page => {
    const params = []
    if (selectedTag) params.push(`q=${encodeURIComponent(selectedTag)}`)
    if (page > 1) params.push(`page=${page}`)
    const search = params.length > 0 ? `?${params.join("&")}` : ""
    navigate(`/posts${search}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <Layout>
      <SEO title={title} description={description} url={siteUrl} />
      <TagListWrapper>
        {selectedTag ? (
          <Title size="sm">
            #{selectedTag}에 {filteredPosts.length}개의 글이 있습니다.
          </Title>
        ) : (
          <Title size="sm">
            총 {tags.length}개의 tag{tags.length > 1 && "s"}가 있습니다.
          </Title>
        )}
        <TagList count tagList={tags} selected={selectedTag} />
      </TagListWrapper>
      <VerticalSpace size={32} />
      <PostList
        postList={filteredPosts}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </Layout>
  )
}

export default PostsPage

export const pageQuery = graphql`
  query PostsPage {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: {frontmatter: {date: DESC}}
      filter: {frontmatter: {publish: {eq: true}}}
    ) {
      group(field: {frontmatter: {tags: SELECT}}) {
        fieldValue
        totalCount
      }
      nodes {
        excerpt(pruneLength: 150, truncate: true)
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          updated(formatString: "MMM DD, YYYY")
          title
          description
          tags
        }
      }
    }
  }
`
