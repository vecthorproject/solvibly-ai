/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import solviblyLogo from '../../graphics/Footer/Logo/logowhitesvg.svg';
import iconLN from '../../graphics/Footer/Various/Social Icons/LN_Icon.svg';
import iconFB from '../../graphics/Footer/Various/Social Icons/FB_Icon.svg';
import iconX from '../../graphics/Footer/Various/Social Icons/X_Icon.svg';

/** To-do: Fix the size of every screen (mobile, lap), remove "clamp" */

const FooterContainer = styled.footer`
  background-color: #000;
  color: white;
  padding:
         clamp(0.75rem, 2.5vw, 0.75rem) 
         clamp(3.2rem, 6vw, 3.2rem) 
         clamp(0.75rem, 2.5vw, 0.75rem) 
         clamp(2.6rem, 5.2vw, 2.6rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  font-family: "Cascadia Mono", system-ui, sans-serif;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.2vw, 1rem); /* spacing that scales */
`;

const FooterLogo = styled.img`
  height: clamp(1.6rem, 3.8vw, 2.4rem); /* scalable logo */
  margin-bottom: 0.2rem;
`;

const FooterInfo = styled.p`
  margin: 0;
  font-size: clamp(0.6rem, 0.94vw, 0.9rem);
  font-weight: 300;
  cursor: default;
`;

const FooterRight = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(1rem, 3vw, 2rem); /* spacing between links and icons */
`;

const FooterLinksContainer = styled.div`
  display: flex;
  gap: clamp(0.6rem, 1.5vw, 1.2rem);
`;

const FooterLinks = styled.a`
  font-size: clamp(0.5rem, 0.83vw, 0.93rem);
  color: white;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: white;
    text-decoration: underline;
  }
`;

const FooterSocialIconsContainer = styled.div`
  display: flex;
  gap: clamp(0.5rem, 1vw, 0.75rem);
`;

const SocialIconWrapper = styled.div`
  background-color: #fff;
  border-radius: 6px;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(1.5rem, 2.5vw, 2rem);
  height: clamp(1.5rem, 2.5vw, 2rem);
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #15A497;
  }
`;

const FooterSocialIconsLogo = styled.img`
  width: clamp(0.77rem, 1.25vw, 1rem);
  height: clamp(0.77rem, 1.25vw, 1rem);
`;

function Footer() {
  return (
    <FooterContainer>
      {/* Left: logo and copyright */}
      <FooterLeft>
        <FooterLogo src={solviblyLogo} alt="Solvibly logo" />
        <FooterInfo>© 2025 Solvibly AI</FooterInfo>
      </FooterLeft>

      {/* Right: links and social */}
      <FooterRight>
        <FooterLinksContainer>
          <FooterLinks>Privacy policy</FooterLinks>
          <FooterLinks>Terms of use</FooterLinks>
        </FooterLinksContainer>
        <FooterSocialIconsContainer>
          <SocialIconWrapper>
            <FooterSocialIconsLogo src={iconLN} alt="LinkedIn" />
          </SocialIconWrapper>
          <SocialIconWrapper>
            <FooterSocialIconsLogo src={iconFB} alt="Facebook" />
          </SocialIconWrapper>
          <SocialIconWrapper>
            <FooterSocialIconsLogo src={iconX} alt="X/Twitter" />
          </SocialIconWrapper>
        </FooterSocialIconsContainer>
      </FooterRight>
    </FooterContainer>
  );
}

export default Footer;
