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
    <div style={{ display: "flex", alignItems: "center", minHeight: 40 }}>
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
          mx: isMobile ? 0 : 1,
          "& .MuiSwitch-thumb": {
            width: 20,
            height: 20,
          },
          "& .MuiSwitch-track": {
            minWidth: 34,
            height: 14,
          },
        }}
      />
    </div>
  );
}

export default ThemeSwitcher;
