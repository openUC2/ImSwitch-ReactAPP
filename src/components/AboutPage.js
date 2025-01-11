import React from "react";
import { Paper, Typography, Grid, Link, Button } from "@mui/material";

const AboutPage = () => {
  return (
    <Paper style={{ padding: "20px", marginTop: "20px" }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            About the Microscope Control Software
          </Typography>
          <Typography variant="body1" gutterBottom>
            This application is an open-source software designed to control microscopes using a modular and extensible approach. It seamlessly integrates advanced features to empower researchers and educators in the microscopy domain.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">Source Code</Typography>
          <Typography variant="body2">
            The source code for this React application can be found in our GitHub repository:
            <br />
            <Link href="https://github.com/openUC2/imswitch-aiortc-react" target="_blank">
              openUC2/imswitch-aiortc-react
            </Link>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">Backend</Typography>
          <Typography variant="body2">
            The backend is based on the openUC2 fork of ImSwitch. You can find it here:
            <br />
            <Link href="https://github.com/openUC2/imswitch" target="_blank">
              openUC2/imswitch
            </Link>
            <br />
            The REST API documentation is accessible under:
            <code>{`{hostIP}:{hostPort}/docs`}</code>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">Community and Support</Typography>
          <Typography variant="body2">
            Reach out to us on our forum for discussions and support:
            <br />
            <Link href="https://openuc2.discourse.group" target="_blank">
              openuc2.discourse.group
            </Link>
            <br />
            Learn more about us on our official website:
            <br />
            <Link href="http://openuc2.com" target="_blank">
              openuc2.com
            </Link>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            href="https://github.com/openUC2/imswitch-aiortc-react"
            target="_blank"
          >
            View React App Repository
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            href="https://github.com/openUC2/imswitch"
            target="_blank"
            style={{ marginLeft: "10px" }}
          >
            View Backend Repository
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AboutPage;
