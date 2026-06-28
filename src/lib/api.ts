// 前端 API 客户端

import type {
  ApiResp,
  AuditLogInfo,
  AuditSummary,
  ChainReportDailyInfo,
  ConfigHistoryInfo,
  DashboardSummary,
  DishInfo,
  KtvDashboardSummary,
  KtvOrderInfo,
  KtvOrderInfoV2,
  KtvOrderItemInfo,
  KtvProductInfo,
  KtvReservationInfo,
  KtvRoomInfo,
  KtvRoomInfoV2,
  MemberInfo,
  MemberTransactionInfo,
  BookingManagerInfo,
  FlavorCategoryInfo,
  GiftRuleInfo,
  ProductCategoryInfo,
  ProductInfo,
  SysConfigInfo,
  ThemeTemplateInfo,
  OrderInfo,
  RateLimitInfo,
  ReportSummary,
  StoreConfigInfo,
  StoreInfo,
  SyncConflictInfo,
  SyncLogInfo,
  SyncOverview,
  WebsocketEventInfo,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`请求失败 ${res.status}: ${txt}`);
  }
  const body = (await res.json()) as ApiResp<T>;
  if (body.code !== 200) {
    throw new Error(body.msg || "业务错误");
  }
  return body.data;
}

export const api = {
  // Dashboard
  getDashboard: () => request<DashboardSummary>("/api/dashboard"),

  // Stores
  getStores: () => request<StoreInfo[]>("/api/stores"),
  toggleStore: (storeId: number, status: number) =>
    request<StoreInfo>(`/api/stores/${storeId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  toggleWs: (storeId: number, wsStatus: "online" | "offline") =>
    request<StoreInfo>(`/api/stores/${storeId}/ws`, {
      method: "POST",
      body: JSON.stringify({ wsStatus }),
    }),
  getRateLimit: (storeId: number) =>
    request<RateLimitInfo>(`/api/stores/${storeId}/rate-limit`),
  updateRateLimit: (storeId: number, data: Partial<RateLimitInfo>) =>
    request<RateLimitInfo>(`/api/stores/${storeId}/rate-limit`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getWsEvents: (storeId?: number) =>
    request<WebsocketEventInfo[]>(
      `/api/stores/ws-events${storeId ? `?storeId=${storeId}` : ""}`,
    ),

  // Config
  getConfigs: (storeId: number) =>
    request<StoreConfigInfo[]>(`/api/config?storeId=${storeId}`),
  updateConfig: (
    storeId: number,
    configKey: string,
    configValue: string,
    operator?: string,
  ) =>
    request<StoreConfigInfo>(`/api/config`, {
      method: "PUT",
      body: JSON.stringify({ storeId, configKey, configValue, operator }),
    }),
  getConfigHistory: (storeId: number, configKey: string) =>
    request<ConfigHistoryInfo[]>(
      `/api/config/history?storeId=${storeId}&configKey=${encodeURIComponent(configKey)}`,
    ),
  rollbackConfig: (historyId: string) =>
    request<StoreConfigInfo>(`/api/config/rollback`, {
      method: "POST",
      body: JSON.stringify({ historyId }),
    }),

  // Sync
  getSyncOverview: () => request<SyncOverview>("/api/sync/overview"),
  getSyncLogs: (storeId?: number, status?: string) =>
    request<SyncLogInfo[]>(
      `/api/sync/logs?${new URLSearchParams({
        ...(storeId ? { storeId: String(storeId) } : {}),
        ...(status ? { status } : {}),
      })}`,
    ),
  getConflicts: (status?: string) =>
    request<SyncConflictInfo[]>(
      `/api/sync/conflicts?${status ? `?status=${status}` : ""}`,
    ),
  resolveConflict: (
    id: string,
    method: "local_wins" | "cloud_wins" | "merge",
  ) =>
    request<SyncConflictInfo>(`/api/sync/conflicts/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ method }),
    }),
  retrySync: (logId: string) =>
    request<SyncLogInfo>(`/api/sync/logs/${logId}/retry`, { method: "POST" }),

  // Reports
  getReport: (days: number = 7) =>
    request<ReportSummary>(`/api/reports?days=${days}`),
  getDailyReports: (storeId?: number) =>
    request<ChainReportDailyInfo[]>(
      `/api/reports/daily?${storeId ? `storeId=${storeId}` : ""}`,
    ),

  // Audit
  getAuditLogs: (params: {
    storeId?: number;
    operationType?: string;
    status?: string;
    limit?: number;
  }) =>
    request<AuditSummary>(
      `/api/audit?${new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null && v !== "")
            acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>),
      )}`,
    ),

  // POS
  getDishes: (storeId: number = 1001) =>
    request<DishInfo[]>(`/api/pos/dishes?storeId=${storeId}`),
  getOrders: (storeId?: number, limit?: number) =>
    request<OrderInfo[]>(
      `/api/pos/orders?${new URLSearchParams({
        ...(storeId ? { storeId: String(storeId) } : {}),
        ...(limit ? { limit: String(limit) } : {}),
      })}`,
    ),
  createOrder: (data: {
    storeId: number;
    items: Array<{ name: string; qty: number; price: number }>;
    payMethod: string;
  }) =>
    request<OrderInfo>(`/api/pos/orders`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ===== KTV =====
  getKtvDashboard: () => request<KtvDashboardSummary>("/api/ktv/dashboard"),
  getKtvRooms: () => request<KtvRoomInfoV2[]>("/api/ktv/rooms"),
  openRoom: (roomId: string, data: { customerName?: string; customerCount?: number; phone?: string; memberId?: string; bookingManagerId?: string | null; bookingManagerName?: string | null }) =>
    request<KtvOrderInfo>(`/api/ktv/rooms/${roomId}/open`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cleanRoom: (roomId: string) =>
    request<{ id: string; status: string }>(`/api/ktv/rooms/${roomId}/clean`, { method: "POST" }),
  getKtvProducts: (storeId = 1001) =>
    request<KtvProductInfo[]>(`/api/ktv/products?storeId=${storeId}`),
  getKtvOrders: (status?: string) =>
    request<KtvOrderInfoV2[]>(`/api/ktv/orders?${status ? `status=${status}` : ""}`),
  addOrderItems: (orderId: string, items: Array<{ productId: string; qty: number; flavors?: string | null }>) =>
    request<KtvOrderItemInfo[]>(`/api/ktv/orders/${orderId}/items`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  deliverItem: (orderId: string, itemId: string) =>
    request<{ id: string; status: string }>(`/api/ktv/orders/${orderId}/items/${itemId}/deliver`, { method: "POST" }),
  cancelOrderItem: (orderId: string, itemId: string) =>
    request<{ id: string; status: string }>(`/api/ktv/orders/${orderId}/items/${itemId}`, { method: "DELETE" }),
  checkoutOrder: (orderId: string, data: { payMethod: string; memberId?: string; discount?: number }) =>
    request<KtvOrderInfo>(`/api/ktv/orders/${orderId}/checkout`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cancelOrder: (orderId: string) =>
    request<{ id: string; status: string }>(`/api/ktv/orders/${orderId}/cancel`, { method: "POST" }),
  getReservations: (status?: string) =>
    request<KtvReservationInfo[]>(`/api/ktv/reservations?${status ? `status=${status}` : ""}`),
  createReservation: (data: { customerName: string; phone: string; partySize: number; startAt: string; endAt: string; roomNo?: string; remark?: string }) =>
    request<KtvReservationInfo>("/api/ktv/reservations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateReservationStatus: (id: string, status: string) =>
    request<KtvReservationInfo>(`/api/ktv/reservations/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  // ===== 会员 =====
  getMembers: (keyword?: string) =>
    request<MemberInfo[]>(`/api/members?${keyword ? `keyword=${encodeURIComponent(keyword)}` : ""}`),
  getMemberByPhone: (phone: string) =>
    request<MemberInfo | null>(`/api/members/by-phone?phone=${encodeURIComponent(phone)}`),
  getMemberTransactions: (memberId: string) =>
    request<MemberTransactionInfo[]>(`/api/members/${memberId}/transactions`),
  rechargeMember: (memberId: string, amount: number, payMethod: string, remark?: string) =>
    request<MemberTransactionInfo>(`/api/members/${memberId}/recharge`, {
      method: "POST",
      body: JSON.stringify({ amount, payMethod, remark }),
    }),

  // ===== 系统维护 =====
  getSysConfigs: (category?: string) =>
    request<SysConfigInfo[]>(`/api/sys/config?${category ? `category=${category}` : ""}`),
  updateSysConfig: (configKey: string, configValue: string) =>
    request<SysConfigInfo>("/api/sys/config", {
      method: "PUT",
      body: JSON.stringify({ configKey, configValue }),
    }),
  getCategories: () => request<ProductCategoryInfo[]>("/api/sys/categories"),
  createCategory: (name: string) =>
    request<{ id: string; name: string }>("/api/sys/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  createSubcategory: (categoryId: string, name: string) =>
    request<{ id: string; name: string }>("/api/sys/subcategories", {
      method: "POST",
      body: JSON.stringify({ categoryId, name }),
    }),
  getFlavorCategories: () => request<FlavorCategoryInfo[]>("/api/sys/flavors"),
  createFlavorCategory: (name: string, required: boolean, flavors: string[]) =>
    request<{ id: string; name: string }>("/api/sys/flavors", {
      method: "POST",
      body: JSON.stringify({ name, required, flavors }),
    }),
  getProducts: (dept?: string) =>
    request<ProductInfo[]>(`/api/sys/products?${dept ? `dept=${dept}` : ""}`),
  createProduct: (data: Record<string, unknown>) =>
    request<{ id: string; name: string }>("/api/sys/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProduct: (data: Record<string, unknown>) =>
    request<{ id: string }>("/api/sys/products", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getGiftRules: () => request<GiftRuleInfo[]>("/api/sys/gift-rules"),
  createGiftRule: (data: Record<string, unknown>) =>
    request<{ id: string }>("/api/sys/gift-rules", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateGiftRule: (id: string, data: Record<string, unknown>) =>
    request<{ id: string }>("/api/sys/gift-rules", {
      method: "PUT",
      body: JSON.stringify({ id, ...data }),
    }),
  getBookingManagers: () => request<BookingManagerInfo[]>("/api/sys/managers"),
  createBookingManager: (name: string, phone: string, commissionRate: number) =>
    request<{ id: string; name: string }>("/api/sys/managers", {
      method: "POST",
      body: JSON.stringify({ name, phone, commissionRate }),
    }),
  getThemes: (type?: string) =>
    request<ThemeTemplateInfo[]>(`/api/sys/themes?${type ? `type=${type}` : ""}`),
  createTheme: (data: { type: string; name: string; description?: string; content: string }) =>
    request<any>("/api/sys/themes", { method: "POST", body: JSON.stringify(data) }),
  applyTheme: (themeId: string) =>
    request<{ applied: boolean; type: string }>("/api/sys/apply-theme", {
      method: "POST",
      body: JSON.stringify({ themeId }),
    }),

  // 出品点
  getOutputPoints: () => request<any[]>("/api/sys/output-points"),
  saveOutputPoint: (data: Record<string, unknown>) =>
    data.id
      ? request<any>("/api/sys/output-points", { method: "PUT", body: JSON.stringify(data) })
      : request<any>("/api/sys/output-points", { method: "POST", body: JSON.stringify(data) }),

  // 员工人事
  getEmployees: () => request<any[]>("/api/sys/employees"),
  saveEmployee: (data: Record<string, unknown>) =>
    data.id
      ? request<any>("/api/sys/employees", { method: "PUT", body: JSON.stringify(data) })
      : request<any>("/api/sys/employees", { method: "POST", body: JSON.stringify(data) }),

  // 包厢设置
  getRoomsSettings: () => request<any[]>("/api/sys/rooms-settings"),
  saveRoomSetting: (data: Record<string, unknown>) =>
    data.id
      ? request<any>("/api/sys/rooms-settings", { method: "PUT", body: JSON.stringify(data) })
      : request<any>("/api/sys/rooms-settings", { method: "POST", body: JSON.stringify(data) }),
  deleteRoomSetting: (id: string) =>
    request<any>("/api/sys/rooms-settings", { method: "DELETE", body: JSON.stringify({ id }) }),

  // AI 助手
  aiChat: (messages: Array<{ role: string; content: string }>) =>
    request<{ reply: string }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),

  // 收银扩展：赠送/转房/账单
  giftOrder: (orderId: string, data: { productId: string; qty: number; managerId?: string; remark?: string }) =>
    request<any>(`/api/ktv/orders/${orderId}/gift`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  transferOrder: (orderId: string, toRoomId: string) =>
    request<any>(`/api/ktv/orders/${orderId}/transfer`, {
      method: "POST",
      body: JSON.stringify({ toRoomId }),
    }),
  getOrderBill: (orderId: string) =>
    request<any>(`/api/ktv/orders/${orderId}/bill`),

  // 出品历史
  getProductionHistory: (params: { dept?: string; category?: string; startDate?: string; endDate?: string; limit?: number }) =>
    request<any>(`/api/ktv/production-history?${new URLSearchParams(Object.entries(params).reduce((a, [k, v]) => { if (v) a[k] = String(v); return a; }, {} as Record<string, string>))}`),

  // 打印模板
  getPrintTemplates: (type?: string) =>
    request<any[]>(`/api/sys/print-templates?${type ? `type=${type}` : ""}`),
  savePrintTemplate: (data: Record<string, unknown>) =>
    data.id
      ? request<any>("/api/sys/print-templates", { method: "PUT", body: JSON.stringify(data) })
      : request<any>("/api/sys/print-templates", { method: "POST", body: JSON.stringify(data) }),
  deletePrintTemplate: (id: string) =>
    request<any>("/api/sys/print-templates", { method: "DELETE", body: JSON.stringify({ id }) }),

  // 财务分类查询
  getCategorySales: (startDate?: string, endDate?: string) =>
    request<any>(`/api/finance/category-sales?${startDate ? `startDate=${startDate}&` : ""}${endDate ? `endDate=${endDate}` : ""}`),
  getProductionDetail: (params: { dept?: string; category?: string; startDate?: string; endDate?: string }) =>
    request<any>(`/api/finance/production-detail?${new URLSearchParams(Object.entries(params).reduce((a, [k, v]) => { if (v) a[k] = String(v); return a; }, {} as Record<string, string>))}`),
};
