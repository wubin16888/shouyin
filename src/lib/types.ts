// 前后端共享类型定义

export interface StoreInfo {
  id: string;
  storeId: number;
  storeName: string;
  storeToken: string;
  region: string;
  status: number;
  wsStatus: "online" | "offline";
  lastConnectedAt: string | null;
  createdAt: string;
  pendingConflicts?: number;
  lastSyncAt?: string | null;
  rateLimit?: RateLimitInfo | null;
}

export interface RateLimitInfo {
  storeId: number;
  readPerSec: number;
  writePerSec: number;
  syncPerSec: number;
  authPerSec: number;
  burstAllowance: number;
  enabled: boolean;
}

export interface StoreConfigInfo {
  id: string;
  storeId: number;
  configKey: string;
  configValue: string;
  valueType: "string" | "number" | "boolean" | "json";
  description: string | null;
  version: number;
  updatedAt: string;
}

export interface ConfigHistoryInfo {
  id: string;
  storeId: number;
  configKey: string;
  oldValue: string | null;
  newValue: string;
  version: number;
  operator: string;
  isRollback: boolean;
  sourceVersion: number | null;
  createdAt: string;
}

export interface OrderInfo {
  id: string;
  orderId: number;
  storeId: number;
  orderNo: string;
  totalAmount: number;
  status: number; // 1:待支付 2:已支付 3:已取消
  payMethod: string;
  itemCount: number;
  syncVersion: number;
  items: string;
  createdAt: string;
  store?: { storeName: string };
}

export interface SyncLogInfo {
  id: string;
  storeId: number;
  syncType: string;
  status: "success" | "failed" | "pending";
  recordCount: number;
  durationMs: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  store?: { storeName: string };
}

export interface SyncConflictInfo {
  id: string;
  storeId: number;
  orderId: number;
  localVersion: number;
  cloudVersion: number;
  localData: string;
  cloudData: string | null;
  conflictReason: string | null;
  resolveStatus: "pending" | "resolved";
  resolveMethod: string | null;
  retryCount: number;
  createdAt: string;
  resolvedAt: string | null;
  store?: { storeName: string };
}

export interface AuditLogInfo {
  id: string;
  storeId: number;
  userName: string;
  operationType: string;
  resourceType: string | null;
  resourceId: string | null;
  changes: string | null;
  status: string;
  ipAddress: string | null;
  createdAt: string;
  store?: { storeName: string };
}

export interface WebsocketEventInfo {
  id: string;
  storeId: number;
  eventType: "connect" | "disconnect" | "reconnect";
  clientIp: string | null;
  sessionDuration: number | null;
  pendingMessages: number;
  reason: string | null;
  createdAt: string;
  store?: { storeName: string };
}

export interface ChainReportDailyInfo {
  reportDate: string;
  storeId: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalRefunds: number;
  totalDiscountAmount: number;
  memberCardPayments: number;
  memberCardAmount: number;
  store?: { storeName: string };
}

export interface DishInfo {
  id: string;
  storeId: number;
  name: string;
  category: string;
  price: number;
  roomPrice: number;
  hallPrice: number;
  memberPrice: number;
  costPrice: number;
  unit: string;
  sortOrder: number;
  status: number;
  imageUrl: string | null;
}

// —— 聚合结果 ——
export interface DashboardSummary {
  totalStores: number;
  onlineStores: number;
  offlineStores: number;
  todayRevenue: number;
  todayOrders: number;
  pendingConflicts: number;
  failedSyncsLast24h: number;
  totalConfigs: number;
  revenueTrend: Array<{ date: string; revenue: number; orders: number }>;
  storeStatusList: Array<{
    storeId: number;
    storeName: string;
    region: string;
    wsStatus: string;
    lastConnectedAt: string | null;
    todayRevenue: number;
    todayOrders: number;
    pendingConflicts: number;
  }>;
  regionDistribution: Array<{ region: string; count: number }>;
}

