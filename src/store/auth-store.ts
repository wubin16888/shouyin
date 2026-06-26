// 登录状态管理

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: string;
  position: string;
  isStoreAdmin: boolean;
  storeId: number;
  storeName: string;
  discount: number;
}

interface AuthStore {
  user: AuthUser | null;
  modules: string[];
  token: string | null;
  login: (user: AuthUser, modules: string[], token: string) => void;
  logout: () => void;
  hasModule: (m: string) => boolean;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      modules: [],
      token: null,
      login: (user, modules, token) => set({ user, modules, token }),
      logout: () => set({ user: null, modules: [], token: null }),
      hasModule: (m) => get().modules.includes(m),
    }),
    { name: "ktv-auth" },
  ),
);
