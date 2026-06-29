"use client";

import { create } from "zustand";
import { INDUSTRY_TEMPLATES } from "@/lib/industry";

export const useIndustry = create((set) => ({
  template: INDUSTRY_TEMPLATES.ktv,
  industryType: "ktv",
  loaded: false,
  setIndustry: (type, customConfig) => {
    const base = INDUSTRY_TEMPLATES[type] || INDUSTRY_TEMPLATES.ktv;
    set({ template: base, industryType: type, loaded: true });
  },
  loadFromServer: async () => {
    try {
      let storeId = 1001;
      try {
        const a = JSON.parse(localStorage.getItem("ktv-auth") || "{}");
        if (a && a.state && a.state.user && a.state.user.storeId) {
          storeId = a.state.user.storeId;
        }
      } catch (e) {}
      const res = await fetch("/api/sys/industry?storeId=" + storeId);
      const body = await res.json();
      if (body.code === 200 && body.data) {
        const type = body.data.type;
        const tpl = INDUSTRY_TEMPLATES[type] || INDUSTRY_TEMPLATES.ktv;
        set({ template: tpl, industryType: type, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch (e) {
      set({ loaded: true });
    }
  },
}));
