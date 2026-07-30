import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
  formatters: {
    level: (label) => {
      return {level: label.toUpperCase()}
    }
  },
  redact: ["req.headers.authorization", "req.headers.cookie"],
});
