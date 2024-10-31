import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff', // Dark blue
    },
    background: {
      default: '#212145 ', // Darker background
      paper: '#1e293b', // Slightly lighter for paper components
    },
    text: {
      primary: '#f9f7f8', // Light text color
    },
  },
  shape: {
    borderRadius: 12, // Soft edges
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease', // Smooth animations
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
  },
});

export default theme; 