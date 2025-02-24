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

// **🚀 Fix the JSON error!**
// Don't parse JSON for file uploads!
app.use(express.json({ limit: "10mb" })); // Increase JSON size limit
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Increase URL-encoded limit

// **✅ Fix: Configure Multer properly**
const upload = multer({ storage: multer.memoryStorage() });

// Connect to DB
const connectDB = require("./config/db");
connectDB();

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes")(upload));
app.use("/api/courses", require("./routes/courseRoutes")(upload)); // Pass `upload` to routes

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
