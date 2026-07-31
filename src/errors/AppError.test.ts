import { describe, it, expect } from "vitest";
import { AppError } from "./AppError.ts";

describe("AppError", () => {
  it("sets message and statusCode", () => {
    const err = new AppError("Invalid credentials", 401);

    expect(err.message).toBe("Invalid credentials");
    expect(err.statusCode).toBe(401);
  });

  it("is an instance of Error and AppError", () => {
    const err = new AppError("Invalid credentials", 401);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});
