import React from 'react';
import ReactRotatingText from 'react-rotating-text';
import styled from "styled-components"
import './style.scss';
import { siteUrl, links } from "../../../gatsby-meta-config"
import {
    FaGithub,
    FaKaggle,
    FaFacebook,
    FaTwitter,
    FaLinkedin,
    FaInstagram,
} from "react-icons/fa"

import {
    FaXTwitter,
    FaRegEnvelope,
    FaMedium,
    FaBlogger,
    FaRegFileLines,
    FaLink,
} from "react-icons/fa6"

const BioWrapper = styled.div`
  display: flex;

  @media (max-width: 768px) {
    padding: 0 15px;
  }
`
const Author = styled.div`
  color: ${props => props.theme.colors.text};
`

const LinksWrapper = styled.div`
  & a {
    margin-right: 9.6px;
  }

  & svg {
    width: 25.6px;
    height: 25.6px;
    cursor: pointer;
  }

  & svg path {
    fill: ${props => props.theme.colors.icon};
    transition: fill 0.3s;
  }

  & a:hover svg path {
    fill: ${props => props.theme.colors.text};
  }
`

const profileImageRoot =
  typeof window !== "undefined" && window.location.host === "localhost:8000"
    ? "http://localhost:8000"
    : siteUrl

const Profile = styled.div`
  flex: 0 0 auto;
  margin-right: 30px;
  width: 210px;
  height: 210px;
  border-radius: 999px;
  background-image: url(${profileImageRoot}/${props => props.theme.colors.profile}.png);
  background-size: cover;
  background-position: center;
`

const Link = ({ link, children }) => {
    if (!link) return null
    return (
      <a href={link} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }

function Info({ author, language = 'ko' }) {
  if (!author) return null;
  const { bio, name } = author;
  const {
    github,
    kaggle,
    instagram,
    facebook,
    twitter,
    x,
    blogger,
    medium,
    linkedIn,
    email,
    resume,
    link,
  } = links

  return (
    <BioWrapper className="bio">
        <div className="introduction korean">
        
            <Author className="title">
                안녕하세요.
                <br />
                <ReactRotatingText items={bio.description} />
                <br />
                {bio.role} <strong>{name}</strong>입니다.
                <br />
            </Author>

          <LinksWrapper>
            <Link link={github}>
                <FaGithub />
            </Link>
            <Link link={kaggle}>
                <FaKaggle />
            </Link>
            <Link link={instagram}>
                <FaInstagram />
            </Link>
            <Link link={facebook}>
                <FaFacebook />
            </Link>
            <Link link={twitter}>
                <FaTwitter />
            </Link>
            <Link link={x}>
                <FaXTwitter />
            </Link>
            <Link link={medium}>
                <FaMedium />
            </Link>
            <Link link={blogger}>
                <FaBlogger />
            </Link>
            <Link link={linkedIn}>
                <FaLinkedin />
            </Link>
            <Link link={email}>
                <FaRegEnvelope />
            </Link>
            <Link link={resume}>
                <FaRegFileLines />
            </Link>
            <Link link={link}>
                <FaLink />
            </Link>
        </LinksWrapper>
        </div>
      <Profile className="thumbnail-wrapper"/>
    </BioWrapper>
  );
}

export default Info;