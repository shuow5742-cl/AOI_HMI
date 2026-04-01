const express = require("express");
const cors = require("cors");
const { getAllRecipes, replaceAllRecipes, dbPath } = require("./db");
const {
  sendQueueToRobot,
  getCurrentPoseFromRobot,
} = require("./robotClient");
const {
  startServers,
  stopServers,
  getPublicState,
  sendQueueToParamClient,
  clearRuntimeLogs,
} = require("./hmiTcpServer");

const app = express();
const PORT = 30001;

let robotMode = "mock";

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "backend is running",
    dbPath,
    mode: robotMode,
    tcpServer: getPublicState(),
  });
});

app.get("/robot/status", (req, res) => {
  res.json({
    ok: true,
    robot: {
      mode: robotMode,
      ...getPublicState(),
    },
  });
});

app.get("/robot/current-pose", async (req, res) => {
  try {
    if (robotMode !== "real") {
      return res.status(400).json({
        ok: false,
        message: "当前为 mock 模式，无法读取真实机械臂当前位置",
      });
    }

    const result = await getCurrentPoseFromRobot({
      host: "192.168.57.2",
      port: 8080,
      connectTimeoutMs: 3000,
      readTimeoutMs: 3000,
    });

    if (!result.ok) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: String(error),
    });
  }
});

app.post("/robot/mode", (req, res) => {
  const { mode } = req.body || {};
  robotMode = mode === "real" ? "real" : "mock";

  res.json({
    ok: true,
    robot: {
      mode: robotMode,
      ...getPublicState(),
    },
  });
});

app.post("/robot/connect", (req, res) => {
  const result = startServers({
    host: "0.0.0.0",
    paramPort: 30088,
    statusPort: 20066,
  });

  res.json({
    ok: true,
    robot: {
      mode: robotMode,
      ...result,
    },
  });
});

app.post("/robot/disconnect", (req, res) => {
  const result = stopServers();

  res.json({
    ok: true,
    robot: {
      mode: robotMode,
      ...result,
    },
  });
});

app.post("/robot/clear-logs", (req, res) => {
  clearRuntimeLogs();

  res.json({
    ok: true,
    robot: {
      mode: robotMode,
      ...getPublicState(),
    },
  });
});

app.get("/recipes", (req, res) => {
  try {
    const rows = getAllRecipes();
    res.json({ ok: true, rows });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: String(error),
    });
  }
});

app.post("/recipes/save-all", (req, res) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows)) {
      return res.status(400).json({
        ok: false,
        message: "rows must be an array",
      });
    }

    replaceAllRecipes(rows);

    res.json({
      ok: true,
      message: "recipes saved",
      count: rows.length,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: String(error),
    });
  }
});

app.post("/robot/send-queue", async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "messages must be a non-empty array",
      });
    }

    if (robotMode === "mock") {
      const result = await sendQueueToRobot({
        host: "mock-robot",
        port: 0,
        messages,
        simulate: true,
      });
      return res.json(result);
    }

    const tcpState = getPublicState();

    if (!tcpState.listening) {
      return res.status(400).json({
        ok: false,
        message: "上位机TCP服务器未启动，请先启动监听",
      });
    }

    if (!tcpState.paramClientConnected) {
      return res.status(400).json({
        ok: false,
        message: "参数下发端口30088未连接机械臂",
      });
    }

    const result = await sendQueueToParamClient(messages, 3000);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: String(error),
    });
  }
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Backend running at http://127.0.0.1:${PORT}`);
  console.log("Robot default mode: mock");
  console.log("Real mode uses HMI TCP servers: 30088 / 20066");
});