import React, { useEffect, useState } from "react"
import { navigate } from "gatsby"
import { useSelector } from "react-redux"
import styled, { useTheme, css } from "styled-components"
import MDSpinner from "react-md-spinner"
import Divider from "components/Divider"
import Giscus from "@giscus/react"

/* ── End Mark ────────────────────────────────────────── */

const PostFootEnd = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.space[4]};
  padding: ${props => props.theme.space[6]} 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  letter-spacing: 0.14em;
  text-transform: uppercase;
`

const EndMark = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space[3]};

  &::before,
  &::after {
    content: "";
    width: 30px;
    height: 1px;
    background: ${props => props.theme.colors.mutedText};
  }
`

/* ── Post Nav ────────────────────────────────────────── */

const PostNav = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.space[4]};
  margin-top: ${props => props.theme.space[2]};

  @media (max-width: ${props => props.theme.bp.sm}) {
    grid-template-columns: 1fr;
  }
`

const PostNavCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.space[5]} ${props => props.theme.space[6]};
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: ${props => props.theme.radius.xl};
  transition: all ${props => props.theme.transition.base};
  background: ${props => props.theme.colors.bodyBackground};
  min-height: 96px;
  position: relative;
  overflow: hidden;
  text-align: ${props => (props.$isNext ? "right" : "left")};
  align-items: ${props => (props.$isNext ? "flex-end" : "flex-start")};
  cursor: ${props => (props.$empty ? "default" : "pointer")};
  pointer-events: ${props => (props.$empty ? "none" : "auto")};
  opacity: ${props => (props.$empty ? 0.35 : 1)};
  border-style: ${props => (props.$empty ? "dashed" : "solid")};

  &:hover {
    border-color: ${props => props.theme.colors.text};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadow.navHover}
      ${props => props.theme.colors.headerShadow};
  }
`

const PostNavLabel = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: ${props => props.theme.font.xs};
  color: ${props => props.theme.colors.tertiaryText};
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: ${props => props.theme.space[2]};
`

const PostNavTitle = styled.div`
  font-size: ${props => props.theme.font.lg};
  font-weight: 600;
  color: ${props => props.theme.colors.secondaryText};
  line-height: 1.45;
  word-break: keep-all;
  letter-spacing: -0.01em;
`

/* ── Comment ─────────────────────────────────────────── */

const CommentWrapper = styled.div`
  @media (max-width: ${props => props.theme.bp.md}) {
    padding: 0 15px;
  }
`

const SpinnerWrapper = styled.div`
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const HiddenWrapper = styled.div`
  height: ${props => (props.isHidden ? "0px" : "auto")};
  overflow: ${props => (props.isHidden ? "hidden" : "auto")};
`

const Spinner = () => {
  const theme = useTheme()
  return (
    <SpinnerWrapper>
      <MDSpinner singleColor={theme.colors.spinner} />
    </SpinnerWrapper>
  )
}

const Comment = ({ title }) => {
  const { theme } = useSelector(state => state.theme)
  const [spinner, setSpinner] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setSpinner(false)
    }, 1500)
  }, [])

  return (
    <>
      {spinner && <Spinner />}

      <HiddenWrapper isHidden={spinner}>
        <HiddenWrapper isHidden={theme === "light"}>
          <Giscus
            id="comments"
            repo="theminjunchoi/theminjunchoi.github.io"
            repoId="R_kgDOLCr2fA"
            category="Comments"
            categoryId="DIC_kwDOLCr2fM4Ci46V"
            mapping="pathname"
            term={title}
            reactionsEnabled="1"
            emitMetadata="0"
            lang="ko"
            theme="dark"
          />
        </HiddenWrapper>
        <HiddenWrapper isHidden={theme === "dark"}>
          <Giscus
            id="comments"
            repo="theminjunchoi/theminjunchoi.github.io"
            repoId="R_kgDOLCr2fA"
            category="Comments"
            categoryId="DIC_kwDOLCr2fM4Ci46V"
            mapping="pathname"
            term={title}
            reactionsEnabled="1"
            emitMetadata="0"
            lang="ko"
            theme="light"
          />
        </HiddenWrapper>
      </HiddenWrapper>
    </>
  )
}

/* ── Footer ──────────────────────────────────────────── */

const Footer = ({ previous, next, title }) => {
  return (
    <>
      <PostFootEnd>
        <EndMark>end of post</EndMark>
      </PostFootEnd>

      <PostNav>
        <PostNavCard
          $empty={!previous}
          onClick={previous ? () => navigate(previous?.fields?.slug) : undefined}
        >
          <PostNavLabel>← Previous</PostNavLabel>
          <PostNavTitle>
            {previous ? previous?.frontmatter?.title : "첫 번째 글입니다"}
          </PostNavTitle>
        </PostNavCard>

        <PostNavCard
          $isNext
          $empty={!next}
          onClick={next ? () => navigate(next?.fields?.slug) : undefined}
        >
          <PostNavLabel>Next →</PostNavLabel>
          <PostNavTitle>
            {next ? next?.frontmatter?.title : "마지막 글입니다"}
          </PostNavTitle>
        </PostNavCard>
      </PostNav>

      <CommentWrapper>
        <Divider mt="32px" />
        <Comment title={title} />
      </CommentWrapper>
    </>
  )
}

export default Footer
