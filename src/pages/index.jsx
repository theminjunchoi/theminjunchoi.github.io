import React from "react"
import _ from "lodash"
import styled from "styled-components"
import { graphql, Link, navigate } from "gatsby"

import Layout from "components/Layout"
import SEO from "components/SEO"
import Info from "components/Info"
import PopularPosts from "components/PopularPosts"
import ArchiveList from "components/ArchiveList"

import { title, description, siteUrl } from "../../gatsby-meta-config"
import { cardHover, cardTitleHover, chipHover } from "assets/theme/mixins"

/* ── Section head ───────────────────────────────────────
   .section-head: flex, space-between, baseline
   .section-title: flex, baseline, gap 12px — label + heading INLINE
   ──────────────────────────────────────────────────── */

const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${props => props.theme.space[6]};
  margin-bottom: ${props => props.theme.space[6]};
`

const SectionTitle = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-family: "Inter Tight", "Noto Sans KR", sans-serif;
`

/* JetBrains Mono, muted gray */
const SectionLabel = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  font-weight: 500;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

/* bold heading */
const SectionHeading = styled.span`
  font-size: ${props => props.theme.font.h2};
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  letter-spacing: -0.018em;
`

/* JetBrains Mono link, bottom border on hover */
const SectionActionLink = styled(Link)`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.sm};
  color: ${props => props.theme.colors.secondaryText};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid transparent;
  transition: all ${props => props.theme.transition.fast};

  &:hover {
    color: ${props => props.theme.colors.accent};
    border-color: ${props => props.theme.colors.accent};
  }
`

const SectionActionStatic = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.sm};
  color: ${props => props.theme.colors.secondaryText};
`

/* ── Section wrapper ─── */
const Section = styled.section`
  padding: ${props => props.theme.space[14]} 0 0;

  @media (max-width: ${props => props.theme.bp.md}) {
    padding: ${props => props.theme.space[12]} 0 0;
  }
`

/* ── Featured grid ──────────────────────────────────────
   .featured: grid 1.55fr 1fr, gap 18px
   ──────────────────────────────────────────────────── */
const FeatGrid = styled.div`
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 18px;

  @media (max-width: ${props => props.theme.bp.md}) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`

/* Base card */
const FeatCard = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.space[6]} ${props => props.theme.space[7]};
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: ${props => props.theme.radius.xxl};
  background: ${props => props.theme.colors.bodyBackground};
  cursor: pointer;
  overflow: hidden;
  ${cardHover}

  @media (max-width: ${props => props.theme.bp.md}) {
    padding: ${props => props.theme.space[5]} ${props => props.theme.space[5]};
    border-radius: ${props => props.theme.radius.xl};
  }
`

/* Main card spans 2 rows, has radial gradient background */
const FeatMainCard = styled(FeatCard)`
  grid-row: span 2;
  background: radial-gradient(
      circle at 100% 0%,
      ${props => props.theme.colors.accent}14,
      transparent 50%
    ),
    ${props => props.theme.colors.bodyBackground};

  @media (max-width: ${props => props.theme.bp.md}) {
    grid-row: auto;
  }
`

const FeatMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
`

/* Badge pill: dark bg white text for side, accent bg for main */
const FeatNum = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 20px;
  padding: 0 6px;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props =>
    props.$isMain ? props.theme.colors.accent : props.theme.colors.text};
  color: ${props => props.theme.colors.bodyBackground};
  font-weight: 600;
  letter-spacing: 0.04em;
  font-size: ${props => props.theme.font.xs};
`

const FeatDate = styled.span`
  letter-spacing: 0.04em;
`

const FeatTitle = styled.h3`
  font-family: "Inter Tight", "Noto Sans KR", sans-serif;
  font-size: ${props =>
    props.$isMain ? props.theme.font.h1Sm : props.theme.font.h4};
  font-weight: 700;
  line-height: ${props => (props.$isMain ? "1.28" : "1.4")};
  letter-spacing: -0.018em;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.space[3]};
  word-break: keep-all;
  ${cardTitleHover(FeatCard)}

  @media (max-width: ${props => props.theme.bp.md}) {
    font-size: ${props =>
      props.$isMain ? props.theme.font.h2 : props.theme.font.body};
  }
`

const FeatExcerpt = styled.p`
  font-size: ${props => props.theme.font.md};
  line-height: 1.7;
  color: ${props => props.theme.colors.secondaryText};
  margin-bottom: ${props => props.theme.space[4]};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: keep-all;
`

const FeatTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: auto;
`

const Chip = styled.span`
  display: inline-block;
  padding: 3px 9px;
  border-radius: ${props => props.theme.radius.sm};
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  font-weight: 500;
  color: ${props => props.theme.colors.accentText};
  background: ${props => props.theme.colors.accentBg};
  letter-spacing: 0.02em;
`

/* ── Archive section ────────────────────────────────────
   .archive: padding 56px 0 64px
   .archive-layout: grid 1fr 220px, gap 56px
   ──────────────────────────────────────────────────── */

const ArchiveSection = styled.section`
  padding: ${props => props.theme.space[14]} 0 ${props => props.theme.space[16]};

  @media (max-width: ${props => props.theme.bp.md}) {
    padding: ${props => props.theme.space[12]} 0 ${props => props.theme.space[12]};
  }
