import axios from "axios";

export const httpClient = axios.create({
  withCredentials: true
});

httpClient.interceptors.response.use(
  res => {
    console.error("axios SUCCESS:", Object.keys(res));

    return res;
  },
  err => {
    console.error("axios ERROR:", err.request.path);
    throw new Error(err.response.data.message);
  }
);

export default httpClient;
