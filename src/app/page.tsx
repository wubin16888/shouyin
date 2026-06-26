// 云边协同门店管理系统 — 主页面

"use client";

import { useState, useEffect } from "react";
import { AppShell, type ModuleKey } from "@/components/layout/AppShell";
import { ApplyPage } from "@/components/public/ApplyPage";
import { JoinPage } from "@/components/public/JoinPage";
import { LoginPage } from "@/components/public/LoginPage";
// KTV 业务（4 核心模块）
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
// 更多功能
import { KtvRoomsModule } from "@/components/modules/KtvRoomsModule";
import { KtvOrderModule } from "@/components/modules/KtvOrderModule";
import { KtvCheckoutModule } from "@/components/modules/KtvCheckoutModule";
import { KtvReservationsModule } from "@/components/modules/KtvReservationsModule";
import { MembersModule } from "@/components/modules/MembersModule";
import { PosModule } from "@/components/modules/PosModule";

export default function Home() {
  const [active, setActive] = useState<ModuleKey>("cashier");
  const [mode, setMode] = useState<"main" | "apply" | "join" | "login">("main");
  const [joinStore, setJoinStore] = useState<number>(0);
  const [joinCode, setJoinCode] = useState<string>("");

  useEffect(() => {
    // 客户端读取 URL 参数（避免 useSearchParams 的 Suspense 要求）
    const sp = new URLSearchParams(window.location.search);
    const apply = sp.get("apply");
    const join = sp.get("join");
    const login = sp.get("login");
    const store = sp.get("store");
    const code = sp.get("code");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (apply) setMode("apply");
    else if (join && store) {
       
      setJoinStore(Number(store));
       
      setJoinCode(code ?? "");
       
      setMode("join");
    } else if (login) {
       
      setMode("login");
    } else {
       
      setMode("main");
    }
  }, []);

  // 公开页面模式
  if (mode === "apply") {
    return <ApplyPage onClose={() => { setMode("main"); window.history.pushState({}, "", "/"); }} />;
  }
  if (mode === "join") {
    return <JoinPage storeId={joinStore} joinCode={joinCode}
      onClose={() => { setMode("main"); window.history.pushState({}, "", "/"); }} />;
  }
  if (mode === "login") {
    return <LoginPage
      onClose={() => { setMode("main"); window.history.pushState({}, "", "/"); }}
      onLogined={(defaultModule) => {
        setMode("main");
        setActive(defaultModule as ModuleKey);
        window.history.pushState({}, "", "/");
      }}
    />;
  }

  return (
    <AppShell active={active} onNavigate={setActive}>
      {active === "system" && <SystemModule />}
      {active === "cashier" && <CashierModule />}
      {active === "production" && <ProductionModule />}
      {active === "finance" && <FinanceModule />}
      {active === "dashboard" && <DashboardModule />}
      {active === "stores" && <StoresModule />}
      {active === "config" && <ConfigModule />}
      {active === "sync" && <SyncModule />}
      {active === "reports" && <ReportsModule />}
      {active === "audit" && <AuditModule />}
      {active === "ktv-rooms" && <KtvRoomsModule />}
      {active === "ktv-order" && <KtvOrderModule />}
      {active === "ktv-checkout" && <KtvCheckoutModule />}
      {active === "ktv-reservations" && <KtvReservationsModule />}
      {active === "members" && <MembersModule />}
      {active === "pos" && <PosModule />}
    </AppShell>
  );
}
