import React from "react"
import _ from "lodash"
import styled from "styled-components"
import SEO from "components/SEO"
import { graphql, navigate } from "gatsby"
import queryString from "query-string"
import Layout from "components/Layout"
import ArchiveList from "components/ArchiveList"
import PageHeader from "components/PageHeader"
import { title, description, siteUrl } from "../../gatsby-meta-config"

/* ── Filter Bar ──────────────────────────────────────── */

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: ${props => props.theme.space[7]} 0;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
  margin-bottom: ${props => props.theme.space[9]};
`

const FilterChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: ${props => props.theme.radius.md};
  border: none;
  background: ${props =>
    props.$active ? props.theme.colors.accentBg : props.theme.colors.background};
  color: ${props =>
    props.$active
      ? props.theme.colors.accentText
      : props.theme.colors.secondaryText};
  font-size: ${props => props.theme.font.sm};
  font-weight: ${props => (props.$active ? "600" : "500")};
  cursor: pointer;
  transition: all ${props => props.theme.transition.fast};

  &:hover {
    background: ${props =>
      props.$active ? props.theme.colors.accentBg : props.theme.colors.divider};
  }
`

/* ── Page ────────────────────────────────────────────── */

const PostsPage = ({ data, location }) => {
  const tags = _.sortBy(data.allMarkdownRemark.group, ["totalCount"]).reverse()
  const posts = data.allMarkdownRemark.nodes

  const parsed = queryString.parse(location?.search || "")
  const selectedTag = decodeURIComponent(parsed.q || "")

  const filteredPosts = selectedTag
    ? posts.filter(post => post.frontmatter.tags?.includes(selectedTag))
    : posts

  const handleChip = tag => {
    if (tag) {
      navigate(`/posts?q=${encodeURIComponent(tag)}`)
    } else {
      navigate("/posts")
    }
  }

  return (
    <Layout maxWidth="1180px">
      <SEO title={title} description={description} url={siteUrl} />

      <PageHeader
        eyebrow="/ posts · archive"
        title="모든 글"
        counter={
          selectedTag
            ? `#${selectedTag} — ${filteredPosts.length}개의 글`
            : `전체 ${filteredPosts.length}개의 글`
        }
      />

      <FilterBar>
        <FilterChip $active={!selectedTag} onClick={() => handleChip("")}>
          전체
        </FilterChip>
        {tags.map(tag => (
          <FilterChip
            key={tag.fieldValue}
            $active={selectedTag === tag.fieldValue}
            onClick={() => handleChip(tag.fieldValue)}
          >
            {tag.fieldValue}
            <span style={{ opacity: 0.6, fontSize: "11px" }}>
              {tag.totalCount}
            </span>
          </FilterChip>
        ))}
      </FilterBar>

      <ArchiveList posts={filteredPosts} />
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
