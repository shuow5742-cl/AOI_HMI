import { useEffect, useState } from "react";
import { MainPage } from "./pages/MainPage";
import { RecipeDbPage } from "./pages/RecipeDbPage";
import { RecipePage } from "./pages/RecipePage";
import { CommPage } from "./pages/CommPage";
import { RuntimePage } from "./pages/RuntimePage";
import {
  PageKey,
  RuntimeInfo,
  CommInfo,
  RecipeDbRow,
} from "./types";
import { greetFromRust } from "./services/tauri";
import {
  buildRecipeMessageQueue,
  validateRecipeForSend,
} from "./services/protocol";
import {
  fetchRecipesFromBackend,
  saveRecipesToBackend,
  sendQueueToRobotBackend,
  getRobotStatusFromBackend,
  connectRobotBackend,
  disconnectRobotBackend,
  setRobotModeBackend,
  clearRobotLogsBackend,
  RobotStatus,
} from "./services/backend";
import { mapRobotStatusToChinese } from "./services/robotStatusMap";

type AckResultItem = {
  sent: string;
  ack: string;
};

type RobotMode = "mock" | "real";

const emptyRobotStatus: RobotStatus = {
  mode: "mock",
  listening: false,
  host: "0.0.0.0",
  paramPort: 30088,
  statusPort: 20066,
  paramClientConnected: false,
  statusClientConnected: false,
  lastStatusReport: "",
  lastAckMessage: "",
};

