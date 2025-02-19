// src/hooks/useApiBaseUrl.js
import axios from 'axios'; 
import store from '../state/store';

const createAxiosInstance = () => {
  //get settings
  const state = store.getState(); 
  //create instance
  return axios.create({
    baseURL: `${state.connectionSettingsState.ip}:${state.connectionSettingsState.apiPort}`,
  });
};

export default createAxiosInstance;
