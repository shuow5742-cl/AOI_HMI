import { RuntimeInfo } from "../types";

type RuntimePageProps = {
  runtimeInfo: RuntimeInfo;
  recipeSummary: {
    row_count: string;
    col_count: string;
    flag_ramp: string;
  };
};

export function RuntimePage({ runtimeInfo, recipeSummary }: RuntimePageProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">当前配方</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>当前型号：{runtimeInfo.currentRecipe || "未选择"}</p>
            <p>
              行列：{recipeSummary.row_count || "-"} x {recipeSummary.col_count || "-"}
            </p>
            <p>斜面检：{recipeSummary.flag_ramp || "-"}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">机械臂状态</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>连接状态：{runtimeInfo.robotStatus}</p>
            <p>最近反馈：{runtimeInfo.lastRobotMessage}</p>
            <p>下发状态：{runtimeInfo.sendStatus}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">报警状态</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>当前报警：{runtimeInfo.currentAlarm}</p>
            <p>最近报警：无</p>
            <p>处理状态：正常</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">运行过程信息</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>最近动作：{runtimeInfo.lastAction}</p>
          <p>当前配方：{runtimeInfo.currentRecipe || "未选择"}</p>
          <p>等待建立机械臂连接</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">当前任务摘要</h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
          <div className="rounded-lg bg-gray-100 p-3">
            <p className="font-medium">配方下发</p>
            <p className="mt-1">{runtimeInfo.sendStatus}</p>
          </div>
          <div className="rounded-lg bg-gray-100 p-3">
            <p className="font-medium">通信状态</p>
            <p className="mt-1">{runtimeInfo.robotStatus}</p>
          </div>
          <div className="rounded-lg bg-gray-100 p-3">
            <p className="font-medium">系统状态</p>
            <p className="mt-1">正常</p>
          </div>
        </div>
      </div>
    </div>
  );
}