export interface SyncOverview {
  totalSyncs: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  avgDurationMs: number;
  pendingConflicts: number;
  resolvedConflicts: number;
  recentLogs: SyncLogInfo[];
  recentConflicts: SyncConflictInfo[];
  typeDistribution: Array<{ syncType: string; count: number }>;
}

export interface ReportSummary {
  dateRange: { from: string; to: string };
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  storeRanking: Array<{
    storeId: number;
    storeName: string;
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
  }>;
  dailyTrend: Array<{ date: string; revenue: number; orders: number }>;
  regionSummary: Array<{ region: string; totalRevenue: number; totalOrders: number }>;
}

export interface AuditSummary {
  total: number;
  successCount: number;
  failedCount: number;
  operationDistribution: Array<{ operationType: string; count: number }>;
  logs: AuditLogInfo[];
}

// —— API 统一响应 ——
export interface ApiResp<T> {
  code: number;
  msg: string;
  data: T;
}

// ========================================
// KTV 业务类型
// ========================================

export interface KtvRoomInfo {
  id: string;
  storeId: number;
  roomNo: string;
  roomName: string;
  roomType: string;
  capacity: number;
  hourlyRate: number;
  minSpend: number;
  status: "idle" | "in_use" | "cleaning" | "reserved" | "seated" | "maintenance" | "checkout";
  openedAt: string | null;
  currentOrderId: string | null;
  // 进行中订单的实时信息
  currentOrder?: {
    id: string;
    orderNo: string;
    customerName: string | null;
    customerCount: number;
    productFee: number;
    itemsCount: number;
  } | null;
}

export interface KtvProductInfo {
  id: string;
  storeId: number;
  name: string;
  category: string;
  price: number;
  roomPrice: number;
  hallPrice: number;
  memberPrice: number;
  costPrice: number;
  unit: string;
  sortOrder: number;
  cost: number;
  stock: number;
  barcode: string | null;
  status: number;
}

export interface KtvOrderItemInfo {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  roomPrice: number;
  hallPrice: number;
  memberPrice: number;
  costPrice: number;
  unit: string;
  sortOrder: number;
  qty: number;
  status: "pending" | "delivered" | "cancelled";
  deliveredAt: string | null;
  createdAt: string;
}

export interface KtvOrderInfo {
  id: string;
  storeId: number;
  orderNo: string;
  roomId: string;
  roomNo: string;
  roomType: string;
  hourlyRate: number;
  customerName: string | null;
  customerCount: number;
  phone: string | null;
  openedAt: string;
  closedAt: string | null;
  durationMinutes: number;
  roomFee: number;
  productFee: number;
  discount: number;
  totalAmount: number;
  payMethod: string | null;
  status: "open" | "paid" | "cancelled";
  memberId: string | null;
  items?: KtvOrderItemInfo[];
  member?: { name: string; cardNo: string; discount: number } | null;
}

export interface KtvReservationInfo {
  id: string;
  storeId: number;
  roomId: string | null;
  roomNo: string | null;
  customerName: string;
  phone: string;
  partySize: number;
  startAt: string;
  endAt: string;
  status: "pending" | "confirmed" | "arrived" | "cancelled" | "noshow";
  remark: string | null;
  createdAt: string;
}

export interface MemberInfo {
  id: string;
  storeId: number;
  cardNo: string;
  name: string;
  phone: string;
  level: string;
  balance: number;
  points: number;
  totalSpent: number;
  discount: number;
  status: number;
  createdAt: string;
}

export interface MemberTransactionInfo {
  id: string;
  memberId: string;
  type: "recharge" | "consume" | "refund";
  amount: number;
  pointsDelta: number;
  balanceAfter: number;
  payMethod: string | null;
  remark: string | null;
  relatedOrderNo: string | null;
  createdAt: string;
}

