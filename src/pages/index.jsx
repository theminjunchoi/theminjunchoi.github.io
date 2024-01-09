import React from "react"
import _ from "lodash"
import { graphql } from "gatsby"

import Layout from "components/Layout"
import SEO from "components/SEO"
import Bio from "components/Bio"
import PostList from "components/PostList"
import SideTagList from "components/SideTagList"
import Divider from "components/Divider"
import VerticalSpace from "components/VerticalSpace"

import { title, description, siteUrl } from "../../blog-config"

const BlogIndex = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes
  const tags = _.sortBy(data.allMarkdownRemark.group, ["totalCount"]).reverse()


  if (posts.length === 0) {
    return (
      <p>
        No blog posts found. Add markdown posts to &quot;content/blog&quot; (or
        the directory you specified for the &quot;gatsby-source-filesystem&quot;
        plugin in gatsby-config.js).
      </p>
    )
  }

  return (

    <Layout>
      <SEO title={title} description={description} url={siteUrl} />
      <VerticalSpace size={48} />
      <Bio />
      <Divider />
      <SideTagList tags={tags} postCount={posts.length} />
      <PostList postList={posts} />
    </Layout>
  )
}

export default BlogIndex

export const pageQuery = graphql`
query BlogIndex {
  site {
    siteMetadata {
      title
    }
  }
  markdownRemark(frontmatter: {title: {eq: "MJ"}}) {
    html
  }
  allMarkdownRemark(sort: {frontmatter: {date: DESC}}) {
    group(field: {frontmatter: {tags: SELECT}}) {
      fieldValue
      totalCount
    }
    nodes {
      excerpt
      fields {
        slug
      }
      frontmatter {
        date(formatString: "YYYY년 MM월 DD일 HH:MM")
        updated(formatString: "YYYY년 MM월 DD일 HH:MM")
        title
        description
        tags
      }
    }
  }
}
`