function App() {
  const [page, setPage] = useState<PageKey>("main");
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [ackResults, setAckResults] = useState<AckResultItem[]>([]);
  const [robotMode, setRobotMode] = useState<RobotMode>("mock");
  const [robotStatus, setRobotStatus] = useState<RobotStatus>(emptyRobotStatus);

  const [commInfo, setCommInfo] = useState<CommInfo>({
    connectionStatus: "未监听",
    lastSentMessage: "",
    lastReceivedMessage: "",
  });

  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo>({
    currentRecipe: "",
    sendStatus: "未开始",
    robotStatus: "未监听",
    lastRobotMessage: "无",
    currentAlarm: "无",
    lastAction: "未操作",
  });

  const [recipeDbRows, setRecipeDbRows] = useState<RecipeDbRow[]>([]);
  const [selectedRecipeDbRowIndex, setSelectedRecipeDbRowIndex] = useState(0);
  const [editRow, setEditRow] = useState<RecipeDbRow | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const [rows, robot] = await Promise.all([
          fetchRecipesFromBackend(),
          getRobotStatusFromBackend(),
        ]);

        setRecipeDbRows(rows);
        setRobotMode(robot.mode);
        setRobotStatus(robot);
        setCommInfo((prev) => ({
          ...prev,
          connectionStatus: robot.listening ? "监听中" : "未监听",
          lastReceivedMessage: `已从 SQLite 读取 ${rows.length} 条配方`,
        }));
        setRuntimeInfo((prev) => ({
          ...prev,
          robotStatus: robot.listening ? "监听中" : "未监听",
          lastAction: `已从 SQLite 读取 ${rows.length} 条配方`,
        }));
      } catch (error) {
        setCommInfo((prev) => ({
          ...prev,
          lastReceivedMessage: `初始化失败：${String(error)}`,
        }));
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const robot = await getRobotStatusFromBackend();
        setRobotMode(robot.mode);
        setRobotStatus(robot);

        const mappedStatus = mapRobotStatusToChinese(robot.lastStatusReport);

        setCommInfo((prev) => ({
          ...prev,
          connectionStatus: robot.listening ? "监听中" : "未监听",
          lastReceivedMessage: robot.lastStatusReport
            ? `机械臂状态：${mappedStatus}`
            : prev.lastReceivedMessage,
        }));

        setRuntimeInfo((prev) => ({
          ...prev,
          robotStatus: robot.listening ? "监听中" : "未监听",
          lastRobotMessage: robot.lastStatusReport ? mappedStatus : prev.lastRobotMessage,
          currentAlarm:
            robot.lastStatusReport && mappedStatus !== "无" ? mappedStatus : prev.currentAlarm,
        }));
      } catch {
        // ignore
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    if (page === "main") return "主检测页面";
    if (page === "recipe_db") return "配方数据库";
    if (page === "recipe_edit") return "配方编辑 / 标定";
    if (page === "comm") return "通信联调";
    return "运行状态";
  };

  const handleSwitchToMock = async () => {
    try {
      const robot = await setRobotModeBackend("mock");
      setRobotMode(robot.mode);
      setRobotStatus(robot);
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: "已切换到模拟模式",
      }));
    } catch (error) {
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: `切换到模拟模式失败：${String(error)}`,
      }));
    }
  };

  const handleSwitchToReal = async () => {
    try {
      const robot = await setRobotModeBackend("real");
      setRobotMode(robot.mode);
      setRobotStatus(robot);
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: "已切换到真实模式",
      }));
    } catch (error) {
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: `切换到真实模式失败：${String(error)}`,
      }));
    }
  };

  const handleConnectRobot = async () => {
    try {
      const robot = await connectRobotBackend(robotMode);
      setRobotStatus(robot);
      setCommInfo((prev) => ({
        ...prev,
        connectionStatus: robot.listening ? "监听中" : "未监听",
        lastReceivedMessage: `已启动监听：参数端${robot.paramPort} / 状态端${robot.statusPort}`,
      }));
      setRuntimeInfo((prev) => ({
        ...prev,
        robotStatus: robot.listening ? "监听中" : "未监听",
        lastAction: "已启动上位机TCP监听",
      }));
    } catch (error) {
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: `启动监听失败：${String(error)}`,
      }));
    }
  };

  const handleDisconnectRobot = async () => {
    try {
      const robot = await disconnectRobotBackend();
      setRobotStatus(robot);
      setCommInfo((prev) => ({
        ...prev,
        connectionStatus: robot.listening ? "监听中" : "未监听",
        lastReceivedMessage: "已停止监听",
      }));
      setRuntimeInfo((prev) => ({
        ...prev,
        robotStatus: robot.listening ? "监听中" : "未监听",
        lastAction: "已停止上位机TCP监听",
      }));
    } catch (error) {
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: `停止监听失败：${String(error)}`,
      }));
    }
  };

  const handleClearLogs = async () => {
    try {
      const robot = await clearRobotLogsBackend();
      setRobotStatus(robot);
      setMessageQueue([]);
      setAckResults([]);
      setCommInfo((prev) => ({
        ...prev,
        lastSentMessage: "",
        lastReceivedMessage: "日志已清空",
      }));
      setRuntimeInfo((prev) => ({
        ...prev,
        lastRobotMessage: "无",
        currentAlarm: "无",
        lastAction: "已清空通信日志",
      }));
    } catch (error) {
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: `清空日志失败：${String(error)}`,
      }));
    }
  };

  const handleSaveRecipe = () => {
    if (!editRow) return;

    setRecipeDbRows((prev) =>
      prev.map((row, index) =>
        index === selectedRecipeDbRowIndex ? { ...editRow } : row,
      ),
    );

    setRuntimeInfo((prev) => ({
      ...prev,
      currentRecipe: editRow.model,
      lastAction: `已保存到表格：${editRow.model || "未命名型号"}`,
    }));
  };

  const handleSendRecipe = async () => {
    if (!editRow) {
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: "下发失败：当前没有可编辑的型号",
      }));
      setPage("comm");
      return;
    }

    if (robotMode === "real") {
      if (!robotStatus.listening) {
        setCommInfo((prev) => ({
          ...prev,
          lastReceivedMessage: "下发失败：上位机TCP服务器未启动，请先启动监听",
        }));
        setPage("comm");
        return;
      }

      if (!robotStatus.paramClientConnected) {
        setCommInfo((prev) => ({
          ...prev,
          lastReceivedMessage: "下发失败：参数下发端口30088未连接机械臂",
        }));
        setPage("comm");
        return;
      }
    }

    const validationErrors = validateRecipeForSend(editRow);
    if (validationErrors.length > 0) {
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: `下发校验失败：${validationErrors.join("；")}`,
      }));
      setPage("comm");
      return;
    }

    if (robotMode === "real") {
      const confirmed = window.confirm(
        `当前为真实模式，确认要将型号 ${editRow.model} 下发到机械臂吗？`,
      );
      if (!confirmed) {
        setCommInfo((prev) => ({
          ...prev,
          lastReceivedMessage: "已取消真实模式下发",
        }));
        setPage("comm");
        return;
      }
    }

    const queue = buildRecipeMessageQueue(editRow);
    setMessageQueue(queue);
    setAckResults([]);
    setPage("comm");

    setCommInfo((prev) => ({
      ...prev,
      lastSentMessage: queue[0] || "",
      lastReceivedMessage: "正在发送到机械臂...",
    }));
    setRuntimeInfo((prev) => ({
      ...prev,
      currentRecipe: editRow.model,
      sendStatus: "发送中",
      lastAction: `正在下发型号：${editRow.model}`,
    }));

    try {
      const result = await sendQueueToRobotBackend(queue);
      const lastAck =
        result.results.length > 0
          ? result.results[result.results.length - 1].ack
          : "无确认";

      setAckResults(result.results);
      setCommInfo((prev) => ({
        ...prev,
        lastSentMessage: queue[queue.length - 1] || queue[0] || "",
        lastReceivedMessage: `机械臂确认完成，共 ${result.sentCount} 条，最后确认：${lastAck}`,
      }));
      setRuntimeInfo((prev) => ({
        ...prev,
        currentRecipe: editRow.model,
        sendStatus: "下发成功",
        lastRobotMessage: lastAck,
        lastAction: `型号 ${editRow.model} 下发成功`,
      }));
    } catch (error) {
      setAckResults([]);
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: `机械臂下发失败：${String(error)}`,
      }));
      setRuntimeInfo((prev) => ({
        ...prev,
        currentRecipe: editRow.model,
        sendStatus: "下发失败",
        lastAction: `型号 ${editRow.model} 下发失败`,
      }));
    }
  };

  const handleTestRust = async () => {
    try {
      const result = await greetFromRust("上位机");
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: result,
      }));
    } catch (error) {
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: `Rust 调用失败：${String(error)}`,
      }));
    }
  };

  const handleRecipeDbCellChange = (
    rowIndex: number,
    key: keyof RecipeDbRow,
    value: string,
  ) => {
    setRecipeDbRows((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, [key]: value } : row,
      ),
    );
  };

  const handleAddRecipeDbRow = () => {
    setRecipeDbRows((prev) => [
      ...prev,
      {
        model: "",
        flag_ramp: "0",
        row_n: "",
        col_n: "",
        dz_check: "",
        plane_p1: "",
        plane_p2: "",
        plane_p3: "",
        ng_p1: "",
        ng_p2: "",
        ng_p3: "",
        ok_p1: "",
        ok_p2: "",
        ok_p3: "",
        ramp_p1: "",
        ramp_p2: "",
        ramp_p3: "",
      },
    ]);
    setSelectedRecipeDbRowIndex(recipeDbRows.length);
  };

  const handleDeleteRecipeDbRow = () => {
    setRecipeDbRows((prev) =>
      prev.filter((_, index) => index !== selectedRecipeDbRowIndex),
    );
    setSelectedRecipeDbRowIndex(0);
  };

  const handleSaveRecipeDb = async () => {
    try {
      await saveRecipesToBackend(recipeDbRows);
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: "配方数据库已保存到 SQLite",
      }));
    } catch (error) {
      setCommInfo((prev) => ({
        ...prev,
        lastReceivedMessage: `保存数据库失败：${String(error)}`,
      }));
    }
  };

  const handleLoadRecipeFromDbRow = () => {
    const row = recipeDbRows[selectedRecipeDbRowIndex];
    if (!row) return;

    setEditRow({ ...row });
    setRuntimeInfo((prev) => ({
      ...prev,
      currentRecipe: row.model,
      lastAction: `已从数据库行加载型号：${row.model}`,
    }));
  };

  const handleEditFieldChange = (key: keyof RecipeDbRow, value: string) => {
    setEditRow((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  };

  const handleCapturePose = (key: keyof RecipeDbRow) => {
    const mockPose = "100,200,300,0,0,180";
    setEditRow((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: mockPose };
    });
    setCommInfo((prev) => ({
      ...prev,
      lastReceivedMessage: `模拟当前位置已写入 ${String(key)} -> ${mockPose}`,
    }));
  };

  const renderPageContent = () => {
    if (page === "main") return <MainPage />;

    if (page === "recipe_db") {
      return (
        <RecipeDbPage
          rows={recipeDbRows}
          selectedRowIndex={selectedRecipeDbRowIndex}
          onSelectRow={setSelectedRecipeDbRowIndex}
          onAddRow={handleAddRecipeDbRow}
          onDeleteRow={handleDeleteRecipeDbRow}
          onSaveAll={handleSaveRecipeDb}
          onLoadToEditor={() => {
            handleLoadRecipeFromDbRow();
            setPage("recipe_edit");
          }}
          onCellChange={handleRecipeDbCellChange}
        />
      );
    }

    if (page === "recipe_edit") {
      return (
        <RecipePage
          editRow={editRow}
          onFieldChange={handleEditFieldChange}
          onSaveToDb={handleSaveRecipe}
          onSendRecipe={handleSendRecipe}
          onCapturePose={handleCapturePose}
        />
      );
    }

    if (page === "comm") {
      return (
        <CommPage
          commInfo={commInfo}
          currentMode={robotMode}
          robotStatus={robotStatus}
          onSwitchToMock={handleSwitchToMock}
          onSwitchToReal={handleSwitchToReal}
          onTestRust={handleTestRust}
          onConnectRobot={handleConnectRobot}
          onDisconnectRobot={handleDisconnectRobot}
          onClearLogs={handleClearLogs}
          messageQueue={messageQueue}
          ackResults={ackResults}
        />
      );
    }

    return (
      <RuntimePage
        runtimeInfo={runtimeInfo}
        recipeSummary={{
          row_count: editRow?.row_n || "",
          col_count: editRow?.col_n || "",
          flag_ramp: editRow?.flag_ramp || "",
        }}
      />
    );
  };

  return (
    <div className="h-screen bg-gray-100 text-gray-900">
      <div className="flex h-full">
        <aside className="w-56 border-r bg-white p-4">
          <div className="mb-6">
            <h1 className="text-lg font-bold">指纹模组AOI上位机</h1>
            <p className="mt-1 text-sm text-gray-500">Tauri + React</p>
          </div>

          <div className="space-y-2">
            <button className={`w-full rounded-lg px-3 py-2 text-left text-sm ${page === "main" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`} onClick={() => setPage("main")}>主检测页面</button>
            <button className={`w-full rounded-lg px-3 py-2 text-left text-sm ${page === "recipe_db" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`} onClick={() => setPage("recipe_db")}>配方数据库</button>
            <button className={`w-full rounded-lg px-3 py-2 text-left text-sm ${page === "recipe_edit" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`} onClick={() => setPage("recipe_edit")}>配方编辑 / 标定</button>
            <button className={`w-full rounded-lg px-3 py-2 text-left text-sm ${page === "comm" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`} onClick={() => setPage("comm")}>通信联调</button>
            <button className={`w-full rounded-lg px-3 py-2 text-left text-sm ${page === "runtime" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`} onClick={() => setPage("runtime")}>运行状态</button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="mb-6 rounded-xl border bg-white p-4">
            <h2 className="text-xl font-bold">{getPageTitle()}</h2>
          </div>
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
}

export default App;