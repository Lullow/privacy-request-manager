import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import TopBar from "../components/TopBar";

const verificationRequests = new Map();

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [status, setStatus] = useState("loading"); // loading | success | error
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");
        const next = searchParams.get("next") || "/dashboard";
        let cancelled = false;
        let redirectTimeout;

        if (!token) {
            setStatus("error");
            setErrorMsg("Ingen verifieringslank hittades.");
            return;
        }

        // Reuse the same request across StrictMode remounts so a single-use
        // verification link is only consumed once.
        const request =
            verificationRequests.get(token) ||
            verifyEmail(token).finally(() => {
                verificationRequests.delete(token);
            });

        verificationRequests.set(token, request);

        request
            .then((res) => {
                if (cancelled) return;

                login(res.access_token);
                setStatus("success");
                redirectTimeout = setTimeout(() => navigate(next, { replace: true }), 1500);
            })
            .catch((err) => {
                if (cancelled) return;

                setStatus("error");
                setErrorMsg(err.message || "Lanken ar ogiltig eller redan anvand.");
            });

        return () => {
            cancelled = true;
            clearTimeout(redirectTimeout);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="page">
            <TopBar />
            <main className="container">
                <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
                    {status === "loading" && (
                        <>
                            <p style={{ fontSize: "2rem", marginBottom: 16 }}>Verifierar...</p>
                            <h2>Verifierar din e-post...</h2>
                            <p className="muted">Ett ogonblick.</p>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <p style={{ fontSize: "2rem", marginBottom: 16 }}>Klart</p>
                            <h2>E-post verifierad!</h2>
                            <p className="muted">Du loggas in automatiskt...</p>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <p style={{ fontSize: "2rem", marginBottom: 16 }}>Fel</p>
                            <h2>Nagot gick fel</h2>
                            <p className="muted">{errorMsg}</p>
                            <button
                                className="btn"
                                style={{ marginTop: 24 }}
                                onClick={() => navigate("/login")}
                            >
                                Ga till inloggning
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
