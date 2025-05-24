/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useState } from 'react';
import solviblyLogo from '../../graphics/logo/logopng.png';
import solviblyTitleHead from '../../graphics/title-head/titleheadsvg.svg';

// Styled components
const HeaderContainer = styled.header`
  position: relative;
  height: 12vh;
  padding: 0 2vw;
  background-color: rgba(231, 224, 224, 0.986);
  display: flex;
  place-items: center;
`;

const LogoContainer = styled.div`
  margin-right: auto;
  margin-left: 1%;
`;

const LogoImage = styled.img`
  display: block;
  max-width: 10.5%;
`;

const TitleContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`;

const TitleImage = styled.img`
  display: block;
  max-width: 35vw;
  margin-top: 2%;
`;

const LinksContainer = styled.div`
  display: flex;
  gap: 1vw;
  white-space: nowrap;
  padding: 0;
  margin-left: auto;
  margin-right: 1%;
`;

const AnchorLink = styled.a`
  text-decoration: none;
  font-size: 0.95em;
  font-weight: 300;
  color: black;
`;

function Header() {
  return (
    <HeaderContainer>
      <LogoContainer>
        <LogoImage src={solviblyLogo} alt="Logo Solvibly AI" />
      </LogoContainer>
      <TitleContainer>
        <TitleImage src={solviblyTitleHead} alt="Title Solvibly AI" />
      </TitleContainer>
      <LinksContainer>
        <AnchorLink>Home</AnchorLink>
        <AnchorLink>2nd page</AnchorLink>
        <AnchorLink>3rd page</AnchorLink>
      </LinksContainer>
    </HeaderContainer>
  );
}

export default Header;
