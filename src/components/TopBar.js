import { Box, Toolbar, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ThemeSwitcher from "./ThemeSwitcher";

function TopBar({
  isMobile,
  sidebarVisible,
  setSidebarVisible,
  selectedPlugin,
}) {
  return (
    <Box
      sx={(theme) => ({
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: "1px solid",
      })}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => setSidebarVisible(!sidebarVisible)}
          sx={{ mr: 2 }}
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
          {isMobile ? selectedPlugin : `ImSwitch UI - ${selectedPlugin}`}
        </Typography>
        <ThemeSwitcher isMobile={isMobile} />
      </Toolbar>
    </Box>
  );
}

export default TopBar;
