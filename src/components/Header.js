import React from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.div`
  height: 80px;
  background: linear-gradient(90deg, var(--primary-orange), var(--secondary-yellow));
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 8px var(--shadow);
`;

const Logo = styled.img`
  height: 50px;
  margin-right: 16px;
`;

const Title = styled.h1`
  color: var(--accent-white);
  font-size: 28px;
  font-weight: 700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  color: var(--accent-white);
  font-size: 14px;
  margin-left: auto;
  opacity: 0.9;
`;

const Header = () => {
  return (
    <HeaderContainer>
      <Logo src="/assets/logo/airloop_logo_black.png" alt="AirLoop Logo" />
      <Title>Smart QC</Title>
      <Subtitle>Quality Control for Image Annotations</Subtitle>
    </HeaderContainer>
  );
};

export default Header;
