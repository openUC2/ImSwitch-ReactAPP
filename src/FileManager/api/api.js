import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000",//import.meta.env.VITE_API_BASE_URL,
});
