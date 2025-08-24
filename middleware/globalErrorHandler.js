require("dotenv").config();
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || false;

  if (process.env.NODE_ENV === "production") {
    if (!err.isOperational) {
      return res.status(500).json({
        status: "error",
        message: "Something went wrong!",
      });
    }
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }
};

module.exports = globalErrorHandler;
