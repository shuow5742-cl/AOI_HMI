import { RecipeDbRow } from "../types";

const BASE_URL = "http://127.0.0.1:30001";

type RobotMode = "mock" | "real";

export type RobotStatus = {
  mode: RobotMode;
  listening: boolean;
  host: string;
  paramPort: number;
  statusPort: number;
  paramClientConnected: boolean;
  statusClientConnected: boolean;
  lastStatusReport: string;
  lastAckMessage: string;
};

export type RobotPoseResult = {
  ok: boolean;
  pose?: {
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    rz: number;
  };
  poseText?: string;
  raw?: string;
  message?: string;
};

export async function fetchRecipesFromBackend(): Promise<RecipeDbRow[]> {
  const response = await fetch(`${BASE_URL}/recipes`);
  if (!response.ok) {
    throw new Error(`读取配方失败: ${response.status}`);
  }

  const data = await response.json();
  if (!data.ok || !Array.isArray(data.rows)) {
    throw new Error("后端返回格式错误");
  }

  return data.rows.map((row: any) => ({
    model: row.model ?? "",
    flag_ramp: row.flag_ramp ?? "0",
    row_n: row.row_n ?? "",
    col_n: row.col_n ?? "",
    dz_check: row.dz_check ?? "",
    plane_p1: row.plane_p1 ?? "",
    plane_p2: row.plane_p2 ?? "",
    plane_p3: row.plane_p3 ?? "",
    ng_p1: row.ng_p1 ?? "",
    ng_p2: row.ng_p2 ?? "",
    ng_p3: row.ng_p3 ?? "",
    ok_p1: row.ok_p1 ?? "",
    ok_p2: row.ok_p2 ?? "",
    ok_p3: row.ok_p3 ?? "",
    ramp_p1: row.ramp_p1 ?? "",
    ramp_p2: row.ramp_p2 ?? "",
    ramp_p3: row.ramp_p3 ?? "",
  }));
}

export async function saveRecipesToBackend(rows: RecipeDbRow[]) {
  const response = await fetch(`${BASE_URL}/recipes/save-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });

  if (!response.ok) {
    throw new Error(`保存配方失败: ${response.status}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.message || "保存失败");
  }

  return data;
}

export async function getRobotStatusFromBackend(): Promise<RobotStatus> {
  const response = await fetch(`${BASE_URL}/robot/status`);
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || `读取状态失败: ${response.status}`);
  }

  return data.robot as RobotStatus;
}

export async function setRobotModeBackend(mode: RobotMode): Promise<RobotStatus> {
  const response = await fetch(`${BASE_URL}/robot/mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || `切换模式失败: ${response.status}`);
  }

  return data.robot as RobotStatus;
}

export async function connectRobotBackend(_mode: RobotMode): Promise<RobotStatus> {
  const response = await fetch(`${BASE_URL}/robot/connect`, {
    method: "POST",
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || `启动监听失败: ${response.status}`);
  }

  return data.robot as RobotStatus;
}

export async function disconnectRobotBackend(): Promise<RobotStatus> {
  const response = await fetch(`${BASE_URL}/robot/disconnect`, {
    method: "POST",
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || `停止监听失败: ${response.status}`);
  }

  return data.robot as RobotStatus;
}

export async function clearRobotLogsBackend(): Promise<RobotStatus> {
  const response = await fetch(`${BASE_URL}/robot/clear-logs`, {
    method: "POST",
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || `清空日志失败: ${response.status}`);
  }

  return data.robot as RobotStatus;
}

export async function sendQueueToRobotBackend(messages: string[]) {
  const response = await fetch(`${BASE_URL}/robot/send-queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || data.message || `下发失败: ${response.status}`);
  }

  return data as {
    ok: true;
    mode: "mock" | "real";
    host: string;
    port: number;
    sentCount: number;
    results: Array<{ sent: string; ack: string }>;
  };
}

export async function getRobotCurrentPoseFromBackend(): Promise<RobotPoseResult> {
  const response = await fetch(`${BASE_URL}/robot/current-pose`);

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || `读取机械臂当前位置失败: ${response.status}`);
  }

  return data as RobotPoseResult;
}