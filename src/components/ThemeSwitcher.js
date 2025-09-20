import { useDispatch, useSelector } from "react-redux";
import { Switch, Typography } from "@mui/material";
import { toggleTheme, getThemeState } from "../state/slices/ThemeSlice";

function ThemeSwitcher({ isMobile }) {
  const dispatch = useDispatch();
  const { isDarkMode } = useSelector(getThemeState);

  const handleToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <>
      {!isMobile && (
        <Typography variant="h6" sx={{ fontWeight: "bold", marginRight: 1 }}>
          Light/dark
        </Typography>
      )}
      <Switch
        checked={isDarkMode}
        onChange={handleToggle}
        color="default"
        inputProps={{ "aria-label": "toggle theme" }}
        sx={{
          "& .MuiSwitch-thumb": {
            width: isMobile ? 24 : 20,
            height: isMobile ? 24 : 20,
          },
          "& .MuiSwitch-track": {
            minWidth: isMobile ? 48 : 34,
            height: isMobile ? 28 : 14,
          },
        }}
      />
    </>
  );
}

export default ThemeSwitcher;
