// 全局 UI 状态：主题、当前门店、Toast 触发

"use client";

import { create } from "zustand";

export type Theme = "light" | "dark";

interface UIStore {
  theme: Theme;
  currentStoreId: number; // 当前选中的门店（POS/配置等模块用）
  sidebarOpen: boolean; // 移动端侧边栏
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setCurrentStoreId: (id: number) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  theme: "light",
  currentStoreId: 1001,
  sidebarOpen: false,
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return { theme: next };
    }),
  setTheme: (t) =>
    set(() => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", t === "dark");
      }
      return { theme: t };
    }),
  setCurrentStoreId: (id) => set({ currentStoreId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
