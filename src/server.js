import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

console.log("MONGODB_URI =", process.env.MONGODB_URI);


import express from "express";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import dbClient from "./services/db.js";
import authRoutes from "./routes/authRoutes.js";

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(routes);
app.use("/api/auth", authRoutes);

// Connect to database before starting server
dbClient.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database. Server not started:", error.message);
    process.exit(1);
  });
