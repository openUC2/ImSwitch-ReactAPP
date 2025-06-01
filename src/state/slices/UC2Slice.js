import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Tab navigation
  tabIndex: 0,

  // Setup management
  availableSetups: [],
  selectedSetup: "",
  isDialogOpen: false,
  restartSoftware: false,

  // Serial communication
  serialPayload: "",
  serialLog: [],
  uc2Connected: false,

  // Config file editing
  selectedFileForEdit: "",
  editorJson: null,
  editorJsonText: "",
  useAceEditor: false,

  // File operations
  newFileName: "",
  setAsCurrentConfig: true,
  restartAfterSave: false,
  overwriteFile: false,
};

const uc2Slice = createSlice({
  name: "uc2",
  initialState,
  reducers: {
    // Tab navigation
    setTabIndex: (state, action) => {
      state.tabIndex = action.payload;
    },

    // Setup management
    setAvailableSetups: (state, action) => {
      state.availableSetups = action.payload;
    },
    setSelectedSetup: (state, action) => {
      state.selectedSetup = action.payload;
    },
    setIsDialogOpen: (state, action) => {
      state.isDialogOpen = action.payload;
    },
    setRestartSoftware: (state, action) => {
      state.restartSoftware = action.payload;
    },

    // Serial communication
    setSerialPayload: (state, action) => {
      state.serialPayload = action.payload;
    },
    addSerialLogEntry: (state, action) => {
      state.serialLog.push(action.payload);
    },
    clearSerialLog: (state) => {
      state.serialLog = [];
    },
    setUc2Connected: (state, action) => {
      state.uc2Connected = action.payload;
    },

    // Config file editing
    setSelectedFileForEdit: (state, action) => {
      state.selectedFileForEdit = action.payload;
    },
    setEditorJson: (state, action) => {
      state.editorJson = action.payload;
    },
    setEditorJsonText: (state, action) => {
      state.editorJsonText = action.payload;
    },
    setUseAceEditor: (state, action) => {
      state.useAceEditor = action.payload;
    },

    // File operations
    setNewFileName: (state, action) => {
      state.newFileName = action.payload;
    },
    setSetAsCurrentConfig: (state, action) => {
      state.setAsCurrentConfig = action.payload;
    },
    setRestartAfterSave: (state, action) => {
      state.restartAfterSave = action.payload;
    },
    setOverwriteFile: (state, action) => {
      state.overwriteFile = action.payload;
    },
    setSerialLog: (state, action) => {
      state.serialLog = action.payload;
    },

    // Reset actions
    resetFileOperations: (state) => {
      state.newFileName = "";
      state.setAsCurrentConfig = true;
      state.restartAfterSave = false;
      state.overwriteFile = false;
      state.selectedFileForEdit = "";
      state.editorJson = null;
      state.editorJsonText = "";
      state.useAceEditor = false;
    },
  },
});

// Export actions
export const {
  setTabIndex,
  setAvailableSetups,
  setSelectedSetup,
  setIsDialogOpen,
  setRestartSoftware,
  setSerialPayload,
  addSerialLogEntry,
  clearSerialLog,
  setUc2Connected,
  setSelectedFileForEdit,
  setEditorJson,
  setEditorJsonText,
  setUseAceEditor,
  setNewFileName,
  setSetAsCurrentConfig,
  setRestartAfterSave,
  setOverwriteFile,
  resetFileOperations,
  setSerialLog
} = uc2Slice.actions;

// Export selector
export const getUc2State = (state) => state.uc2;

// Export reducer
export default uc2Slice.reducer;