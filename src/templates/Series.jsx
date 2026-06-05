import React from "react"
import { graphql } from "gatsby"

import Layout from "components/Layout"
import SEO from "components/SEO"
import PageHeader from "components/PageHeader"
import ArchiveList from "components/ArchiveList"

import { description, siteUrl } from "../../gatsby-meta-config"

/* ── Component ───────────────────────────────────────── */

const Series = ({ pageContext, data }) => {
  const seriesName = pageContext.series
  const posts = data.posts.nodes

  return (
    <Layout maxWidth="1180px">
      <SEO
        title={`${seriesName} — Series`}
        description={description}
        url={siteUrl}
      />

      <PageHeader
        eyebrow="/ series · longform"
        title={seriesName}
        counter={`${posts.length} posts`}
        mb="36px"
      />

      <ArchiveList posts={posts} getDate={post => post.frontmatter.rawDate} />
    </Layout>
  )
}

export default Series

export const pageQuery = graphql`
  query BlogSeriesBySeriesName($series: String) {
    posts: allMarkdownRemark(
      sort: { order: DESC, fields: [frontmatter___date] }
      filter: { frontmatter: { series: { eq: $series } } }
    ) {
      nodes {
        excerpt(pruneLength: 200, truncate: true)
        fields {
          slug
        }
        frontmatter {
          rawDate: date(formatString: "MMMM DD, YYYY")
          date(formatString: "YYYY년 MM월 DD일")
          updated(formatString: "YYYY년 MM월 DD일")
          title
          tags
        }
      }
    }
  }
`
