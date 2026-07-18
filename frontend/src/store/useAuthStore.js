import { create } from "zustand";
import api from "../lib/api";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          if (data.data?.accessToken) {
            localStorage.setItem("accessToken", data.data.accessToken);
          }
          set({ user: data.data.user, isAuthenticated: true, isLoading: false });
          return data.data.user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // ignore
        }
        localStorage.removeItem("accessToken");
        set({ user: null, isAuthenticated: false });
      },

      getProfile: async () => {
        try {
          const { data } = await api.get("/auth/profile");
          set({ user: data.data, isAuthenticated: true });
          return data.data;
        } catch {
          set({ user: null, isAuthenticated: false });
          return null;
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        const { data } = await api.put("/auth/change-password", {
          currentPassword,
          newPassword,
        });
        return data;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
