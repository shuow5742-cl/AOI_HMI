const net = require("net");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTimeoutPromise(ms, label) {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error(label));
    }, ms);
  });
}

function connectSocket(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    const onError = (err) => {
      cleanup();
      reject(err);
    };

    const onConnect = () => {
      cleanup();
      resolve(socket);
    };

    const cleanup = () => {
      socket.off("error", onError);
      socket.off("connect", onConnect);
      socket.setTimeout(0);
      socket.off("timeout", onTimeout);
    };

    const onTimeout = () => {
      cleanup();
      socket.destroy();
      reject(new Error(`连接机械臂超时: ${host}:${port}`));
    };

    socket.once("error", onError);
    socket.once("connect", onConnect);
    socket.once("timeout", onTimeout);
    socket.setTimeout(timeoutMs);
    socket.connect(port, host);
  });
}

function buildMockAck(sent, index) {
  try {
    const parsed = JSON.parse(sent);

    if (parsed.cmd === "recipe_start") {
      return JSON.stringify({
        ack: "recipe_start",
        status: "ok",
        index,
      });
    }

    if (parsed.cmd === "recipe_end") {
      return JSON.stringify({
        ack: "recipe_end",
        status: "ok",
        index,
      });
    }

    if (parsed.key) {
      return JSON.stringify({
        ack: parsed.key,
        status: "ok",
        index,
      });
    }
  } catch (error) {
    // ignore
  }

  return JSON.stringify({
    ack: `msg_${index}`,
    status: "ok",
    index,
  });
}

async function sendQueueToRobotMock({ messages, ackDelayMs = 80 }) {
  const results = [];

  for (let i = 0; i < messages.length; i += 1) {
    const sent = messages[i];
    await sleep(ackDelayMs);
    const ack = buildMockAck(sent, i + 1);
    results.push({ sent, ack });
  }

  return {
    ok: true,
    mode: "mock",
    host: "mock-robot",
    port: 0,
    sentCount: messages.length,
    results,
  };
}

async function sendQueueToRobotReal({
  host,
  port,
  messages,
  connectTimeoutMs = 3000,
  ackTimeoutMs = 3000,
}) {
  const socket = await connectSocket(host, port, connectTimeoutMs);

  let buffer = "";
  const ackQueue = [];
  const waiters = [];

  const pushAck = (line) => {
    const ack = line.trim();
    if (!ack) return;

    if (waiters.length > 0) {
      const waiter = waiters.shift();
      waiter.resolve(ack);
    } else {
      ackQueue.push(ack);
    }
  };

  const onData = (chunk) => {
    buffer += chunk.toString("utf8");

    while (buffer.includes("\n")) {
      const index = buffer.indexOf("\n");
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      pushAck(line);
    }
  };

  const onSocketError = (err) => {
    while (waiters.length > 0) {
      const waiter = waiters.shift();
      waiter.reject(err);
    }
  };

  socket.on("data", onData);
  socket.on("error", onSocketError);

  const waitForAck = () => {
    if (ackQueue.length > 0) {
      return Promise.resolve(ackQueue.shift());
    }

    return Promise.race([
      new Promise((resolve, reject) => {
        waiters.push({ resolve, reject });
      }),
      createTimeoutPromise(ackTimeoutMs, "等待机械臂确认超时"),
    ]);
  };

  const results = [];

  try {
    for (const msg of messages) {
      socket.write(`${msg}\n`);
      const ack = await waitForAck();
      results.push({
        sent: msg,
        ack,
      });
    }

    socket.end();

    return {
      ok: true,
      mode: "real",
      host,
      port,
      sentCount: messages.length,
      results,
    };
  } catch (error) {
    socket.destroy();
    return {
      ok: false,
      mode: "real",
      host,
      port,
      sentCount: results.length,
      results,
      error: String(error),
    };
  }
}

async function sendQueueToRobot({
  host,
  port,
  messages,
  connectTimeoutMs = 3000,
  ackTimeoutMs = 3000,
  simulate = false,
}) {
  if (simulate) {
    return sendQueueToRobotMock({ messages });
  }

  return sendQueueToRobotReal({
    host,
    port,
    messages,
    connectTimeoutMs,
    ackTimeoutMs,
  });
}

const POSE_CMD_FRAME = "/f/bIII4III1152III18IIIGetActualTCPPose()III/b/f";

function readUntilFrameEnd(socket, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let done = false;

    const cleanup = () => {
      clearTimeout(timer);
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
      socket.off("end", onEnd);
    };

    const finishResolve = (value) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(value);
    };

    const finishReject = (err) => {
      if (done) return;
      done = true;
      cleanup();
      reject(err);
    };

    const onData = (chunk) => {
      buffer += chunk.toString("utf8");

      if (buffer.includes("III/b/f")) {
        finishResolve(buffer);
      }
    };

    const onError = (err) => {
      finishReject(err);
    };

    const onClose = () => {
      if (!done) {
        finishReject(new Error("机械臂连接已关闭"));
      }
    };

    const onEnd = () => {
      if (!done) {
        finishReject(new Error("机械臂连接已结束"));
      }
    };

    const timer = setTimeout(() => {
      finishReject(new Error(label));
    }, timeoutMs);

    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);
    socket.once("end", onEnd);
  });
}

function parsePoseProtocolFrame(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("机械臂返回为空");
  }

  const prefix = "/f/bIII4III1152III";
  const suffix = "III/b/f";

  if (!raw.startsWith(prefix) || !raw.includes(suffix)) {
    throw new Error(`当前位置返回格式不正确: ${raw}`);
  }

  const suffixIndex = raw.indexOf(suffix);
  const body = raw.slice(prefix.length, suffixIndex);

  const firstSepIndex = body.indexOf("III");
  if (firstSepIndex < 0) {
    throw new Error(`当前位置返回缺少数据分隔符: ${raw}`);
  }

  const lenText = body.slice(0, firstSepIndex);
  const poseCsv = body.slice(firstSepIndex + 3).trim();

  const dataLen = Number(lenText);
  if (!Number.isFinite(dataLen)) {
    throw new Error(`当前位置返回长度字段无效: ${raw}`);
  }

  const parts = poseCsv.split(",").map((s) => Number(s.trim()));
  if (parts.length !== 6 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`当前位置返回位姿数据无效: ${raw}`);
  }

  return {
    x: parts[0],
    y: parts[1],
    z: parts[2],
    rx: parts[3],
    ry: parts[4],
    rz: parts[5],
    dataLen,
    raw,
  };
}

function formatPoseText(pose) {
  return [pose.x, pose.y, pose.z, pose.rx, pose.ry, pose.rz].join(",");
}

async function getCurrentPoseFromRobot({
  host,
  port,
  connectTimeoutMs = 3000,
  readTimeoutMs = 3000,
}) {
  const socket = await connectSocket(host, port, connectTimeoutMs);

  try {
    socket.write(POSE_CMD_FRAME);

    const raw = await readUntilFrameEnd(
      socket,
      readTimeoutMs,
      "读取机械臂当前位置超时",
    );

    const pose = parsePoseProtocolFrame(raw);
    socket.end();

    return {
      ok: true,
      host,
      port,
      pose: {
        x: pose.x,
        y: pose.y,
        z: pose.z,
        rx: pose.rx,
        ry: pose.ry,
        rz: pose.rz,
      },
      poseText: formatPoseText(pose),
      raw: pose.raw,
    };
  } catch (error) {
    socket.destroy();
    return {
      ok: false,
      host,
      port,
      message: String(error),
    };
  }
}

module.exports = {
  sendQueueToRobot,
  getCurrentPoseFromRobot,
};