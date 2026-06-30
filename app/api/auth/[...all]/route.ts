import { NextResponse } from "next/server";
import { parseSetCookieHeader, stripSecureCookiePrefix } from "better-auth/cookies";
import { auth } from "@/lib/auth";
import {
  AUTH_HINT_COOKIE_MAX_AGE,
  AUTH_HINT_COOKIE_NAME,
  AUTH_HINT_COOKIE_VALUE,
  isSecureAuthHintCookie,
} from "@/lib/auth-hint";
import { getSetupStatus } from "@/lib/setup";

const BETTER_AUTH_SESSION_COOKIE_NAME = "better-auth.session_token";

// Unified handler for all request methods
async function handleAuth(request: Request) {
  const setupStatus = await getSetupStatus();

  // Database and Auth Environment Checks
  if (!setupStatus.databaseConfigured) return redirectToAuthError(request, "database_not_configured");
  if (!setupStatus.databaseSchemaReady) return redirectToAuthError(request, "database_migrations_missing");
  if (!setupStatus.authReady) return redirectToAuthError(request, "auth_env_missing");

  // Call the core auth handler
  const response = await auth.handler(request);

  return withAuthHintCookie(response);
}

export const GET = handleAuth;
export const POST = handleAuth;

function redirectToAuthError(request: Request, error: string) {
  const url = new URL("/auth/error", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

function withAuthHintCookie(response: Response) {
  const authState = getAuthStateFromSetCookie(response.headers.get("set-cookie"));
  if (!authState) return response;

  const nextResponse = new NextResponse(response.body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });

  // Set or clear the auth hint cookie
  const isLoggedin = authState === "logged-in";
  nextResponse.cookies.set(AUTH_HINT_COOKIE_NAME, isLoggedin ? AUTH_HINT_COOKIE_VALUE : "", {
    httpOnly: false,
    maxAge: isLoggedin ? AUTH_HINT_COOKIE_MAX_AGE : 0,
    path: "/",
    sameSite: "lax",
    secure: isSecureAuthHintCookie(),
    expires: isLoggedin ? undefined : new Date(0),
  });

  return nextResponse;
}

function getAuthStateFromSetCookie(setCookie: string | null) {
  if (!setCookie) return null;

  const sessionCookie = [...parseSetCookieHeader(setCookie)].find(([name]) => 
    stripSecureCookiePrefix(name) === BETTER_AUTH_SESSION_COOKIE_NAME
  );

  if (!sessionCookie) return null;

  const [, attributes] = sessionCookie;
  return attributes.value && attributes["max-age"] !== 0 ? "logged-in" : "logged-out";
}
