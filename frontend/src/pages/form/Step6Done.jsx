import { SITES } from "../../data/sites";

// Steg 6: Bekräftelsesida som visar sändningsstatus per sajt i realtid.
// sendStatus uppdateras löpande från handleSendAll i FormPage medan begäranden skickas.
// isBankId-logiken identifierar form-sajter vid enkel begäran — dessa hanteras
// manuellt av användaren och ingår inte i den automatiska sändningen.
export default function Step6Done({ selectedRemoveSites, requestIds, requestPath, sendStatus, getMailtoFallback, onBack, onReset }) {
    return (
        <div>
            <h1>Begäranden inskickade!</h1>
            <p className="muted" style={{ marginBottom: 20 }}>
                Vi skickar dina raderingsbegäranden. Företagen är skyldiga att svara inom <strong>30 dagar</strong> enligt GDPR.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {selectedRemoveSites.map((name) => {
                    const site = SITES.find((s) => s.name === name);
                    const status = sendStatus[name];
                    const hasRequest = !!requestIds[name];
                    const isBankId = !hasRequest && site?.removeMethod === "form" && requestPath === "simple";

                    return (
                        <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                            <span style={{ fontWeight: 600 }}>{name}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {isBankId ? (
                                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Hanteras via BankID</span>
                                ) : status === "sent" ? (
                                    <>
                                        <span style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 600 }}>✓ Skickat</span>
                                        {site && (
                                            <a href={getMailtoFallback(site)} style={{ fontSize: "0.78rem", color: "rgba(16,32,86,0.6)", textDecoration: "underline" }}>
                                                Öppna i mejlklient
                                            </a>
                                        )}
                                    </>
                                ) : status === "failed" ? (
                                    <>
                                        <span style={{ fontSize: "0.82rem", color: "#dc2626" }}>Misslyckades</span>
                                        {site && (
                                            <a href={getMailtoFallback(site)} style={{ fontSize: "0.78rem", color: "rgba(16,32,86,0.8)", textDecoration: "underline" }}>
                                                Öppna i mejlklient
                                            </a>
                                        )}
                                    </>
                                ) : (
                                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Skickar...</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="actions">
                <button className="btn btn-secondary" type="button" onClick={onBack}>Tillbaka till start</button>
                <button className="btn" type="button" onClick={onReset}>Ny begäran</button>
            </div>
        </div>
    );
}
