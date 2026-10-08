import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "dash_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET ausente ou curto (mín. 32 caracteres)");
  return new TextEncoder().encode(secret);
}

export async function signSession() {
  return new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