export interface KtvDashboardSummary {
  totalRooms: number;
  idleRooms: number;
  inUseRooms: number;
  cleaningRooms: number;
  reservedRooms: number;
  todayRevenue: number;
  todayOrders: number;
  todayCheckouts: number;
  pendingReservations: number;
  totalMembers: number;
  todayMemberRecharge: number;
  hourlyTrend: Array<{ hour: string; revenue: number; orders: number }>;
  roomTypeStats: Array<{ roomType: string; count: number; inUse: number }>;
}

// ========================================
// 系统维护 / 动态配置 类型
// ========================================

export interface SysConfigInfo {
  id: string;
  storeId: number;
  configKey: string;
  configValue: string;
  category: string;
  description: string | null;
  updatedAt: string;
}

export interface ProductCategoryInfo {
  id: string;
  storeId: number;
  name: string;
  sortOrder: number;
  subcategories: { id: string; name: string }[];
  productCount: number;
}

export interface FlavorCategoryInfo {
  id: string;
  storeId: number;
  name: string;
  required: boolean;
  flavors: { id: string; name: string; priceDelta: number }[];
}

export interface ProductInfo {
  id: string;
  storeId: number;
  name: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  price: number;
  roomPrice: number;
  hallPrice: number;
  memberPrice: number;
  costPrice: number;
  unit: string;
  sortOrder: number;
  cost: number;
  stock: number;
  barcode: string | null;
  imageUrl: string | null;
  outputDept: string; // bar/kitchen/fruit/outside
  isPackage: boolean;
  /// 是否计入最低消费（不勾选的物品点了也不算低消）
  countToMinSpend: boolean;
  /// 套餐价格（isPackage=true 时用，子商品单价在账单中隐藏）
  packagePrice: number;
  /// 套餐子项（JSON 字符串: [{productId, name, qty}]）
  packageItems: string | null;
  status: number; // 1在售 0停售 2估清
  pinyin: string | null;
  flavors: { id: string; name: string; categoryName: string }[];
}

export interface GiftRuleInfo {
  id: string;
  name: string;
  condProductName: string;
  condQty: number;
  cumulative: boolean;
  giftProductName: string;
  giftQty: number;
  deliveries: string | null;
  timeLimit: boolean;
  startTime: string | null;
  endTime: string | null;
  roomLimit: boolean;
  roomTypes: string | null;
  enabled: boolean;
}

export interface BookingManagerInfo {
  id: string;
  name: string;
  phone: string | null;
  commissionRate: number;
  status: number;
}

export interface ThemeTemplateInfo {
  id: string;
  type: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  content: string;
  isOfficial: boolean;
  useCount: number;
  createdAt: string;
}

// 扩展 KtvRoomInfo
export interface KtvRoomInfoV2 extends Omit<KtvRoomInfo, "status"> {
  status: "idle" | "reserved" | "seated" | "in_use" | "cleaning" | "maintenance" | "checkout";
  area: string | null;
  bookingManagerName?: string | null;
}

// 扩展 KtvOrderItemInfo
export interface KtvOrderItemInfoV2 extends Omit<KtvOrderItemInfo, "status"> {
  status: "pending" | "printed" | "delivered" | "cancelled";
  flavors: string | null;
  outputDept: string;
  isGift: boolean;
  giftRemark: string | null;
  printedAt: string | null;
}

// 扩展 KtvOrderInfo
export interface KtvOrderInfoV2 extends Omit<KtvOrderInfo, "items"> {
  bookingManagerId: string | null;
  bookingManagerName: string | null;
  items?: KtvOrderItemInfoV2[];
}

// 房态颜色配置
export interface RoomStatusColors {
  idle: string;
  reserved: string;
  seated: string;
  in_use: string;
  cleaning: string;
  maintenance: string;
  checkout: string;
}

// 房态显示字段配置
export interface RoomDisplayFields {
  roomNo: boolean;
  roomName: boolean;
  roomType: boolean;
  area: boolean;
  bookingManager: boolean;
  customerName: boolean;
  customerCount: boolean;
  consume: boolean;
  openedAt: boolean;
  duration: boolean;
}
