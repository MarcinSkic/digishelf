"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ErrorsDisplay from "@/components/errorsDisplay/ErrorsDisplay";
import styles from "./registerForm.module.scss";
import LoadingDisplay from "@/components/loadingDisplay/LoadingDisplay";
import { ExtractedErrors } from "@/types/types";
import { tryExtractErrors } from "@/modules/errorsHandling";

export default function RegisterForm() {
    const [user, setUser] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [isFetching, setIsFetching] = useState(false);

    const [errors, setErrors] = useState<ExtractedErrors | undefined>();
    const [errorsKey, setErrorsKey] = useState(new Date().toUTCString());
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isFetching) {
            setErrorsKey(new Date().toUTCString());
        }
    }, [isFetching]);

    async function onSubmit() {
        try {
            setIsFetching(true);
            const response = await fetch(`/api${pathname}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(user),
            });
            const result = await response.json();
            const errors = tryExtractErrors(result);

            setErrors(errors);
            if (errors) {
                setIsFetching(false);
            } else {
                router.refresh();
            }
        } catch (error: any) {
            setErrors(error.response.data.errors);

            console.error(error.response);
        }
    }

    return (
        <form
            className={styles["register-form-container"]}
            onSubmit={(e) => {
                e.preventDefault();
                e.currentTarget.reportValidity();
                onSubmit();
            }}
        >
            <h2>Register</h2>

            <input
                type="text"
                placeholder="Enter your username"
                required
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
            />
            <input
                type="email"
                placeholder="Enter your email"
                required
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
            />
            <input
                type="password"
                placeholder="Enter your password"
                required
                value={user.password}
                onChange={(e) => setUser({ ...user, password: e.target.value })}
            />
            <ErrorsDisplay key={errorsKey} errors={errors} />
            <button>
                {isFetching ? <LoadingDisplay size="1.3rem" /> : "Register"}
            </button>

            <Link href="/auth/login">Already have an account? Login</Link>
        </form>
    );
}
