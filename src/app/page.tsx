// 云边协同门店管理系统 — 主页面

"use client";

import { useState, useEffect } from "react";
import { AppShell, type ModuleKey } from "@/components/layout/AppShell";
import { LoginPage } from "@/components/public/LoginPage";
import { ApplyPage } from "@/components/public/ApplyPage";
import { JoinPage } from "@/components/public/JoinPage";
import { useAuth } from "@/store/auth-store";
import { useIndustry } from "@/store/industry-store";
// @ts-ignore
// KTV 业务
import { SystemModule } from "@/components/modules/SystemModule";
import { CashierModule } from "@/components/modules/CashierModule";
import { ProductionModule } from "@/components/modules/ProductionModule";
import { FinanceModule } from "@/components/modules/FinanceModule";
// 云端管理
import { DashboardModule } from "@/components/modules/DashboardModule";
import { StoresModule } from "@/components/modules/StoresModule";
import { ConfigModule } from "@/components/modules/ConfigModule";
import { SyncModule } from "@/components/modules/SyncModule";
import { ReportsModule } from "@/components/modules/ReportsModule";
import { AuditModule } from "@/components/modules/AuditModule";
// 更多
import { KtvRoomsModule } from "@/components/modules/KtvRoomsModule";
import { KtvOrderModule } from "@/components/modules/KtvOrderModule";
import { KtvCheckoutModule } from "@/components/modules/KtvCheckoutModule";
import { KtvReservationsModule } from "@/components/modules/KtvReservationsModule";
import { MembersModule } from "@/components/modules/MembersModule";
import { PosModule } from "@/components/modules/PosModule";

export default function Home() {
  const { user, modules, logout } = useAuth();
  const [active, setActive] = useState<ModuleKey>("cashier");
  const [showApply, setShowApply] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinStore, setJoinStore] = useState(0);
  const [joinCode, setJoinCode] = useState("");
  const { loadFromServer } = useIndustry();

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("apply")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowApply(true);
    } else if (sp.get("join") && sp.get("store")) {
       
      setJoinStore(Number(sp.get("store")));
       
      setJoinCode(sp.get("code") ?? "");
       
      setShowJoin(true);
    }
  }, []);

  // 门店申请页（公开）
  if (showApply) {
    return <ApplyPage onClose={() => { setShowApply(false); window.history.pushState({}, "", "/"); }} />;
  }
  // 员工入职页（公开）
  if (showJoin) {
    return <JoinPage storeId={joinStore} joinCode={joinCode}
      onClose={() => { setShowJoin(false); window.history.pushState({}, "", "/"); }} />;
  }

  // 未登录 → 只显示登录页（纯净，无任何其他界面）
  if (!user) {
    return <LoginPage
      onLogined={(defaultModule) => setActive(defaultModule as ModuleKey)}
      onApply={() => setShowApply(true)}
    />;
  }

  // 已登录 → 按权限显示对应界面
  const effectiveActive = (modules.includes(active) ? active : modules[0]) as ModuleKey;

  return (
    <AppShell
      active={effectiveActive}
      onNavigate={setActive}
      allowedModules={modules}
      onLogout={logout}
    >
      {effectiveActive === "system" && <SystemModule />}
      {effectiveActive === "cashier" && <CashierModule />}
      {effectiveActive === "production" && <ProductionModule />}
      {effectiveActive === "finance" && <FinanceModule />}
      {effectiveActive === "dashboard" && <DashboardModule />}
      {effectiveActive === "stores" && <StoresModule />}
      {effectiveActive === "config" && <ConfigModule />}
      {effectiveActive === "sync" && <SyncModule />}
      {effectiveActive === "reports" && <ReportsModule />}
      {effectiveActive === "audit" && <AuditModule />}
      {effectiveActive === "ktv-rooms" && <KtvRoomsModule />}
      {effectiveActive === "ktv-order" && <KtvOrderModule />}
      {effectiveActive === "ktv-checkout" && <KtvCheckoutModule />}
      {effectiveActive === "ktv-reservations" && <KtvReservationsModule />}
      {effectiveActive === "members" && <MembersModule />}
      {effectiveActive === "pos" && <PosModule />}
    </AppShell>
  );
}
