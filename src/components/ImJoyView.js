// src/components/ImJoyView.js
import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";

// Example of how you might load ImJoy
// If you want to replicate the same code you have in LiveView (for ImJoy loading),
// just copy it here or share it via context
const ImJoyView = ({ sharedImage }) => {
  const [imjoyAPI, setImjoyAPI] = useState(null);

  useEffect(() => {
    // Load ImJoy script dynamically
    const script = document.createElement("script");
    script.src = "https://lib.imjoy.io/imjoy-loader.js";
    script.async = true;
    script.onload = async () => {
      const app = await window.loadImJoyBasicApp({
        process_url_query: false,
        show_window_title: false,
        show_progress_bar: true,
        show_empty_window: true,
        menu_style: { position: "absolute", right: 0, top: "2px" },
        window_style: { width: "100%", height: "100%" },
        main_container: null,
        menu_container: "imjoy-menu-container",
        window_manager_container: "imjoy-window-container",
      });
      setImjoyAPI(app.imjoy.api);

      // Add your menu item or other logic...
      app.addMenuItem({
        label: "➕ Load Plugin",
        callback() {
          const uri = prompt("Please type an ImJoy plugin URL");
          if (uri) app.loadPlugin(uri);
        },
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Example: function to send the sharedImage to ImJoy
  const handleSendToImJoy = async () => {
    if (!imjoyAPI || !sharedImage) return;
    try {
      // E.g. if `sharedImage` is a data URL
      // You can fetch it as bytes, then pass it to ImJoy
      const resp = await fetch(sharedImage);
      const arrayBuffer = await resp.arrayBuffer();

      // Possibly open an ImageJ window
      let ij = await imjoyAPI.getWindow("ImageJ.JS");
      if (!ij) {
        ij = await imjoyAPI.createWindow({
          src: "https://ij.imjoy.io",
          name: "ImageJ.JS",
          fullscreen: true,
        });
      } else {
        await ij.show();
      }

      // Then show the image
      await ij.viewImage(arrayBuffer, { name: "shared-image.jpeg" });
    } catch (error) {
      console.error("Error sending to ImJoy:", error);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        position: "relative",
      }}
    >
      <Typography variant="h6" gutterBottom>
        ImJoy Integration Page
      </Typography>

      {sharedImage ? (
        <img
          src={sharedImage}
          alt="Shared"
          style={{ maxWidth: "400px", border: "1px solid #ccc" }}
        />
      ) : (
        <Typography variant="body1">No image shared yet.</Typography>
      )}

      <Button variant="contained" onClick={handleSendToImJoy}>
        Send Image to ImJoy
      </Button>

      {/* The containers for ImJoy menu + windows */}
      <Box
        id="imjoy-menu-container"
        sx={{ width: "100%", height: 40, border: "1px solid #ccc", mb: 2 }}
      ></Box>
      <Box
        id="imjoy-window-container"
        sx={{ width: "100%", height: 400, border: "1px solid #ccc" }}
      ></Box>
    </Box>
  );
};

export default ImJoyView;
