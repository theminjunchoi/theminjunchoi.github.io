import React from "react"
import styled from "styled-components"
import _ from "lodash"
import { Link } from "gatsby"

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 60px;

  @media (max-width: 768px) {
    padding: 0 4px;
  }
`

const Card = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 26px;
  border: 1px solid ${props => props.theme.colors.divider};
  border-radius: 14px;
  background-color: ${props => props.theme.colors.bodyBackground};
  cursor: pointer;
  transition: all 0.22s ease;

  &:hover {
    border-color: ${props => props.theme.colors.activatedBorder};
    box-shadow: 0 4px 20px ${props => props.theme.colors.headerShadow};
    transform: translateY(-2px);
  }
`

const Left = styled.div`
  flex: 1;
  min-width: 0;
`

const SeriesName = styled.h2`
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  color: ${props => props.theme.colors.text};
  word-break: break-word;
  transition: color 0.2s;

  ${Card}:hover & {
    color: ${props => props.theme.colors.secondaryText};
  }
`

const Meta = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.tertiaryText};
`

const Badge = styled.span`
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 600;
  background-color: ${props => props.theme.colors.accentBg};
  color: ${props => props.theme.colors.accentText};
  white-space: nowrap;
`

const SeriesList = ({ seriesList }) => {
  return (
    <Wrapper>
      {seriesList.map((series, i) => {
        const slug = `/series/${_.replace(series.name, /\s/g, "-")}`
        return (
          <Link key={i} to={slug} style={{ textDecoration: "none" }}>
            <Card>
              <Left>
                <SeriesName>{series.name}</SeriesName>
                <Meta>Last updated {series.lastUpdated}</Meta>
              </Left>
              <Badge>{series.posts.length} Posts</Badge>
            </Card>
          </Link>
        )
      })}
    </Wrapper>
  )
}

export default SeriesList
