// API 统一响应辅助

import { NextResponse } from "next/server";
import type { ApiResp } from "./types";

export function ok<T>(data: T, msg: string = "success") {
  return NextResponse.json<ApiResp<T>>({ code: 200, msg, data });
}

export function fail(msg: string, code: number = 400) {
  return NextResponse.json<ApiResp<null>>({ code, msg, data: null }, { status: 200 });
}

export function parseError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
