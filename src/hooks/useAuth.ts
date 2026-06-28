import { useAuth as useAuthCtx } from "../context/AuthContext";

export const useAuth = () => {
  return useAuthCtx();
};
