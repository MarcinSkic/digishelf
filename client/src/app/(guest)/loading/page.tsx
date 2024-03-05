"use client";

import LoadingDisplay from "@/components/loadingDisplay/LoadingDisplay";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

async function tryToReconnect() {
    let attempts = 0;
    while (attempts < 5) {
        try {
            await fetch("/api/validate", {
                signal: AbortSignal.timeout(8000),
                headers: {
                    "Content-Type": "text/plain",
                },
            });
            return true;
        } catch (e: any) {
            if (e.name === "AbortError" || e.name === "TimeoutError") {
                attempts++;
            } else {
                return false;
            }
        }
    }

    return false;
}

export default function ServerlessLoading() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            tryToReconnect().then((isSuccess) => {
                if (isSuccess) {
                    router.replace(searchParams.get("path") ?? "/");
                } else {
                    setFetching(false);
                }
            });
        }, 1000);
    }, [searchParams, router]);

    return (
        <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
            {fetching ? (
                <LoadingDisplay size="40px" text="Server is waking up" />
            ) : (
                <p>Server is not responding, try again later</p>
            )}
        </div>
    );
}
