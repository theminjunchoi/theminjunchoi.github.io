import React from "react"
import _ from "lodash"
import styled from "styled-components"
import { graphql, Link, navigate } from "gatsby"

import Layout from "components/Layout"
import SEO from "components/SEO"
import Info from "components/Info"
import PopularPosts from "components/PopularPosts"

import { title, description, siteUrl } from "../../gatsby-meta-config"

/* ── Section head ───────────────────────────────────────
   .section-head: flex, space-between, baseline
   .section-title: flex, baseline, gap 12px — label + heading INLINE
   ──────────────────────────────────────────────────── */

const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
`

const SectionTitle = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-family: "Inter Tight", "Noto Sans KR", sans-serif;
`

/* JetBrains Mono, 11px, muted gray */
const SectionLabel = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 500;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

/* 20px, bold, dark */
const SectionHeading = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  letter-spacing: -0.018em;
`

/* JetBrains Mono link, bottom border on hover */
const SectionActionLink = styled(Link)`
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: ${props => props.theme.colors.secondaryText};
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid transparent;
  transition: all 0.18s;

  &:hover {
    color: ${props => props.theme.colors.accent};
    border-color: ${props => props.theme.colors.accent};
  }
`

const SectionActionStatic = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: ${props => props.theme.colors.secondaryText};
`

/* ── Section wrapper (.section: padding 56px 0 0) ─── */
const Section = styled.section`
  padding: 56px 0 0;

  @media (max-width: 760px) {
    padding: 48px 0 0;
  }
`

/* ── Featured grid ──────────────────────────────────────
   .featured: grid 1.55fr 1fr, gap 18px
   ──────────────────────────────────────────────────── */
const FeatGrid = styled.div`
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 18px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`

