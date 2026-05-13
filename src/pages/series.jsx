import React from "react"
import { flow, map, groupBy, sortBy, filter, reverse } from "lodash/fp"
import styled from "styled-components"
import SEO from "components/SEO"
import { graphql, Link } from "gatsby"
import Layout from "components/Layout"
import { title, description, siteUrl } from "../../gatsby-meta-config"

/* ── Page Header ─────────────────────────────────────── */

const PageHd = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 64px 0 32px;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
  margin-bottom: 40px;
`

const PageEyebrow = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  font-weight: 500;
  color: ${props => props.theme.colors.accentText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

const PageTitle = styled.h1`
  font-family: 'Noto Sans KR', sans-serif;
  font-size: clamp(32px, 4.2vw, 44px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: ${props => props.theme.colors.text};
  margin-top: 2px;
`

const PageCounter = styled.p`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: ${props => props.theme.colors.tertiaryText};
  margin-top: 12px;
`

/* ── Series List ─────────────────────────────────────── */

const SeriesListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

/* ── Series Card ─────────────────────────────────────── */

const SeriesCardWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
  padding: 28px 32px;
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: 16px;
  background: ${props => props.theme.colors.bodyBackground};
  position: relative;
  overflow: hidden;
  transition: all 0.22s;

  &:hover {
    border-color: ${props => props.theme.colors.text};
    transform: translateY(-2px);
    box-shadow: 0 4px 20px -8px ${props => props.theme.colors.headerShadow};
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 22px 20px;
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
  margin-bottom: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

const SeriesCount = styled.span`
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 5px;
  background: ${props => props.theme.colors.accentBg};
  color: ${props => props.theme.colors.accentText};
  font-weight: 600;
`

const SeriesTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: ${props => props.theme.colors.text};
  line-height: 1.25;
  word-break: keep-all;
  margin-bottom: 12px;
`

const SeriesCta = styled(Link)`
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
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
  gap: 12px;
  padding: 18px 20px;
  background: ${props => props.theme.colors.background};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.divider};

  @media (max-width: 768px) {
    display: none;
  }
`

const SeriesPreviewLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 10.5px;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 4px;
`

const PreviewItem = styled(Link)`
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: ${props => props.theme.colors.secondaryText};
  text-decoration: none;
  transition: color 0.18s;

  &:hover {
    color: ${props => props.theme.colors.accent};
  }
`

const PreviewNum = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
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

      <PageHd>
        <PageEyebrow>/ series · longform</PageEyebrow>
        <PageTitle>시리즈</PageTitle>
        <PageCounter>{seriesList.length} series</PageCounter>
      </PageHd>

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
