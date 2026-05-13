import React from "react"
import styled, { keyframes, useTheme } from "styled-components"
import ReactRotatingText from "react-rotating-text"
import { siteUrl, links } from "../../../gatsby-meta-config"
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa"
import { FaXTwitter, FaRegEnvelope } from "react-icons/fa6"

const fadeSlideUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0);    }
`

const blink = keyframes`
  0%   { opacity: 0; }
  50%  { opacity: 1; }
  100% { opacity: 0; }
`

const profileImageRoot =
  typeof window !== "undefined" && window.location.host === "localhost:8000"
    ? "http://localhost:8000"
    : siteUrl

/* ── Layout ─────────────────────────────────────────── */

const HeroWrapper = styled.section`
  position: relative;
  width: 100%;
  padding: 64px 0 56px;
  overflow: hidden;

  @media (min-width: 768px) {
    padding: 80px 0 80px;
  }
`

const DotGrid = styled.div`
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    ${props => props.theme.colors.border} 1.4px,
    transparent 1.4px
  );
  background-size: 26px 26px;
  pointer-events: none;
  mask-image: radial-gradient(
    ellipse 120% 100% at 50% 0%,
    black 18%,
    transparent 70%
  );
  -webkit-mask-image: radial-gradient(
    ellipse 120% 100% at 50% 0%,
    black 18%,
    transparent 70%
  );
`

const ContentRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
`

/* ── Profile ─────────────────────────────────────────── */

const ProfileGlowContainer = styled.div`
  position: relative;
  flex-shrink: 0;
  display: none;
  animation: ${fadeSlideUp} 0.55s ease both;

  @media (min-width: 768px) {
    display: block;
  }

  &::after {
    content: "";
    position: absolute;
    inset: -24px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      ${props => props.theme.colors.accent}20 0%,
      transparent 68%
    );
    pointer-events: none;
    z-index: 0;
  }
`

const ProfileRing = styled.div`
  position: relative;
  z-index: 1;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(
    140deg,
    ${props => props.theme.colors.accent},
    ${props => props.theme.colors.accent}35
  );
`

const ProfileImage = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid ${props => props.theme.colors.bodyBackground};
  background-image: url(${profileImageRoot}/${props => props.$profile}.png);
  background-size: cover;
  background-position: center;
`

/* ── Text ─────────────────────────────────────────────── */

const TextContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: ${fadeSlideUp} 0.55s 0.1s ease both;
`

const IntroText = styled.h1`
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 200;
  font-size: 21px;
  line-height: 1.32;
  color: ${props => props.theme.colors.text};
  word-break: keep-all;
  letter-spacing: -0.012em;
  display: flex;
  flex-direction: column;
  gap: 0;

  strong { font-weight: 700; }

  .react-rotating-text-cursor {
    animation: ${blink} 0.8s cubic-bezier(0.68, 0.01, 0.01, 0.99) 0s infinite;
  }

  @media (min-width: 768px) {
    font-size: 28px;
    line-height: 1.32;
  }
`

const HeroLine = styled.span`
  display: block;
  min-height: 1.32em;
`

/* ── Social links ─────────────────────────────────────── */

const SocialRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  animation: ${fadeSlideUp} 0.55s 0.2s ease both;
`

const SocialBtn = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid ${props => props.theme.colors.divider};
  background: ${props => props.theme.colors.bodyBackground};
  text-decoration: none;
  transition: all 0.18s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent}65;
    background: ${props => props.theme.colors.accentBg};
    transform: translateY(-2px);
    box-shadow: 0 4px 14px ${props => props.theme.colors.accent}1a;
  }

  svg {
    width: 17px;
    height: 17px;
  }

  svg path {
    fill: ${props => props.theme.colors.tertiaryText};
    transition: fill 0.18s;
  }

  &:hover svg path {
    fill: ${props => props.theme.colors.accent};
  }
`


/* ── Component ───────────────────────────────────────── */

const SocialLink = ({ link, children }) => {
  if (!link) return null
  return (
    <SocialBtn href={link} target="_blank" rel="noreferrer">
      {children}
    </SocialBtn>
  )
}

function Info({ author }) {
  if (!author) return null
  const theme = useTheme()
  const { bio, name } = author
  const { github, linkedIn, instagram, x, email } = links

  return (
    <HeroWrapper>
      <DotGrid />
      <ContentRow>
        <TextContent>
          <IntroText>
            <HeroLine>안녕하세요.</HeroLine>
            <HeroLine><ReactRotatingText items={bio.description} /></HeroLine>
            <HeroLine>{bio.role} <strong>{name}</strong>입니다.</HeroLine>
          </IntroText>

          <SocialRow>
            <SocialLink link={github}><FaGithub /></SocialLink>
            <SocialLink link={linkedIn}><FaLinkedin /></SocialLink>
            <SocialLink link={x}><FaXTwitter /></SocialLink>
            <SocialLink link={instagram}><FaInstagram /></SocialLink>
            <SocialLink link={email}><FaRegEnvelope /></SocialLink>
          </SocialRow>
        </TextContent>

        <ProfileGlowContainer>
          <ProfileRing>
            <ProfileImage $profile={theme.colors.profile} />
          </ProfileRing>
        </ProfileGlowContainer>
      </ContentRow>
    </HeroWrapper>
  )
}

export default Info
