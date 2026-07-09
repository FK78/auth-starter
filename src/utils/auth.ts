import { argon2, randomBytes, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";

const ARGON_PARAMS = {
  memory: 65536,
  parallelism: 4,
  passes: 3,
  tagLength: 64,
};

type userJwtPayload = {
  id: string;
  email: string;
};

export const hashPassword = (
  password: string,
  existingSalt?: Buffer,
): Promise<string> => {
  const salt = existingSalt ?? randomBytes(16);

  const parameters = {
    message: password,
    nonce: salt,
    ...ARGON_PARAMS,
  };

  return new Promise((resolve, reject) => {
    argon2("argon2id", parameters, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      const hashBase64 = derivedKey.toString("base64");
      const saltBase64 = salt.toString("base64");

      resolve(
        `$argon2id$v=19$m=${String(ARGON_PARAMS.memory)},t=${String(ARGON_PARAMS.passes)},p=${String(ARGON_PARAMS.parallelism)}$${saltBase64}$${hashBase64}`,
      );
    });
  });
};

export const issueJwt = ({ id, email }: userJwtPayload, token: string) => {
  let JWT_SECRET;
  if (token === "ACCESS_TOKEN") {
    JWT_SECRET = process.env.ACCESS_TOKEN_SECRET;
  } else if (token === "REFRESH_TOKEN") {
    JWT_SECRET = process.env.REFRESH_TOKEN_SECRET;
  }
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "1h" });
};
