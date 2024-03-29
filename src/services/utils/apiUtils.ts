import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { Request } from "express";

const calculateExpiration = (expiresIn: string | number): number | null => {
  if (typeof expiresIn === "string") {
    const regex = /^(\d+)([smhd])$/;
    const match = expiresIn.match(regex);

    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      let multiplier = 1;

      switch (unit) {
        case "s":
          multiplier = 1;
          break;
        case "m":
          multiplier = 60;
          break;
        case "h":
          multiplier = 60 * 60;
          break;
        case "d":
          multiplier = 60 * 60 * 24;
          break;
        default:
          return null;
      }

      const expirationSeconds = value * multiplier;
      const expirationMilliseconds = expirationSeconds * 1000;
      const currentTime = Date.now();
      const expirationTime = currentTime + expirationMilliseconds;

      return expirationTime;
    } else {
      return null;
    }
  } else if (typeof expiresIn === "number") {
    const expirationMilliseconds = expiresIn * 1000;
    const currentTime = Date.now();
    const expirationTime = currentTime + expirationMilliseconds;

    return expirationTime;
  } else {
    return null;
  }
};

export const generateTokenObject = (user: Prisma.$UserPayload["scalars"]) => {
  const expiresIn = "1d";
  const token = generateToken(user, expiresIn);

  // Generate a expiresAt date helper function based on the expiresIn value, if it is a number, add the number of seconds to the current date, if it is a string, add the number of seconds to the current date and return the date object.
  const expiresAt = calculateExpiration(expiresIn);

  return {
    jwt: token,
    tokenType: "Bearer",
    expiresAt,
  };
};

export const generateToken = (
  user: Prisma.$UserPayload["scalars"],
  expiresIn: jwt.SignOptions["expiresIn"] = "1h"
) => {
  const payload = {
    id: user.id,
    email: user.email,
    password: user.password,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.APP_SECRET!, {
    expiresIn,
  });

  return token;
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.APP_SECRET!);
};

export const isAuth = (req: Request) => {
  const { authorization } = req.headers;

  if (authorization) {
    const token = authorization.split(" ")[1];
    const verifiedToken = verifyToken(token) as Prisma.$UserPayload["scalars"];

    return verifiedToken ? true : false;
  }

  return false;
};
