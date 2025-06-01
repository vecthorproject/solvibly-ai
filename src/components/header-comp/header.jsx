/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useState } from 'react';
import solviblyLogo from '../../graphics/logo/logosvg.svg';
import dotsMenu from '../../graphics/various/threedotsmenu.svg';

// Styled components
const HeaderContainer = styled.header`
  position: relative;
  height: 12vh;
  padding: 0 2vw;
  background-color: white;
  display: flex;
  place-items: center;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 2em;
    right: 2em;
    height: 2px; /* più spessa */
    background-image: repeating-linear-gradient(
      to right,
      black 0,
      black 3px,       /* larghezza puntino */
      transparent 3px,
      transparent 8px  /* distanza tra puntini */
    );
  }
`;

const LogoContainer = styled.div`
  margin-right: auto;
`;

const LogoImage = styled.img`
  display: block;
  max-width: 6%;
`;

const TitleContainer = styled.div`
  position: absolute;
  left: 14.5%;
  transform: translateX(-50%);
`;

const TitleImage = styled.h1`
  font-family:'Sansation', sans-serif;
  font-size: 2em;
  cursor:default;
  user-select:none;
`;

const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items:center;
  gap: 1vw;
  white-space: nowrap;
  padding: 0;
  margin-left: auto;
  margin-right: 1%;
`;

const AnchorLink = styled.a`
  cursor: pointer;
  text-decoration: none;
  font-family:"Cascadia Mono",system-ui,sans-serif;
  font-size: 0.90em;
  font-weight: 300;
  color: black;
  transition: fill 0.2s ease;

  &:hover {
    color: #15a497;
  }
`;

const OtherPagesSymbol = styled.svg`
  width: 1.5em;
  height: 1.5em;
  fill: black;
  cursor: pointer;
  transition: fill 0.2s ease;

  &:hover {
    fill: #15a497;
  }
`;

function Header() {
  return (
    <HeaderContainer>
      <LogoContainer>
        <LogoImage src={solviblyLogo} alt="Logo Solvibly AI" />
      </LogoContainer>
      <TitleContainer>
        <TitleImage>SOLVIBLY <strong>AI</strong></TitleImage>
      </TitleContainer>
      <LinksContainer>
        <AnchorLink>Help</AnchorLink>
        <AnchorLink>Premium</AnchorLink>
        <OtherPagesSymbol viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </OtherPagesSymbol>
      </LinksContainer>
    </HeaderContainer>
  );
}

export default Header;
