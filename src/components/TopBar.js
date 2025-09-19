import React from "react";
import { AppBar, Toolbar, IconButton, Typography, Avatar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ThemeSwitcher from "./ThemeSwitcher";
import uc2Logo from "../assets/ouc2_logo_quadratic.png";

function TopBar({
  isMobile,
  sidebarVisible,
  setSidebarVisible,
  selectedPlugin,
}) {
  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={() => setSidebarVisible(!sidebarVisible)}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: "bold",
            fontSize: isMobile ? "1rem" : "1.25rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {isMobile ? selectedPlugin : `ImSwitch - ${selectedPlugin}`}
        </Typography>
        <ThemeSwitcher isMobile={isMobile} />
        <Avatar src={uc2Logo} />
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
