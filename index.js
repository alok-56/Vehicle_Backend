const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const globalErrorHandler = require("./middleware/globalErrorHandler");
const Databaseconnect = require("./config/database_config");
const userRouter = require("./routes/user.routes");
const app = express();
Databaseconnect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());

// Routes middleware
app.use("/api/v1/user", userRouter);

// Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
