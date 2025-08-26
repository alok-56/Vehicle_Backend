const socketio = require("socket.io");
const Mechanicmodel = require("../models/mechanic.model");
const Usermodel = require("../models/user.model");

let io;

const initSocket = (server) => {
  io = socketio(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("register", async ({ userId, role, isAvailable }) => {
      socket.join(userId);
      if (role === "mechanic") {
        await Mechanicmodel.findByIdAndUpdate(userId, {
          socketId: socket.id,
          isAvailable: isAvailable,
        });
      }
      if (role === "user") {
        await Usermodel.findByIdAndUpdate(userId, {
          socketId: socket.id,
        });
      }
    });

    socket.on("updateAvailability", async ({ userId, isAvailable }) => {
      try {
        let res = await Mechanicmodel.findByIdAndUpdate(userId, {
          isAvailable: isAvailable,
        });

        socket.emit("availabilityUpdated", {
          success: true,
          isAvailable: isAvailable,
        });
      } catch (error) {
        socket.emit("availabilityUpdated", {
          success: false,
          error: "Failed to update availability",
        });
      }
    });

    socket.on("disconnect", async () => {
      await Mechanicmodel.findOneAndUpdate(
        { socketId: socket.id },
        { socketId: null }
      );
      await Usermodel.findOneAndUpdate(
        { socketId: socket.id },
        { socketId: null }
      );
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
