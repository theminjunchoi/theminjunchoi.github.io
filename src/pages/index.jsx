import React from "react"
import _ from "lodash"
import { graphql } from "gatsby"

import Layout from "components/Layout"
import SEO from "components/SEO"
import Bio from "components/Bio"
import PostList from "components/PostList"
import SideTagList from "components/SideTagList"
import Divider from "components/Divider"
import Info from "components/Info"
import VerticalSpace from "components/VerticalSpace"
import Tab from "components/Tab"

import { title, description, siteUrl } from "../../gatsby-meta-config"

const BlogIndex = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes
  const tags = _.sortBy(data.allMarkdownRemark.group, ["totalCount"]).reverse()
  const { author, language } = data.site.siteMetadata;

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
      {/* <VerticalSpace size={48} /> */}
      <Info author={author} language={language} />
      {/* <Bio author={author} language={language}/> */}
      <Tab postsCount={posts.length} activeTab="posts" />
      {/* <Divider /> */}
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
      language
      author {
        name
        bio {
          role
          description
          thumbnail
        }
      }
      links {
        github
        linkedIn
        email
      }
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