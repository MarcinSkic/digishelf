"use client";

import LoadingDisplay from "@/components/loadingDisplay/LoadingDisplay";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

async function tryToReconnect() {
    try {
        await fetch("/api/validate", {
            signal: AbortSignal.timeout(40000),
            headers: {
                "Content-Type": "text/plain",
            },
        });
        return true;
    } catch (e: any) {
        if (e.name === "TimeoutError") {
            console.log("Timeout");
            return false;
        } else {
            return false;
        }
    }
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
