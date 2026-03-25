import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/authApi";
import { useAuth } from "../context/useAuth";
import TopBar from "../components/TopBar";

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [status, setStatus] = useState("loading"); // loading | success | error
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const token = searchParams.get("token");
        const next = searchParams.get("next") || "/dashboard";

        if (!token) {
            setStatus("error");
            setErrorMsg("Ingen verifieringslänk hittades.");
            return;
        }

        verifyEmail(token)
            .then((res) => {
                login(res.access_token);
                setStatus("success");
                setTimeout(() => navigate(next, { replace: true }), 1500);
            })
            .catch((err) => {
                setStatus("error");
                setErrorMsg(err.message || "Länken är ogiltig eller redan använd.");
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="page">
            <TopBar />
            <main className="container">
                <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
                    {status === "loading" && (
                        <>
                            <p style={{ fontSize: "2rem", marginBottom: 16 }}>⏳</p>
                            <h2>Verifierar din e-post...</h2>
                            <p className="muted">Ett ögonblick.</p>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <p style={{ fontSize: "2rem", marginBottom: 16 }}>✓</p>
                            <h2>E-post verifierad!</h2>
                            <p className="muted">Du loggas in automatiskt...</p>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <p style={{ fontSize: "2rem", marginBottom: 16 }}>✕</p>
                            <h2>Något gick fel</h2>
                            <p className="muted">{errorMsg}</p>
                            <button
                                className="btn"
                                style={{ marginTop: 24 }}
                                onClick={() => navigate("/login")}
                            >
                                Gå till inloggning
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
