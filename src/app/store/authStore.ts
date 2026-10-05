import { create } from "zustand";
import { connectSocket, disconnectSocket } from "@/lib/socket";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  status: AuthStatus;
  setSession: (token: string, user: User) => void;
  clear: () => void;
  setStatus: (status: AuthStatus) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  status: "loading" as AuthStatus,
  setSession: (accessToken, user) => {
    connectSocket(accessToken);
    set({ accessToken, user, status: "authenticated" });
  },
  clear: () => {
    disconnectSocket();
    set({ accessToken: null, user: null, status: "unauthenticated" });
  },
  setStatus: (status) => set({ status }),
  initialize: async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error("No session");
      const { accessToken, user } = await res.json();
      get().setSession(accessToken, user);
    } catch {
      set({ accessToken: null, user: null, status: "unauthenticated" });
    }
  },
}));
