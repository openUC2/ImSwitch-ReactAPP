
import React from "react";
import { Box, IconButton, Typography, Avatar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import uc2Logo from "../assets/ouc2_logo_quadratic.png";

function DrawerHeader({ sidebarVisible, setSidebarVisible, isMobile }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: sidebarVisible ? "space-between" : "center",
        px: 2,
        py: 1.5,
        minHeight: 64,
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        zIndex: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar src={uc2Logo} sx={{ width: 36, height: 36 }} />
        {sidebarVisible && (
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", fontSize: isMobile ? "1rem" : "1.15rem" }}
          >
            openUC2
          </Typography>
        )}
      </Box>
      <IconButton
        onClick={() => setSidebarVisible(!sidebarVisible)}
        size="large"
        edge="end"
        sx={{ ml: 1 }}
        aria-label={sidebarVisible ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarVisible ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>
    </Box>
  );
}

export default DrawerHeader;
