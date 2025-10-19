import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import solviblyLogo from '../../graphics/Header/Logo/logosvg.svg';

// --- STYLED COMPONENTS ---

const HeaderContainer = styled.header`
  position: relative;
  z-index: 1000;
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

const LogoContainer = styled.div`
  margin-right: auto;
`;

const LogoImage = styled.img`
  display: block;
  width: clamp(2.5rem, 4vw, 3.7rem); /* responsive scaling */
  margin-bottom: 0.2rem;
`;

const TitleContainer = styled.div`
  position: absolute;
  /* FIX anti micro-shift: usa il viewport width al posto della % del contenitore */
  left: 12vw;                /* <— era 12% */
  transform: translateX(-50%);
  white-space: nowrap;

  /* On small screens, switch to centered block flow */
  @media (max-width: 1300px) {
    left: 50vw;              /* <— era 50% */
    transform: translateX(-50%);
  }
`;

const TitleImage = styled.h1`
  font-family: 'Sansation', sans-serif;
  font-size: clamp(1.2rem, 2.2vw, 1.5rem);
  text-align: center;
`;

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

const AnchorLink = styled(Link)`
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

const NeutralLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  font-weight: inherit;
  display: inline-block;
  cursor: pointer;

  &:hover {
    color: inherit;
  }
`;

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

// --- MAIN COMPONENT ---

function Header() {
  return (
    <HeaderContainer>
      <LogoContainer>
        <NeutralLink to="/">
          <LogoImage src={solviblyLogo} alt="Logo Solvibly AI" />
        </NeutralLink>
      </LogoContainer>

      <TitleContainer>
        <NeutralLink to="/">
          <TitleImage>
            SOLVIBLY <strong>AI</strong>
          </TitleImage>
        </NeutralLink>
      </TitleContainer>

      <LinksContainer>
        <AnchorLink to="/help">Help</AnchorLink>
        <AnchorLink to="/pricing">Pricing</AnchorLink>
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