/* Base card */
const FeatCard = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 26px 28px;
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: 16px;
  background: ${props => props.theme.colors.bodyBackground};
  cursor: pointer;
  overflow: hidden;
  transition: all 0.28s cubic-bezier(0.2, 0.7, 0.2, 1);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      ${props => props.theme.colors.accent}0d,
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  &:hover {
    border-color: ${props => props.theme.colors.text};
    transform: translateY(-3px);
    box-shadow: 0 4px 20px -8px ${props => props.theme.colors.headerShadow};
  }

  &:hover::before {
    opacity: 1;
  }

  @media (max-width: 760px) {
    padding: 22px 22px;
    border-radius: 14px;
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

  @media (max-width: 760px) {
    grid-row: auto;
  }
`

const FeatMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
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
  border-radius: 5px;
  background: ${props =>
    props.$isMain ? props.theme.colors.accent : props.theme.colors.text};
  color: ${props => props.theme.colors.bodyBackground};
  font-weight: 600;
  letter-spacing: 0.04em;
  font-size: 10.5px;
`

const FeatDate = styled.span`
  letter-spacing: 0.04em;
`

const FeatTitle = styled.h3`
  font-family: "Inter Tight", "Noto Sans KR", sans-serif;
  font-size: ${props => (props.$isMain ? "26px" : "17px")};
  font-weight: 700;
  line-height: ${props => (props.$isMain ? "1.28" : "1.4")};
  letter-spacing: -0.018em;
  color: ${props => props.theme.colors.text};
  margin-bottom: 12px;
  word-break: keep-all;
  transition: color 0.18s;

  ${FeatCard}:hover & {
    color: ${props => props.theme.colors.accent};
  }

  @media (max-width: 760px) {
    font-size: ${props => (props.$isMain ? "22px" : "16px")};
  }
`

const FeatExcerpt = styled.p`
  font-size: 14px;
  line-height: 1.7;
  color: ${props => props.theme.colors.secondaryText};
  margin-bottom: 16px;
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
  border-radius: 5px;
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px;
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
  padding: 56px 0 64px;

  @media (max-width: 760px) {
    padding: 48px 0 48px;
  }
`

const ArchiveLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 56px;
  align-items: start;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`

/* .year-block */
const YearBlock = styled.section`
  margin-bottom: 44px;

  &:last-child {
    margin-bottom: 0;
  }
`

/* .year-head: grid auto auto 1fr */
const YearHead = styled.header`
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`

const YearNum = styled.span`
  font-family: "Inter Tight", sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${props => props.theme.colors.text};
`

const YearCount = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: 10.5px;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
`

const YearLine = styled.span`
  height: 1px;
  background: ${props => props.theme.colors.divider};
`

/* .row: grid 56px 1fr auto 20px, gap 18px */
const Row = styled(Link)`
  display: grid;
  grid-template-columns: 56px 1fr auto 20px;
  align-items: center;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid ${props => props.theme.colors.divider};
  text-decoration: none;
  transition: all 0.22s;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 720px) {
    grid-template-columns: 50px 1fr 16px;
    gap: 12px;
  }
`

const RowDate = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: 11.5px;
  color: ${props => props.theme.colors.tertiaryText};
  letter-spacing: 0.04em;
`

const RowTitle = styled.span`
  font-size: 14.5px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  line-height: 1.45;
  letter-spacing: -0.005em;
  word-break: keep-all;
  transition: color 0.18s;

  ${Row}:hover & {
    color: ${props => props.theme.colors.accent};
  }
`

const RowTags = styled.span`
  display: flex;
  gap: 5px;
  flex-wrap: nowrap;

  @media (max-width: 720px) {
    display: none;
  }
`

const RowTag = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 500;
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: lowercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 4px;
  background: ${props => props.theme.colors.background};
`

const RowArrow = styled.span`
  font-size: 14px;
  color: ${props => props.theme.colors.mutedText};
  transition: all 0.18s;

  ${Row}:hover & {
    color: ${props => props.theme.colors.accent};
    transform: translateX(4px);
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
  font-size: 10.5px;
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
  border-radius: 6px;
  background: ${props => props.theme.colors.background};
  text-decoration: none;
  font-size: 12px;
  transition: all 0.18s;

  &:hover {
    background: ${props => props.theme.colors.accentBg};
    transform: translateY(-1px);
  }
`

const FTagName = styled.span`
  color: ${props => props.theme.colors.secondaryText};
  font-weight: 500;
  transition: color 0.18s;

  ${FTag}:hover & {
    color: ${props => props.theme.colors.accentText};
  }
`

const FTagCount = styled.span`
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: ${props => props.theme.colors.tertiaryText};
`

/* ── Helpers ─────────────────────────────────────────── */

const toShortDate = dateStr => {
  const d = new Date(dateStr)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${m}.${day}`
}

const toYear = dateStr => new Date(dateStr).getFullYear()

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
  const postsByYear = _.groupBy(posts, post => toYear(post.frontmatter.date))
  const years = Object.keys(postsByYear).sort((a, b) => b - a)

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
                <FeatMainCard key={slug} onClick={() => navigate(slug)}>
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
              <FeatCard key={slug} onClick={() => navigate(slug)}>
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
          <div>
            {years.map(year => {
              const yearPosts = postsByYear[year]
              return (
                <YearBlock key={year}>
                  <YearHead>
                    <YearNum>{year}</YearNum>
                    <YearCount>{yearPosts.length} posts</YearCount>
                    <YearLine />
                  </YearHead>
                  <div>
                    {yearPosts.map(post => {
                      const { title: postTitle, date, tags: postTags } =
                        post.frontmatter
                      const { slug } = post.fields
                      return (
                        <Row key={slug} to={slug}>
                          <RowDate>{toShortDate(date)}</RowDate>
                          <RowTitle>{postTitle}</RowTitle>
                          <RowTags>
                            {(postTags || []).slice(0, 3).map(tag => (
                              <RowTag key={tag}>{tag}</RowTag>
                            ))}
                          </RowTags>
                          <RowArrow aria-hidden="true">→</RowArrow>
                        </Row>
                      )
                    })}
                  </div>
                </YearBlock>
              )
            })}
          </div>

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
