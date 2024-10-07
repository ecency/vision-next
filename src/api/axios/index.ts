import axios from "axios";

export const appAxios = axios.create({
  timeout: typeof window !== "undefined" ? Infinity : 30000
});
