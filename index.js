const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 4050;

dotenv.config();

// CORS Configuration
const corsOptions = {
  origin: [process.env.CLIENT_URL, "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const upload = multer({ storage: multer.memoryStorage() });

// Connect to DB
const connectDB = require("./config/db");
connectDB();

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes")(upload));
app.use("/api/courses", require("./routes/courseRoutes")(upload));
app.use("/api/assignments", require("./routes/assignmentRoutes")(upload));
app.use("/api/quizzes", require("./routes/quizRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/messages", require("./routes/messageRoutes")(upload));
app.use("/api/ai", require("./routes/aiRoutes"));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
