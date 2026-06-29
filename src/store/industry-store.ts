"use client";
import { create } from "zustand";
import { INDUSTRY_TEMPLATES } from "@/lib/industry";

interface IndustryStore {
  template: typeof INDUSTRY_TEMPLATES.ktv;
  industryType: string;
  loaded: boolean;
  setIndustry: (type: any, customConfig?: string) => void;
  loadFromServer: () => Promise<void>;
}

export const useIndustry = create<IndustryStore>()((set) => ({
  template: INDUSTRY_TEMPLATES.ktv,
  industryType: "ktv",
  loaded: false,
  setIndustry: (type, customConfig) => {
    const base = INDUSTRY_TEMPLATES[type as keyof typeof INDUSTRY_TEMPLATES] ?? INDUSTRY_TEMPLATES.ktv;
    set({ template: base, industryType: type, loaded: true });
  },
  loadFromServer: async () => {
    try {
      let storeId = 1001;
      try {
        const a = JSON.parse(localStorage.getItem("ktv-auth") || "{}");
        if (a?.state?.user?.storeId) storeId = a.state.user.storeId;
      } catch {}
      const res = await fetch(`/api/sys/industry?storeId=${storeId}`);
      const body = await res.json();
      if (body.code === 200 && body.data) {
        const type = body.data.type;
        const tpl = INDUSTRY_TEMPLATES[type as keyof typeof INDUSTRY_TEMPLATES] ?? INDUSTRY_TEMPLATES.ktv;
        set({ template: tpl, industryType: type, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
}));
