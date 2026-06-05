import React from "react"
import { flow, map, groupBy, sortBy, filter, reverse } from "lodash/fp"
import styled from "styled-components"
import SEO from "components/SEO"
import { graphql, Link } from "gatsby"
import Layout from "components/Layout"
import PageHeader from "components/PageHeader"
import { title, description, siteUrl } from "../../gatsby-meta-config"

/* ── Series List ─────────────────────────────────────── */

const SeriesListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space[5]};
`

/* ── Series Card ─────────────────────────────────────── */

const SeriesCardWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: ${props => props.theme.space[8]};
  padding: ${props => props.theme.space[7]} ${props => props.theme.space[8]};
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: ${props => props.theme.radius.xxl};
  background: ${props => props.theme.colors.bodyBackground};
  position: relative;
  overflow: hidden;
  transition: all ${props => props.theme.transition.base};

  &:hover {
    border-color: ${props => props.theme.colors.text};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadow.cardHover}
      ${props => props.theme.colors.headerShadow};
  }

  @media (max-width: ${props => props.theme.bp.md}) {
    grid-template-columns: 1fr;
    padding: ${props => props.theme.space[5]} ${props => props.theme.space[5]};
  }
`

const AccentBar = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(
    180deg,
    ${props => props.theme.colors.accent},
    ${props => props.theme.colors.accentBg}
  );
`

const SeriesContent = styled.div`
  display: flex;
  flex-direction: column;
`

const SeriesMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: ${props => props.theme.space[3]};
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

const SeriesCount = styled.span`
  display: inline-flex;
  padding: 2px 8px;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.colors.accentBg};
  color: ${props => props.theme.colors.accentText};
  font-weight: 600;
`

const SeriesTitle = styled.h2`
  font-size: ${props => props.theme.font.h1Sm};
  font-weight: 700;
  letter-spacing: -0.025em;
  color: ${props => props.theme.colors.text};
  line-height: 1.25;
  word-break: keep-all;
  margin-bottom: ${props => props.theme.space[3]};
`

const SeriesCta = styled(Link)`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.sm};
  color: ${props => props.theme.colors.accent};
  font-weight: 500;
  padding: 2px 0;
  border-bottom: 1px solid ${props => props.theme.colors.accent};
  text-decoration: none;
  margin-top: auto;
  align-self: flex-start;

  &:hover {
    opacity: 0.8;
  }
`

/* ── Series Preview Panel ────────────────────────────── */

const SeriesPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space[3]};
  padding: ${props => props.theme.space[5]} ${props => props.theme.space[5]};
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.radius.lg};
  border: 1px solid ${props => props.theme.colors.divider};

  @media (max-width: ${props => props.theme.bp.md}) {
    display: none;
  }
`

const SeriesPreviewLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 4px;
`

const PreviewItem = styled(Link)`
  display: flex;
  gap: 10px;
  font-size: ${props => props.theme.font.base};
  color: ${props => props.theme.colors.secondaryText};
  text-decoration: none;
  transition: color ${props => props.theme.transition.fast};

  &:hover {
    color: ${props => props.theme.colors.accent};
  }
`

const PreviewNum = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  flex-shrink: 0;
  min-width: 18px;
`

/* ── Component ───────────────────────────────────────── */

const SeriesCard = ({ series }) => {
  const { name, posts } = series
  const previewPosts = posts.slice(0, 4)

  return (
    <SeriesCardWrapper>
      <AccentBar />
      <SeriesContent>
        <SeriesMeta>
          <SeriesCount>{posts.length} posts</SeriesCount>
          <span>series</span>
        </SeriesMeta>
        <SeriesTitle>{name}</SeriesTitle>
        <SeriesCta to={`/series/${name.replace(/\s/g, "-")}`}>
          시리즈 보기 →
        </SeriesCta>
      </SeriesContent>

      <SeriesPreview>
        <SeriesPreviewLabel>/ recent posts</SeriesPreviewLabel>
        {previewPosts.map((post, i) => (
          <PreviewItem key={post.slug} to={post.slug}>
            <PreviewNum>{String(i + 1).padStart(2, "0")}</PreviewNum>
            <span>{post.title}</span>
          </PreviewItem>
        ))}
      </SeriesPreview>
    </SeriesCardWrapper>
  )
}

const SeriesPage = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes
  const seriesList = flow(
    map(post => ({ ...post.frontmatter, slug: post.fields.slug })),
    groupBy("series"),
    map(seriesPosts => ({
      name: seriesPosts[0].series,
      posts: seriesPosts,
      lastUpdated: seriesPosts[0].date,
    })),
    sortBy(s => new Date(s.lastUpdated)),
    filter(s => s.name),
    reverse
  )(posts)

  return (
    <Layout maxWidth="1180px">
      <SEO title={title} description={description} url={siteUrl} />

      <PageHeader
        eyebrow="/ series · longform"
        title="시리즈"
        counter={`${seriesList.length} series`}
        mb="40px"
      />

      <SeriesListWrapper>
        {seriesList.map(series => (
          <SeriesCard key={series.name} series={series} />
        ))}
      </SeriesListWrapper>
    </Layout>
  )
}

export default SeriesPage

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
          date(formatString: "YYYY년 MM월 DD일 HH:MM")
          updated(formatString: "YYYY년 MM월 DD일 HH:MM")
          title
          tags
          series
        }
      }
    }
  }
`
