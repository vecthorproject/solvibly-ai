/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { useState } from 'react';
import solviblyLogo from '../../graphics/Header/Logo/logosvg.svg';

// Header wrapper with bottom dotted border
const HeaderContainer = styled.header`
  position: relative;
  height: 12vh;
  padding: 0 2vw;
  background-color: white;
  display: flex;
  align-items: center;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 2em;
    right: 2em;
    height: 2px;
    background-image: repeating-linear-gradient(
      to right,
      black 0,
      black 3px,
      transparent 3px,
      transparent 8px
    );
  }

  /* Adjust dot spacing below 1300px for better consistency */
  @media (max-width: 1300px) {
    &::after {
      left: 18px;
      right: 18px;
      background-image: repeating-linear-gradient(
        to right,
        black 0,
        black 2px,       /* smaller dot */
        transparent 2px,
        transparent 6px  /* smaller spacing */
      );
    }
  }
`;

// Logo wrapper aligned to the left
const LogoContainer = styled.div`
  margin-right: auto;
`;

// Logo image with max size using rem for consistency
const LogoImage = styled.img`
  display: block;
  width: clamp(2.5rem, 4vw, 3.7rem); /* responsive scaling */
  margin-bottom: 0.2rem;
`;

// Title container dynamically positioned, centered on larger screens
const TitleContainer = styled.div`
  position: absolute;
  left: 12%;
  transform: translateX(-50%);
  white-space: nowrap;

  /* On small screens, switch to centered block flow */
  @media (max-width: 1300px) {
    left: 50%;               
    transform: translateX(-50%);
  }
`;

// Title text with responsive font size using clamp
const TitleImage = styled.h1`
  font-family: 'Sansation', sans-serif;
  font-size: clamp(1.2rem, 2.2vw, 1.5rem);
  cursor: default;
  text-align: center;
`;

// Navigation links and icon, aligned to the right
const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.95rem;
  white-space: nowrap;
  margin-left: auto;
  margin-right: 0.6%;

  @media (max-width: 950px) {
    gap: 0.8rem;
  }
`;

// Each nav link with responsive font size
const AnchorLink = styled.a`
  cursor: pointer;
  text-decoration: none;
  font-family: "Cascadia Mono", system-ui, sans-serif;
  font-size: clamp(0.75rem, 1.1vw, 0.95rem);
  font-weight: 300;
  color: black;
  transition: color 0.2s ease;

  &:hover {
    color: #15a497;
  }
`;

// SVG icon with consistent size and hover color
const OtherPagesSymbol = styled.svg`
  width: 1.5rem;
  height: 1.5rem;
  fill: black;
  cursor: pointer;
  transition: fill 0.2s ease;

  &:hover {
    fill: #15a497;
  }

  @media (max-width: 950px) {
    width: 1.2rem;
    height: 1.2rem;
  }
`;

function Header() {
  return (
    <HeaderContainer>
      <LogoContainer>
        <LogoImage src={solviblyLogo} alt="Logo Solvibly AI" />
      </LogoContainer>

      <TitleContainer>
        <TitleImage>
          SOLVIBLY <strong>AI</strong>
        </TitleImage>
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
