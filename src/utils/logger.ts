import pino from "pino";

export const logger = pino({
  formatters: {
    level: (label) => {
      return {level: label.toUpperCase()}
    }
  },
  redact: ["req.headers.authorization", "req.headers.cookie"],
});