`

const ArchiveLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: ${props => props.theme.space[14]};
  align-items: start;

  @media (max-width: ${props => props.theme.bp.lg}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.space[10]};
  }
`

/* ── Tag aside ──────────────────────────────────────────
   .aside: sticky top 84px
   .ftags: flex-wrap gap 5px (horizontal chips, NOT vertical list)
   .ftag: bg-3, no border, padding 4px 9px, border-radius 6px
   ──────────────────────────────────────────────────── */

const Aside = styled.aside`
  position: sticky;
  top: 84px;
`

const AsideLabel = styled.p`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
`

/* flex-wrap horizontal tag pills */
const FTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`

const FTag = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.colors.background};
  text-decoration: none;
  font-size: ${props => props.theme.font.sm};
  ${chipHover}
`

const FTagName = styled.span`
  color: ${props => props.theme.colors.secondaryText};
  font-weight: 500;
  transition: color ${props => props.theme.transition.fast};

  ${FTag}:hover & {
    color: ${props => props.theme.colors.accentText};
  }
`

const FTagCount = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
`

/* ── Page ────────────────────────────────────────────── */

const BlogIndex = ({ data }) => {
  const posts = data.allMarkdownRemark.nodes
  const tags = _.sortBy(data.allMarkdownRemark.group, ["totalCount"]).reverse()
  const { author, language } = data.site.siteMetadata

  if (posts.length === 0) {
    return (
      <p>
        No blog posts found. Add markdown posts to &quot;content/blog&quot; (or
        the directory you specified for the &quot;gatsby-source-filesystem&quot;
        plugin in gatsby-config.js).
      </p>
    )
  }

  const latestPosts = posts.slice(0, 3)

  return (
    <Layout maxWidth="1180px">
      <SEO title={title} description={description} url={siteUrl} />
      <Info author={author} language={language} />

      {/* Latest posts */}
      <Section>
        <SectionHead>
          <SectionTitle>
            <SectionLabel>/ latest</SectionLabel>
            <SectionHeading>최근 글</SectionHeading>
          </SectionTitle>
          <SectionActionLink to="/posts">View all &nbsp;→</SectionActionLink>
        </SectionHead>

        <FeatGrid>
          {latestPosts.map((post, i) => {
            const {
              title: postTitle,
              date,
              tags: postTags,
              description: postDesc,
            } = post.frontmatter
            const { excerpt } = post
            const { slug } = post.fields
            const num = String(i + 1).padStart(2, "0")
            const isMain = i === 0

            if (isMain) {
              return (
                <FeatMainCard key={slug} data-clickable onClick={() => navigate(slug)}>
                  <FeatMeta>
                    <FeatNum $isMain>{num}</FeatNum>
                    <FeatDate>{date}</FeatDate>
                  </FeatMeta>
                  <FeatTitle $isMain>{postTitle}</FeatTitle>
                  {(postDesc || excerpt) && (
                    <FeatExcerpt>{postDesc || excerpt}</FeatExcerpt>
                  )}
                  {postTags && postTags.length > 0 && (
                    <FeatTags>
                      {postTags.map(tag => (
                        <Chip key={tag}>{tag}</Chip>
                      ))}
                    </FeatTags>
                  )}
                </FeatMainCard>
              )
            }

            return (
              <FeatCard key={slug} data-clickable onClick={() => navigate(slug)}>
                <FeatMeta>
                  <FeatNum>{num}</FeatNum>
                  <FeatDate>{date}</FeatDate>
                </FeatMeta>
                <FeatTitle>{postTitle}</FeatTitle>
                {postTags && postTags.length > 0 && (
                  <FeatTags>
                    {postTags.map(tag => (
                      <Chip key={tag}>{tag}</Chip>
                    ))}
                  </FeatTags>
                )}
              </FeatCard>
            )
          })}
        </FeatGrid>
      </Section>

      {/* Popular posts */}
      <Section>
        <SectionHead>
          <SectionTitle>
            <SectionLabel>/ popular</SectionLabel>
            <SectionHeading>인기 있는 글</SectionHeading>
          </SectionTitle>
          <SectionActionStatic>curated</SectionActionStatic>
        </SectionHead>
        <PopularPosts allPosts={posts} />
      </Section>

      {/* Archive */}
      <ArchiveSection>
        <SectionHead>
          <SectionTitle>
            <SectionLabel>/ archive</SectionLabel>
            <SectionHeading>전체 기록</SectionHeading>
          </SectionTitle>
          <SectionActionStatic>{posts.length} writings</SectionActionStatic>
        </SectionHead>

        <ArchiveLayout>
          <ArchiveList posts={posts} />

          <Aside>
            <AsideLabel>/ tags</AsideLabel>
            <FTagList>
              {tags.map(tag => (
                <FTag key={tag.fieldValue} to={`/posts?q=${tag.fieldValue}`}>
                  <FTagName>{tag.fieldValue}</FTagName>
                  <FTagCount>{tag.totalCount}</FTagCount>
                </FTag>
              ))}
            </FTagList>
          </Aside>
        </ArchiveLayout>
      </ArchiveSection>
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
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { publish: { eq: true } } }
    ) {
      group(field: { frontmatter: { tags: SELECT } }) {
        fieldValue
        totalCount
      }
      nodes {
        excerpt(pruneLength: 200, truncate: true)
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
