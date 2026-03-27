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

module.exports = {
  sendQueueToRobot,
};