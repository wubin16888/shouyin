// 行业模板全局状态 — 按当前登录用户的门店加载

"use client";

import { create } from "zustand";
import { INDUSTRY_TEMPLATES, type IndustryTemplate, type IndustryType } from "@/lib/industry";

interface IndustryStore {
  template: IndustryTemplate;
  industryType: IndustryType;
  loaded: boolean;
  setIndustry: (type: IndustryType, customConfig?: string) => void;
  loadFromServer: () => Promise<void>;
}

function mergeTemplate(type: IndustryType, customConfig?: string): IndustryTemplate {
  const base = INDUSTRY_TEMPLATES[type] ?? INDUSTRY_TEMPLATES.ktv;
  if (!customConfig) return base;
  try {
    const custom = JSON.parse(customConfig);
    return {
      ...base, ...custom,
      terms: { ...base.terms, ...custom.terms },
      theme: { ...base.theme, ...custom.theme },
    };
  } catch {
    return base;
  }
}

export const useIndustry = create<IndustryStore>()((set) => ({
  template: INDUSTRY_TEMPLATES.ktv,
  industryType: "ktv",
  loaded: false,
  setIndustry: (type, customConfig) => {
    set({ template: mergeTemplate(type, customConfig), industryType: type, loaded: true });
  },
  loadFromServer: async () => {
    try {
      let storeId = 1001;
      try {
        const authStr = localStorage.getItem("ktv-auth");
        if (authStr) {
          const auth = JSON.parse(authStr);
          if (auth?.state?.user?.storeId) {
            storeId = auth.state.user.storeId;
          }
        }
      } catch { /* ignore */ }

      const res = await fetch(`/api/sys/industry?storeId=${storeId}`);
      const body = await res.json();
      if (body.code === 200 && body.data) {
        const type = body.data.type as IndustryType;
        set({
          template: mergeTemplate(type, body.data.customConfig),
          industryType: type,
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
}));
