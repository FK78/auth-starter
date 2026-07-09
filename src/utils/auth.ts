import { argon2, randomBytes, timingSafeEqual } from "node:crypto";

const ARGON_PARAMS = {
  memory: 65536,
  parallelism: 4,
  passes: 3,
  tagLength: 64,
};

export const hashPassword = (password: string): Promise<string> => {
  const salt = randomBytes(16);

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
