const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const http = require("http"); // For creating the server
require("dotenv").config();

const globalErrorHandler = require("./middleware/globalErrorHandler");
const Databaseconnect = require("./config/database_config");

const userRouter = require("./routes/user.routes");
const mechanicRouter = require("./routes/mechanic.routes");
const adminRouter = require("./routes/admin.routes");
const serviceRouter = require("./routes/service.routes");
const masterRouter = require("./routes/master.routes");
const bookingRouter = require("./routes/booking.routes");

const { initSocket } = require("./utilits/socket");
const notificationRouter = require("./routes/notification.routes");
const fileRouter = require("./routes/fileupload.routes");
const slotRouter = require("./routes/slot.routes");

const app = express();
Databaseconnect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));
app.use(helmet());

// Routes middleware
app.use("/api/v1/user", userRouter);
app.use("/api/v1/mechanic", mechanicRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/service", serviceRouter);
app.use("/api/v1/master", masterRouter);
app.use("/api/v1/booking", bookingRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/file", fileRouter);
app.use("/api/v1/slot", slotRouter);

// Global error handler
app.use(globalErrorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
