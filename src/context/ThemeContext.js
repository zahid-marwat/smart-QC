import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const theme = {
    colors: {
      primary: '#FF8C00',
      secondary: '#FFD700',
      white: '#FFFFFF',
      black: '#000000',
      lightGray: '#F5F5F5',
      borderGray: '#CCCCCC',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
