const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const requestIp = require("request-ip");
// const toolsRoutes = require("./routes/toolsRoutes")
const { createCanvas, loadImage, registerFont, Path2D } = require("canvas");

const os = require("os");
const { requestLogger } = require("./requestLogger");

const LOG_FILE_PATH_STATS = path.join(__dirname, "./logs.json");

function getStartOfMinute(timestamp) {
  const msInMinute = 60 * 1000; // 60.000 milidetik dalam satu menit

  return timestamp - (timestamp % msInMinute);
}
registerFont(path.join(__dirname, "fonts", "LilitaOne-Regular.ttf"), {
  family: "Anton",
});
console.log("Font LilitaOne-Regular berhasil didaftarkan.");

registerFont(path.join(__dirname, "fonts", "FiraCode-Regular.ttf"), {
  family: "Anton",
});

console.log("Font FiraCode-Regular berhasil didaftarkan.");

registerFont(path.join(__dirname, "fonts", "PTSansNarrow-Regular.ttf"), {
  family: "Open Sans Condensed",
});
registerFont(path.join(__dirname, "fonts", "PTSansNarrow-Regular.ttf"), {
  family: "Roboto Condensed",
});
console.log("Font Roboto berhasil didaftarkan.");


dotenv.config();

const app = express();
const PORT = process.env.PORT;

require("dotenv").config();

const mode = process.env.MODE;
console.log(`Server berjalan dalam mode: ${mode}`);

const routesConfig = {
  normal: "./routes/toolsRoutes",
  imlek: "./routes/toolsimlek",
  ramadan: "./routes/toolsramadan",
};

const selectedRoute = routesConfig[mode] || routesConfig["normal"];

app.use(morgan("dev"));
app.use(requestIp.mw());
app.use(express.json());
app.use(requestLogger);
app.use(express.json({ limit: "2mb" }));
app.use("/static/images", express.static(path.join(__dirname, "gambar")));

app.get("/", (req, res) => {
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d} hari, ${h} jam, ${m} menit, ${s} detik`;
  };
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  const serverStats = {
    status: "active",
    timestamp: new Date().toISOString(),
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      os_type: os.type(),
      architecture: os.arch(),
      uptime: formatUptime(os.uptime()),
    },
    cpu: {
      model: cpus[0].model,
      cores: cpus.length,
      speed_ghz: (cpus[0].speed / 1000).toFixed(2),
      load_average: os.loadavg(),
    },
    memory: {
      total: formatBytes(totalMemory),
      free: formatBytes(freeMemory),
      used: formatBytes(totalMemory - freeMemory),
    },
    node_process: {
      version: process.version,
      memory_usage: formatBytes(process.memoryUsage().rss),
      uptime: formatUptime(process.uptime()),
    },
  };

  res.json(serverStats);
});

// =============== FITUR ===============
// app.use(toolsRoutes);
app.use("", require(selectedRoute));


// app.get('/', (req, res) => {
//   res.send('Be active API is running');
// });

app.get("/api/stats", (req, res) => {
  try {
    let rawLogs = [];
    if (fs.existsSync(LOG_FILE_PATH_STATS)) {
      const logData = fs.readFileSync(LOG_FILE_PATH_STATS, "utf-8");
      rawLogs = JSON.parse(logData);
    } else {
    }

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentLogs = rawLogs.filter((log) => log.timestamp >= oneHourAgo);

    const minuteData = new Map();
    for (let i = 0; i < 60; i++) {
      const minuteTimestamp = now - i * 60 * 1000;
      const startOfMinute = getStartOfMinute(minuteTimestamp);
      if (!minuteData.has(startOfMinute)) {
        minuteData.set(startOfMinute, { GET: 0, POST: 0, PUT: 0, DELETE: 0 });
      }
    }

    recentLogs.forEach((log) => {
      const logMinuteTimestamp = getStartOfMinute(log.timestamp);
      const slot = minuteData.get(logMinuteTimestamp);
      if (slot) {
        if (slot.hasOwnProperty(log.method)) {
          slot[log.method]++;
        }
      } else {
      }
    });

    const chartData = Array.from(minuteData.entries())
      .map(([timestamp, counts]) => ({ timestamp, ...counts }))
      .sort((a, b) => a.timestamp - b.timestamp);

    res.json({ status: true, data: chartData });
  } catch (error) {
    console.error("Gagal membaca atau memproses statistik:", error);
    res
      .status(500)
      .json({ status: false, message: "Gagal memproses statistik." });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});