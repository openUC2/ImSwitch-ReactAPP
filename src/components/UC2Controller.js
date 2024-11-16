import React, { useState, useEffect } from "react";
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

const goToWebsite = () => {
  window.open("https://youseetoo.github.io", "_blank");
};

const UC2Controller = ({ hostIP, hostPort, WindowTitle }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [availableSetups, setAvailableSetups] = useState([]);
  const [selectedSetup, setSelectedSetup] = useState("");

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const fetchAvailableSetups = () => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/returnAvailableSetups`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setAvailableSetups(data.available_setups || []);
      })
      .catch((error) => console.error("Error fetching setups:", error));
  };

  const handleSetupChange = (event) => {
    setSelectedSetup(event.target.value);
  };

  const reconnect = () => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/reconnect`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        // Handle response data if needed
      })
      .catch((error) => console.error("Error:", error));
  };

  const btConnect = () => {
    const url = `${hostIP}:${hostPort}/UC2ConfigController/btpairing`;

    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        // Handle response data if needed
      })
      .catch((error) => console.error("Error:", error));
  };


  const handleSetSetup = () => {
    if (!selectedSetup) {
      alert("Please select a setup before proceeding.");
      return;
    }

    const url = `${hostIP}:${hostPort}/UC2ConfigController/setSetupFileName?setupFileName=${encodeURIComponent(
      selectedSetup
    )}`;

    fetch(url, { method: "get" })
      .then((response) => response.json())
      .then((data) => {
        console.log("Setup selected:", data);
        // Handle response if needed
      })
      .catch((error) => console.error("Error setting setup:", error));
  };

  useEffect(() => {
    fetchAvailableSetups();
  }, []);

  return (
    <Paper>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        aria-label="settings tabs"
      >
        <Tab label="Reconnect to UC2 board" />
        <Tab label="Select Setup" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Reconnect to UC2 board</Typography>
            <div>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={reconnect}
              >
                Reconnect
              </Button>
            </div>
            <Typography variant="h6">Bluetooth Pairing</Typography>
            <div>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={btConnect}
              >
                BT Pairing
              </Button>
            </div>
            <Typography variant="h6">Flash New Firmware</Typography>
            <div>
              <Button
                style={{ marginBottom: "20px" }}
                variant="contained"
                onClick={goToWebsite}
              >
                UC2-ESP32
              </Button>
            </div>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">Select Available Setup</Typography>
            <FormControl fullWidth style={{ marginBottom: "20px" }}>
              <InputLabel id="setup-select-label">Available Setups</InputLabel>
              <Select
                labelId="setup-select-label"
                value={selectedSetup}
                onChange={handleSetupChange}
              >
                {availableSetups.map((setup, index) => (
                  <MenuItem key={index} value={setup}>
                    {setup}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              style={{ marginBottom: "20px" }}
              variant="contained"
              onClick={handleSetSetup}
            >
              OK
            </Button>
          </Grid>
        </Grid>
      </TabPanel>
    </Paper>
  );
};

export default UC2Controller;
