
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "owner_session";
const SESSION_DURATION = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short.");
  }

  return new TextEncoder().encode(secret);
}

export async function createOwnerSession(): Promise<void> {
  const secret = getSecret();

  const token = await new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("omjewellers")
    .setAudience("omjewellers-owner")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function isOwnerAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return false;
    }

    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      issuer: "omjewellers",
      audience: "omjewellers-owner",
    });

    return payload.role === "owner";
  } catch {
    return false;
  }
}

export async function destroyOwnerSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
