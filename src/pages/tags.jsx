import React, { useState, useEffect, useRef } from "react"
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
import VerticleSpace from "components/VerticalSpace"

import { title, description, siteUrl } from "../../blog-config"

const TagListWrapper = styled.div`
  margin-top: 20px;

  @media (max-width: 768px) {
    padding: 0 15px;
  }
`

const TagTitle = styled.p`
  color: ${props => props.theme.colors.secondAccentText};
  display: inline;
`

const TagsPage = ({ data }) => {
  const tags = _.sortBy(data.allMarkdownRemark.group, ["totalCount"]).reverse()
  const posts = data.allMarkdownRemark.nodes

  const [selected, setSelected] = useState()
  const [filteredPosts, setFilteredPosts] = useState([])

  const firstItemRef = useRef(null);

  let query = null
  if (typeof document !== "undefined") {
    query = document.location.search
  }

  useEffect(() => {
    if (!selected) {
      setFilteredPosts(posts)
      return
    }

    const filtered = filter(posts, post => post.frontmatter.tags && post.frontmatter.tags.indexOf(selected) !== -1)
    setFilteredPosts(filtered)
  }, [selected, posts])

  useEffect(() => {
    const q = decodeURIComponent(queryString.parse(query)["q"] || "")
    setSelected(q)
  }, [query])

  // useEffect(()=> {
  //   firstItemRef.current?.scrollIntoView({behavior: 'smooth', block: "start"});
  // }, [selected])

  return (
    <Layout>
      <SEO title={title} description={description} url={siteUrl} />

      <TagListWrapper>
        {selected ? (
          <Title size="sm">
          #{selected}에 {filteredPosts.length}개의 글이 있습니다.
          </Title>

          
          ) : (
          <Title size="sm">
            총 {tags.length}개의 tag{tags.length > 1 && "s"}가 있습니다.
          </Title>
        )}

        <TagList
          count
          tagList={tags}
          selected={selected}
          onClick={tag => {
            console.log(tag, selected)
            if (tag === selected) {
              navigate("/tags")
              alert("zz")
            } else {
              setSelected(tag)
              navigate(`/tags?q=${tag.fieldValue}`)
            }
          }}
        />
      </TagListWrapper>

      <VerticleSpace size={32} ref={firstItemRef}/>

      <PostList postList={filteredPosts} />
    </Layout>
  )
}

export default TagsPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      group(field: frontmatter___tags) {
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
          tags
        }
      }
    }
  }
`
