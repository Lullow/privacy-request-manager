import React, { useState } from "react";
import TopBar from "../components/TopBar";

// Base URL for backend API
const API_BASE = "http://127.0.0.1:8000/api";

// GDPR request types shown as selectable chips
const REQUEST_TYPES = [
    { id: "delete", label: "Radering" },
    { id: "access", label: "Registerutdrag" },
    { id: "rectify", label: "Rättelse" },
    { id: "restrict", label: "Begränsning" },
    { id: "object", label: "Invändning" },
    { id: "portability", label: "Dataportabilitet" },
];

function FormPage({ onBack }) {
    // Main form state
    const [form, setForm] = useState({
        companyName: "",
        companyEmail: "",
        fullName: "",
        city: "",
        profileUrl: "",
        requestTypes: ["delete"],
        tone: "neutral",
    });

    // Saved request id from backend
    const [savedRequestId, setSavedRequestId] = useState(null);

    // AI generated result
    const [generatedSubject, setGeneratedSubject] = useState("");
    const [generatedBody, setGeneratedBody] = useState("");

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    // Update one field in the form state
    function updateField(key, value) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    // Add/remove GDPR request types
    function toggleRequestType(id) {
        setForm((prev) => {
            const exists = prev.requestTypes.includes(id);

            return {
                ...prev,
                requestTypes: exists
                    ? prev.requestTypes.filter((x) => x !== id)
                    : [...prev.requestTypes, id],
            };
        });
    }

    // Basic validation
    const errors = {
        companyName: form.companyName.trim() ? "" : "Fyll i företagets namn.",
        companyEmail: form.companyEmail.trim() ? "" : "Fyll i företagets e-post.",
        fullName: form.fullName.trim() ? "" : "Fyll i ditt namn.",
    };

    const isValid =
        !errors.companyName &&
        !errors.companyEmail &&
        !errors.fullName;

    // Save request in backend
    async function saveRequest() {
        setError("");

        if (!isValid) {
            setError("Fyll i alla obligatoriska fält först.");
            return null;
        }

        try {
            const response = await fetch(`${API_BASE}/privacy-requests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    company_name: form.companyName,
                    company_email: form.companyEmail,
                    full_name: form.fullName,
                    city: form.city || null,
                    profile_url: form.profileUrl || null,
                    tone: form.tone,
                }),
            });

            if (!response.ok) {
                throw new Error("Kunde inte skapa ärendet.");
            }

            const data = await response.json();

            setSavedRequestId(data.id);
            return data.id;
        } catch (err) {
            setError(err.message || "Något gick fel vid sparning.");
            return null;
        }
    }

    // Generate AI message from backend
    async function generateWithAI() {
        setLoading(true);
        setError("");

        try {
            let requestId = savedRequestId;

            // Create request first if it does not already exist
            if (!requestId) {
                requestId = await saveRequest();
            }

            if (!requestId) {
                return;
            }

            const response = await fetch(
                `${API_BASE}/privacy-requests/${requestId}/generate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tone: form.tone,
                        message_type: "initial_request",
                        request_types: form.requestTypes,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Kunde inte generera AI-text.");
            }

            const data = await response.json();

            setGeneratedSubject(data.subject || "");
            setGeneratedBody(data.body || "");
        } catch (err) {
            setError(err.message || "Något gick fel vid AI-generering.");
        } finally {
            setLoading(false);
        }
    }

    // Copy generated AI result to clipboard
    async function copyToClipboard() {
        try {
            const textToCopy = `${generatedSubject}\n\n${generatedBody}`;
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (err) {
            console.error(err);
            alert("Kunde inte kopiera automatiskt.");
        }
    }

    return (
        <div className="page">
            <TopBar onBack={onBack} />

            <main className="container">
                <div className="card">
                    <div className="grid-2">
                        <h1>Skapa GDPR-begäran</h1>
                        <p>Fyll i dina uppgifter nedan för att skapa din begäran.</p>

                        <div className="field">
                            <label>Företag *</label>
                            <input
                                type="text"
                                placeholder="Ex: Google, Mrkoll..."
                                value={form.companyName}
                                onChange={(e) =>
                                    updateField("companyName", e.target.value)
                                }
                            />
                            {errors.companyName && (
                                <small className="hint">{errors.companyName}</small>
                            )}
                        </div>

                        <div className="field">
                            <label>Företagets e-post *</label>
                            <input
                                type="email"
                                placeholder="exempel@foretag.se"
                                value={form.companyEmail}
                                onChange={(e) =>
                                    updateField("companyEmail", e.target.value)
                                }
                            />
                            {errors.companyEmail && (
                                <small className="hint">{errors.companyEmail}</small>
                            )}
                        </div>

                        <div className="field">
                            <label>Ditt namn *</label>
                            <input
                                type="text"
                                placeholder="För- och efternamn"
                                value={form.fullName}
                                onChange={(e) =>
                                    updateField("fullName", e.target.value)
                                }
                            />
                            {errors.fullName && (
                                <small className="hint">{errors.fullName}</small>
                            )}
                        </div>

                        <div className="field">
                            <label>Ort</label>
                            <input
                                type="text"
                                placeholder="Ex: Stockholm"
                                value={form.city}
                                onChange={(e) => updateField("city", e.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Länk (valfritt)</label>
                            <input
                                type="url"
                                placeholder="Ex: https://exempel.se/profil/..."
                                value={form.profileUrl}
                                onChange={(e) =>
                                    updateField("profileUrl", e.target.value)
                                }
                            />
                        </div>

                        <div className="field">
                            <label>Tonalitet</label>
                            <select
                                value={form.tone}
                                onChange={(e) => updateField("tone", e.target.value)}
                            >
                                <option value="neutral">Neutral</option>
                                <option value="formal">Formell</option>
                                <option value="firm">Bestämd</option>
                            </select>
                        </div>
                    </div>

                    <hr className="divider" />

                    <div className="block">
                        <h2>Vad vill du begära?</h2>
                        <p className="muted">Välj en eller flera.</p>

                        <div className="chip-grid">
                            {REQUEST_TYPES.map((t) => (
                                <label className="chip" key={t.id}>
                                    <input
                                        type="checkbox"
                                        checked={form.requestTypes.includes(t.id)}
                                        onChange={() => toggleRequestType(t.id)}
                                    />
                                    <span>{t.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <hr className="divider" />

                    <div className="field">
                        <label>Förhandsvisning av AI-genererad GDPR-begäran</label>
                        <textarea
                            readOnly
                            value={
                                generatedBody
                                    ? `Ämne: ${generatedSubject}\n\n${generatedBody}`
                                    : ""
                            }
                            style={{ minHeight: 265, width: "100%" }}
                        />
                    </div>

                    {error && (
                        <div style={{ marginTop: 12 }}>
                            <small className="hint">{error}</small>
                        </div>
                    )}

                    <div className="actions">
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={onBack}
                        >
                            Tillbaka
                        </button>

                        <button
                            className="btn"
                            type="button"
                            onClick={saveRequest}
                            disabled={loading}
                        >
                            Spara ärende
                        </button>

                        <button
                            className="btn"
                            type="button"
                            onClick={generateWithAI}
                            disabled={loading}
                        >
                            {loading ? "Genererar..." : "Generera med AI"}
                        </button>

                        <button
                            className="btn"
                            type="button"
                            onClick={copyToClipboard}
                            disabled={!generatedBody}
                        >
                            {copied ? "Kopierat" : "Kopiera text"}
                        </button>
                    </div>

                    <pre style={{ marginTop: 16 }}>
                        {JSON.stringify(form, null, 2)}
                    </pre>
                </div>
            </main>
        </div>
    );
}

export default FormPage;