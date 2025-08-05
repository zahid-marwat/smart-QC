import React from 'react';
import styled from 'styled-components';

// background: linear-gradient(90deg, var(--primary-orange), var(--secondary-yellow));
const HeaderContainer = styled.div`
  height: 80px;
  background: linear-gradient(90deg, var(--secondary-yellow),var(--primary-orange));
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px var(--shadow);
`;

const Logo = styled.img`
  height: 65px;
  margin-right: 16px;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const Title = styled.h1`
  color: var(--accent-black);
  font-size: 28px;
  font-weight: 700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  color: var(--accent-white);
  font-size: 14px;
  opacity: 0.9;
`;

const RightSection = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ContactButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid var(--accent-white);
  color: var(--accent-white);
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--accent-white);
    color: var(--primary-orange);
    transform: translateY(-1px);
  }
`;

const DeveloperLink = styled.a`
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid var(--accent-white);
  color: var(--accent-black);
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--accent-white);
    color: var(--primary-orange);
    transform: translateY(-1px);
  }
`;

const Header = () => {
  const handleLogoClick = () => {
    // Navigate to main page instead of external website
    window.location.reload(); // This resets the app to the main page
  };

  const handleContactUsClick = () => {
    window.open('https://airloop.ai', '_blank');
  };

  const handleDeveloperClick = () => {
    window.open('https://zahid-marwat.github.io/zahid-marwat/', '_blank');
  };

  return (
    <HeaderContainer>
      <Logo 
        src="/assets/logo/airloop_logo_black.png" 
        alt="AirLoop Logo" 
        onClick={handleLogoClick}
        title="Return to Main Page"
      />
      <Title>Smart QC</Title>
      <RightSection>
        <Subtitle>Quality Control for Image Annotations</Subtitle>
        <ContactButton onClick={handleContactUsClick}>
          Contact Us
        </ContactButton>
        <DeveloperLink 
          href="#" 
          onClick={(e) => { e.preventDefault(); handleDeveloperClick(); }}
        >
          Developer
        </DeveloperLink>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
