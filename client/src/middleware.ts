import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const jwtCookie = request.cookies.get("jwt");
    const isOnAuthPage = request.nextUrl.pathname.startsWith("/auth");
    let isJWTValid = false;
    let response;

    try {
        isJWTValid =
            !!jwtCookie &&
            (
                await fetch(`${process.env.API_ADDRESS}/validate`, {
                    signal: AbortSignal.timeout(2000),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${jwtCookie?.value}`,
                    },
                })
            ).status === 200;
    } catch (e: any) {
        if (e.name === "TimeoutError") {
            return NextResponse.redirect(
                new URL(
                    `/loading?path=${request.nextUrl.pathname}`,
                    request.url
                )
            );
        } else {
            return NextResponse.next();
        }
    }

    if (!isJWTValid && !isOnAuthPage) {
        response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete("jwt");
    } else if (isJWTValid && isOnAuthPage) {
        response = NextResponse.redirect(new URL("/", request.url));
    } else {
        response = NextResponse.next();
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!loading|api|error|_next/static|_next/image|favicon.ico).*)",
    ],
};
