// 行业模板系统 — 一套收银逻辑，换皮肤换行业

export type IndustryType = "ktv" | "supermarket" | "billiards" | "restaurant" | "custom";

export interface IndustryTemplate {
  type: IndustryType;
  name: string;
  icon: string;
  terms: {
    room: string;
    roomUnit: string;
    order: string;
    product: string;
    consume: string;
    checkout: string;
    open: string;
    staff: string;
    production: string;
  };
  billingModes: Array<{ value: string; label: string }>;
  defaultBilling: string;
  modules: {
    rooms: boolean;
    production: boolean;
    reservation: boolean;
    members: boolean;
    inventory: boolean;
  };
  theme: {
    primary: string;
    accent: string;
    roomColors: {
      idle: string;
      in_use: string;
      checkout: string;
      cleaning: string;
      maintenance: string;
    };
  };
  statusLabels?: Record<string, string>;
}

export const INDUSTRY_TEMPLATES: Record<IndustryType, IndustryTemplate> = {
  ktv: {
    type: "ktv",
    name: "KTV",
    icon: "🎤",
    terms: {
      room: "房台",
      roomUnit: "间",
      order: "点单",
      product: "酒水",
      consume: "消费",
      checkout: "买单",
      open: "开台",
      staff: "吧台",
      production: "出品",
    },
    billingModes: [
      { value: "hourly", label: "计时（按小时）" },
      { value: "minspend", label: "低消（最低消费）" },
      { value: "package", label: "开房套餐" },
      { value: "free", label: "免费" },
    ],
    defaultBilling: "hourly",
    modules: { rooms: true, production: true, reservation: true, members: true, inventory: false },
    theme: {
      primary: "#059669",
      accent: "#eab308",
      roomColors: { idle: "#059669", in_use: "#e11d48", checkout: "#eab308", cleaning: "#8b5cf6", maintenance: "#475569" },
    },
  },
  supermarket: {
    type: "supermarket",
    name: "超市",
    icon: "🛒",
    terms: {
      room: "收银台",
      roomUnit: "台",
      order: "扫码",
      product: "商品",
      consume: "购物",
      checkout: "结账",
      open: "开始",
      staff: "收银员",
      production: "出货",
    },
    billingModes: [{ value: "instant", label: "即买即走" }],
    defaultBilling: "instant",
    modules: { rooms: false, production: false, reservation: false, members: true, inventory: true },
    theme: {
      primary: "#0284c7",
      accent: "#f59e0b",
      roomColors: { idle: "#0284c7", in_use: "#0284c7", checkout: "#eab308", cleaning: "#6b7280", maintenance: "#475569" },
    },
  },
  billiards: {
    type: "billiards",
    name: "台球室",
    icon: "🎱",
    terms: {
      room: "球桌",
      roomUnit: "张",
      order: "点单",
      product: "消费",
      consume: "消费",
      checkout: "买单",
      open: "开桌",
      staff: "吧台",
      production: "出品",
    },
    billingModes: [
      { value: "hourly", label: "计时（按小时）" },
      { value: "free", label: "免费" },
    ],
    defaultBilling: "hourly",
    modules: { rooms: true, production: true, reservation: false, members: true, inventory: false },
    theme: {
      primary: "#15803d",
      accent: "#eab308",
      roomColors: { idle: "#15803d", in_use: "#e11d48", checkout: "#eab308", cleaning: "#8b5cf6", maintenance: "#475569" },
    },
  },
  restaurant: {
    type: "restaurant",
    name: "饭店",
    icon: "🍽️",
    terms: {
      room: "餐桌",
      roomUnit: "桌",
      order: "点菜",
      product: "菜品",
      consume: "消费",
      checkout: "买单",
      open: "开桌",
      staff: "服务员",
      production: "传菜",
    },
    billingModes: [
      { value: "instant", label: "即消费即结" },
      { value: "hourly", label: "计时（包间）" },
    ],
    defaultBilling: "instant",
    modules: { rooms: true, production: true, reservation: true, members: true, inventory: false },
    theme: {
      primary: "#ea580c",
      accent: "#f59e0b",
      roomColors: { idle: "#15803d", in_use: "#e11d48", checkout: "#eab308", cleaning: "#8b5cf6", maintenance: "#475569" },
    },
  },
  custom: {
    type: "custom",
    name: "自定义",
    icon: "⚙️",
    terms: {
      room: "工位",
      roomUnit: "个",
      order: "点单",
      product: "商品",
      consume: "消费",
      checkout: "结账",
      open: "开始",
      staff: "操作员",
      production: "出货",
    },
    billingModes: [
      { value: "hourly", label: "计时" },
      { value: "instant", label: "即买" },
      { value: "free", label: "免费" },
    ],
    defaultBilling: "hourly",
    modules: { rooms: true, production: true, reservation: false, members: true, inventory: false },
    theme: {
      primary: "#059669",
      accent: "#eab308",
      roomColors: { idle: "#059669", in_use: "#e11d48", checkout: "#eab308", cleaning: "#8b5cf6", maintenance: "#475569" },
    },
  },
};

export function getTemplate(type: IndustryType, customConfig?: string): IndustryTemplate {
  const base = INDUSTRY_TEMPLATES[type] ?? INDUSTRY_TEMPLATES.ktv;
  if (!customConfig) return base;
  try {
    const custom = JSON.parse(customConfig);
    return { ...base, ...custom, terms: { ...base.terms, ...custom.terms }, theme: { ...base.theme, ...custom.theme } };
  } catch {
    return base;
  }
}
