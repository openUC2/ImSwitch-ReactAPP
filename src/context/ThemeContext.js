import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '1.2rem', // Beispiel: Schriftgröße der Schaltflächen
          padding: '12px 24px', // Beispiel: Innenabstand der Schaltflächen
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 8, // Beispiel: Höhe des Sliders
        },
        thumb: {
          width: 24, // Beispiel: Breite des Slider-Daumen
          height: 24, // Beispiel: Höhe des Slider-Daumen
        },
      },
    },
    // Weitere Komponenten können hier hinzugefügt werden
  },
});

export default theme;