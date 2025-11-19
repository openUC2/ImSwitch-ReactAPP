import { createTheme } from "@mui/material/styles";

/**
 * ImSwitch Light Theme
 * Material-UI theme configuration for light mode
 * Follows Copilot Instructions for generic UI components
 */
export const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
  typography: {
    fontFamily: "Roboto",
    fontWeightBold: 700,
  },
  components: {
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
        
        /* Default zoom for better Mac display */
        html {
          zoom: 90%;
        }
      `,
    },
  },
});
