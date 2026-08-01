import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api",
  timeout: 180_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.detail ??
      error?.message ??
      "Unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);