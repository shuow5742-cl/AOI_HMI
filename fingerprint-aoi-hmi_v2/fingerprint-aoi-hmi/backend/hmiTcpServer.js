const net = require("net");

const state = {
  listening: false,
  host: "0.0.0.0",
  paramPort: 30088,
  statusPort: 20066,

  paramServer: null,
  statusServer: null,

  paramSocket: null,
  statusSocket: null,

  paramClientConnected: false,
  statusClientConnected: false,

  lastStatusReport: "",
  lastAckMessage: "",

  paramBuffer: "",
  statusBuffer: "",

  ackQueue: [],
  ackWaiters: [],
};

function resetAckChannel() {
  state.ackQueue = [];
  while (state.ackWaiters.length > 0) {
    const waiter = state.ackWaiters.shift();
    waiter.reject(new Error("参数连接已断开"));
  }
}

function clearRuntimeLogs() {
  state.lastStatusReport = "";
  state.lastAckMessage = "";
  state.paramBuffer = "";
  state.statusBuffer = "";
  state.ackQueue = [];
}

function getPublicState() {
  return {
    listening: state.listening,
    host: state.host,
    paramPort: state.paramPort,
    statusPort: state.statusPort,
    paramClientConnected: state.paramClientConnected,
    statusClientConnected: state.statusClientConnected,
    lastStatusReport: state.lastStatusReport,
    lastAckMessage: state.lastAckMessage,
  };
}

function pushAck(line) {
  const msg = line.trim();
  if (!msg) return;

  state.lastAckMessage = msg;

  if (state.ackWaiters.length > 0) {
    const waiter = state.ackWaiters.shift();
    waiter.resolve(msg);
  } else {
    state.ackQueue.push(msg);
  }
}

function handleParamData(chunk) {
  state.paramBuffer += chunk.toString("utf8");

  while (state.paramBuffer.includes("\n")) {
    const idx = state.paramBuffer.indexOf("\n");
    const line = state.paramBuffer.slice(0, idx);
    state.paramBuffer = state.paramBuffer.slice(idx + 1);
    pushAck(line);
  }
}

function handleStatusData(chunk) {
  state.statusBuffer += chunk.toString("utf8");

  while (state.statusBuffer.includes("\n")) {
    const idx = state.statusBuffer.indexOf("\n");
    const line = state.statusBuffer.slice(0, idx);
    state.statusBuffer = state.statusBuffer.slice(idx + 1);

    const msg = line.trim();
    if (!msg) continue;

    state.lastStatusReport = msg;
  }
}

async function waitForAck(timeoutMs) {
  if (state.ackQueue.length > 0) {
    return state.ackQueue.shift();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error("等待机械臂确认超时"));
    }, timeoutMs);

    state.ackWaiters.push({
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });
  });
}

async function sendQueueToParamClient(messages, ackTimeoutMs = 3000) {
  if (!state.paramSocket || !state.paramClientConnected) {
    throw new Error("参数下发端口未连接机械臂");
  }

  const results = [];

  for (const msg of messages) {
    state.paramSocket.write(`${msg}\n`);
    const ack = await waitForAck(ackTimeoutMs);
    results.push({ sent: msg, ack });

    try {
      const parsed = JSON.parse(ack);
      if (parsed.status === "error") {
        throw new Error(`机械臂返回 error: ${ack}`);
      }
    } catch (err) {
      if (String(err).includes("机械臂返回 error")) {
        throw err;
      }
    }
  }

  return {
    ok: true,
    mode: "real",
    host: state.host,
    port: state.paramPort,
    sentCount: messages.length,
    results,
  };
}

function startServers({
  host = "0.0.0.0",
  paramPort = 30088,
  statusPort = 20066,
} = {}) {
  if (state.listening) {
    return getPublicState();
  }

  state.host = host;
  state.paramPort = paramPort;
  state.statusPort = statusPort;

  state.paramServer = net.createServer((socket) => {
    if (state.paramSocket) {
      state.paramSocket.destroy();
    }

    state.paramSocket = socket;
    state.paramClientConnected = true;
    state.paramBuffer = "";

    socket.on("data", handleParamData);

    socket.on("close", () => {
      state.paramClientConnected = false;
      state.paramSocket = null;
      resetAckChannel();
    });

    socket.on("error", () => {
      state.paramClientConnected = false;
      state.paramSocket = null;
      resetAckChannel();
    });
  });

  state.statusServer = net.createServer((socket) => {
    if (state.statusSocket) {
      state.statusSocket.destroy();
    }

    state.statusSocket = socket;
    state.statusClientConnected = true;
    state.statusBuffer = "";

    socket.on("data", handleStatusData);

    socket.on("close", () => {
      state.statusClientConnected = false;
      state.statusSocket = null;
    });

    socket.on("error", () => {
      state.statusClientConnected = false;
      state.statusSocket = null;
    });
  });

  state.paramServer.listen(paramPort, host);
  state.statusServer.listen(statusPort, host);

  state.listening = true;
  return getPublicState();
}

function stopServers() {
  if (state.paramSocket) {
    state.paramSocket.destroy();
    state.paramSocket = null;
  }
  if (state.statusSocket) {
    state.statusSocket.destroy();
    state.statusSocket = null;
  }

  if (state.paramServer) {
    state.paramServer.close();
    state.paramServer = null;
  }
  if (state.statusServer) {
    state.statusServer.close();
    state.statusServer = null;
  }

  state.listening = false;
  state.paramClientConnected = false;
  state.statusClientConnected = false;
  state.paramBuffer = "";
  state.statusBuffer = "";
  resetAckChannel();
  clearRuntimeLogs();

  return getPublicState();
}

module.exports = {
  startServers,
  stopServers,
  getPublicState,
  sendQueueToParamClient,
  clearRuntimeLogs,
};