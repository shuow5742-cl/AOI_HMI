import { CommInfo } from "../types";
import { RobotStatus } from "../services/backend";
import { mapRobotStatusToChinese } from "../services/robotStatusMap";

type AckResultItem = {
  sent: string;
  ack: string;
};

type CommPageProps = {
  commInfo: CommInfo;
  currentMode: "mock" | "real";
  robotStatus: RobotStatus;
  onSwitchToMock: () => void;
  onSwitchToReal: () => void;
  onTestRust: () => void;
  onConnectRobot: () => void;
  onDisconnectRobot: () => void;
  onClearLogs: () => void;
  messageQueue: string[];
  ackResults: AckResultItem[];
};

export function CommPage({
  commInfo,
  currentMode,
  robotStatus,
  onSwitchToMock,
  onSwitchToReal,
  onTestRust,
  onConnectRobot,
  onDisconnectRobot,
  onClearLogs,
  messageQueue,
  ackResults,
}: CommPageProps) {
  const robotStatusZh = mapRobotStatusToChinese(robotStatus.lastStatusReport);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">模式切换</h3>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700">
            当前模式：{currentMode === "real" ? "真实模式" : "模拟模式"}
          </div>

          <button
            className={`rounded-lg px-4 py-2 text-sm ${
              currentMode === "mock"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={onSwitchToMock}
          >
            切换到模拟模式
          </button>

          <button
            className={`rounded-lg px-4 py-2 text-sm ${
              currentMode === "real"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={onSwitchToReal}
          >
            切换到真实模式
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">上位机TCP服务器状态</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>监听状态：{robotStatus.listening ? "监听中" : "未启动"}</p>
            <p>参数下发端口：{robotStatus.paramPort}</p>
            <p>状态上报端口：{robotStatus.statusPort}</p>
            <p>参数端连接：{robotStatus.paramClientConnected ? "已连接" : "未连接"}</p>
            <p>状态端连接：{robotStatus.statusClientConnected ? "已连接" : "未连接"}</p>
            <p>最近状态上报原文：{robotStatus.lastStatusReport || "无"}</p>
            <p>最近状态上报中文：{robotStatusZh}</p>
            <p>最近ACK：{robotStatus.lastAckMessage || "无"}</p>
            <p>当前显示状态：{commInfo.connectionStatus}</p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              onClick={onConnectRobot}
            >
              启动监听
            </button>
            <button
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              onClick={onDisconnectRobot}
            >
              停止监听
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">调试操作</h3>
          <div className="space-y-3">
            <button className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">
              模拟下发配方
            </button>
            <button
              className="w-full rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-800"
              onClick={onClearLogs}
            >
              清空日志
            </button>
            <button
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
              onClick={onTestRust}
            >
              测试 Rust 调用
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">最近发送</h3>
        <div className="rounded-lg bg-gray-100 p-3 font-mono text-sm text-gray-800 break-all">
          {commInfo.lastSentMessage || "暂无发送记录"}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">最近接收</h3>
        <div className="rounded-lg bg-gray-100 p-3 font-mono text-sm text-gray-800 break-all">
          {commInfo.lastReceivedMessage || "暂无接收记录"}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">当前型号下发消息队列</h3>
        <div className="max-h-[320px] overflow-y-auto rounded-lg bg-gray-100 p-3 font-mono text-sm text-gray-800">
          {messageQueue.length === 0 ? (
            <p>暂无待下发消息</p>
          ) : (
            <div className="space-y-2">
              {messageQueue.map((msg, index) => (
                <div key={`${index}-${msg}`} className="rounded bg-white px-3 py-2 break-all">
                  <span className="mr-2 text-gray-500">{index + 1}.</span>
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">逐条确认结果列表</h3>
        <div className="max-h-[360px] overflow-y-auto rounded-lg bg-gray-100 p-3 text-sm text-gray-800">
          {ackResults.length === 0 ? (
            <p>暂无确认结果</p>
          ) : (
            <div className="space-y-3">
              {ackResults.map((item, index) => (
                <div key={`${index}-${item.sent}`} className="rounded bg-white p-3">
                  <div className="mb-2 font-semibold text-gray-700">第 {index + 1} 条</div>
                  <div className="space-y-2">
                    <div>
                      <div className="mb-1 text-xs text-gray-500">发送</div>
                      <div className="rounded bg-gray-50 px-2 py-2 font-mono break-all">
                        {item.sent}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs text-gray-500">确认</div>
                      <div className="rounded bg-gray-50 px-2 py-2 font-mono break-all">
                        {item.ack}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}