import { createTheme } from "@mui/material/styles";

/**
 * ImSwitch Dark Theme
 * Material-UI theme configuration for dark mode microscopy interface
 * Optimized for low-light microscopy environments
 * Follows Copilot Instructions for generic UI components
 */
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
  typography: {
    fontFamily: "Roboto",
    fontWeightBold: 700,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        // Microscopy-optimized button styling can be added here
        // Currently using default Material-UI dark theme styling
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 8, // Optimized for microscopy control sliders
        },
        thumb: {
          width: 24, // Enhanced visibility for precision controls
          height: 24,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Roboto';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: local('Roboto'),
               url('/imswitch/fonts/Roboto-Regular.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Roboto';
          font-style: normal;
          font-display: swap;
          font-weight: 700;
          src: local('Roboto Bold'),
               url('/imswitch/fonts/Roboto-Bold.ttf') format('truetype');
        }
      `,
    },
  },
});
