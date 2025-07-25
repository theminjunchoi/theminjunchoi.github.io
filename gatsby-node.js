const { createFilePath } = require(`gatsby-source-filesystem`)
const _ = require("lodash")
const fs = require('fs')
const path = require('path')

exports.onPreInit = async () => {
  const src = path.join(__dirname, 'contents/posts/attachments')
  const dest = path.join(__dirname, 'static/attachments')
  
  try {
    await fs.promises.cp(src, dest, { recursive: true })
    console.log('✅ Attachments copied to static/attachments for dev server')
  } catch (err) {
    console.error('❌ Failed to copy attachments:', err)
  }
}

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  const postTemplate = require.resolve(`./src/templates/Post.jsx`)
  const seriesTemplate = require.resolve(`./src/templates/Series.jsx`)

  const result = await graphql(`
    {
      postsRemark: allMarkdownRemark(
        sort: { fields: [frontmatter___date], order: ASC }
        filter: { 
          fileAbsolutePath: { regex: "/contents/posts/" }
          frontmatter: { publish: { eq: true } } 
        }
        limit: 1000
      ) {
        nodes {
          id
          fields {
            slug
          }
          frontmatter {
            series
          }
        }
      }
      tagsGroup: allMarkdownRemark(limit: 2000) {
        group(field: frontmatter___tags) {
          fieldValue
        }
      }
    }
  `)

  if (result.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blog posts`,
      result.errors
    )
    return
  }

  const posts = result.data.postsRemark.nodes
  const series = _.reduce(
    posts,
    (acc, cur) => {
      const seriesName = cur.frontmatter.series
      if (seriesName && !_.includes(acc, seriesName))
        return [...acc, seriesName]
      return acc
    },
    []
  )

  if (posts.length > 0) {
    posts.forEach((post, index) => {
      const previousPostId = index === 0 ? null : posts[index - 1].id
      const nextPostId = index === posts.length - 1 ? null : posts[index + 1].id

      createPage({
        path: post.fields.slug,
        component: postTemplate,
        context: {
          id: post.id,
          series: post.frontmatter.series,
          previousPostId,
          nextPostId,
        },
      })
    })
  }

  if (series.length > 0) {
    series.forEach(singleSeries => {
      const path = `/series/${_.replace(singleSeries, /\s/g, "-")}`
      createPage({
        path,
        component: seriesTemplate,
        context: {
          series: singleSeries,
        },
      })
    })
  }
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode })
    const newSlug = `/${slug.split("/").reverse()[1]}/`

    createNodeField({
      node,
      name: `slug`,
      value: newSlug,
    })
  }
}

exports.onPostBuild = async () => {
  const src = path.join(__dirname, 'contents/posts/attachments')
  const dest = path.join(__dirname, 'public/attachments')
  
  try {
    await fs.promises.cp(src, dest, { recursive: true })
    console.log('✅ Attachments copied to public/attachments')
  } catch (err) {
    console.error('❌ Failed to copy attachments:', err)
  }
}

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  const typeDefs = `
  type MarkdownRemark implements Node {
    frontmatter: Frontmatter!
  }
  type Frontmatter @dontInfer{
    title: String!
    description: String
    date: Date! @dateformat
    updated: Date @dateformat
    tags: [String!]
    series: String
    publish: Boolean!
  }
  `
  createTypes(typeDefs)
}