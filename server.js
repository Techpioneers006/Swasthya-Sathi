require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const triageRouter = require("./routes/triage");
const careRouter = require("./routes/care");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(s => s.trim()) : true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "20kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "..", "frontend"), { extensions: ["html"] }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/triage", triageRouter);
app.use("/api/care", careRouter);

app.use((err, _req, res, _next) => {
  if (err && err.type === "entity.too.large") return res.status(413).json({ message: "Request is too large." });
  console.error("Request failed:", err && err.message ? err.message : "unknown error");
  res.status(500).json({ message: "Something went wrong. Please try again." });
});
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "..", "frontend", "index.html")));
app.listen(PORT, () => console.log(`SwasthyaSathi AI running at http://localhost:${PORT}`));
