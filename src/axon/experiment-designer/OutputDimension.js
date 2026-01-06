import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import * as experimentSlice from "../../state/slices/ExperimentSlice";
import * as experimentUISlice from "../../state/slices/ExperimentUISlice";
import { DIMENSIONS } from "../../state/slices/ExperimentUISlice";

/**
 * OutputDimension - Output/file format configuration interface
 *
 * Contains:
 * - File format selection (OME-TIFF, OME-Zarr, etc.)
 * - Stitching output options
 * - Compression/chunking (hidden by default)
 * - Metadata preview (optional)
 */
const OutputDimension = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Redux state
  const experimentState = useSelector(experimentSlice.getExperimentState);
  const parameterValue = experimentState.parameterValue;

  // Determine active formats
  const activeFormats = [];
  if (parameterValue.ome_write_zarr) activeFormats.push("OME-Zarr");
  if (parameterValue.ome_write_tiff) activeFormats.push("OME-TIFF");
  if (parameterValue.ome_write_stitched_tiff) activeFormats.push("Stitched TIFF");
  if (parameterValue.ome_write_individual_tiffs) activeFormats.push("Individual TIFFs");

  // Update summary when formats change
  useEffect(() => {
    const summary = activeFormats.length > 0 
      ? `Save as ${activeFormats.join(", ")}`
      : "Default output";
    
    dispatch(experimentUISlice.setDimensionSummary({
      dimension: DIMENSIONS.OUTPUT,
      summary,
    }));
    dispatch(experimentUISlice.setDimensionConfigured({
      dimension: DIMENSIONS.OUTPUT,
      configured: activeFormats.length > 0,
    }));
  }, [parameterValue, dispatch]);

  // Format options with descriptions
  const formatOptions = [
    {
      key: "ome_write_zarr",
      label: "OME-Zarr",
      description: "Cloud-optimized chunked format. Best for large datasets, remote access, and parallel processing.",
      recommended: true,
      value: parameterValue.ome_write_zarr,
      onChange: (checked) => dispatch(experimentSlice.setOmeWriteZarr(checked)),
    },
    {
      key: "ome_write_tiff",
      label: "OME-TIFF",
      description: "Standard microscopy format with full metadata. Compatible with ImageJ, FIJI, and other analysis software.",
      recommended: false,
      value: parameterValue.ome_write_tiff,
      onChange: (checked) => dispatch(experimentSlice.setOmeWriteTiff(checked)),
    },
    {
      key: "ome_write_stitched_tiff",
      label: "Stitched OME-TIFF",
      description: "Single large stitched image combining all tiles. Warning: Can produce very large files.",
      recommended: false,
      value: parameterValue.ome_write_stitched_tiff,
      onChange: (checked) => dispatch(experimentSlice.setOmeWriteStitchedTiff(checked)),
    },
    {
      key: "ome_write_individual_tiffs",
      label: "Individual TIFFs",
      description: "Separate TIFF file per tile with position-based naming. Useful for distributed processing.",
      recommended: false,
      value: parameterValue.ome_write_individual_tiffs,
      onChange: (checked) => dispatch(experimentSlice.setOmeWriteIndividualTiffs(checked)),
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Format Selection */}
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Output Formats
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Select one or more output formats. Multiple formats can be saved simultaneously.
      </Typography>

      {/* Format Cards */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {formatOptions.map((format) => (
          <Box
            key={format.key}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              p: 2,
              border: `1px solid ${format.value ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 1,
              backgroundColor: format.value 
                ? alpha(theme.palette.primary.main, 0.04) 
                : "transparent",
              transition: "all 0.2s ease-in-out",
            }}
          >
            <Switch
              checked={format.value || false}
              onChange={(e) => format.onChange(e.target.checked)}
              sx={{ mr: 1.5, mt: -0.5 }}
            />
            
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {format.label}
                </Typography>
                {format.recommended && (
                  <Chip
                    label="Recommended"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: "0.65rem", height: "18px" }}
                  />
                )}
                {format.value && (
                  <CheckCircleIcon 
                    sx={{ fontSize: 16, color: theme.palette.success.main, ml: "auto" }} 
                  />
                )}
              </Box>
              <Typography variant="caption" color="textSecondary">
                {format.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Quick info about selected formats */}
      {activeFormats.length > 0 && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.info.main, 0.08),
          }}
        >
          <Typography variant="caption" color="textSecondary">
            <strong>Selected:</strong> {activeFormats.join(" + ")}
          </Typography>
        </Box>
      )}

      {/* Warning if no format selected */}
      {activeFormats.length === 0 && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.warning.main, 0.08),
          }}
        >
          <Typography variant="caption" color="warning.main">
            ⚠️ No output format selected. Images will only be displayed but not saved.
          </Typography>
        </Box>
      )}

      {/* Advanced Settings */}
      <Accordion
        disableGutters
        sx={{
          mt: 2,
          boxShadow: "none",
          border: `1px solid ${theme.palette.divider}`,
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Compression options */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 1, display: "block" }}>
                Compression (Zarr)
              </Typography>
              <Typography variant="caption" color="textSecondary">
                OME-Zarr files use blosc compression by default for optimal balance of speed and size.
              </Typography>
            </Box>

            {/* Chunking options */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 1, display: "block" }}>
                Chunking Strategy
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Data is automatically chunked for efficient access patterns. Default chunk size: 256x256 pixels.
              </Typography>
            </Box>

            {/* Metadata */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 500, mb: 1, display: "block" }}>
                Metadata
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Full OME metadata is included automatically, containing acquisition parameters, 
                channel information, physical pixel sizes, and timestamps.
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Metadata Preview (future feature placeholder) */}
      <Accordion
        disableGutters
        disabled
        sx={{
          mt: 1,
          boxShadow: "none",
          border: `1px solid ${theme.palette.divider}`,
          "&:before": { display: "none" },
          opacity: 0.5,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">Metadata Preview (Coming Soon)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="caption" color="textSecondary">
            Preview the metadata that will be saved with your experiment.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default OutputDimension;
