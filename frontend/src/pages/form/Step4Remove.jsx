import StepIndicator from "../../components/StepIndicator";
import { REQUEST_TYPES } from "../../data/sites";

export default function Step4Remove({
    fullName, city, birthDate,
    requestPath, setRequestPath,
    requestTypes, toggleRequestType,
    tone, setTone,
    showToneDropdown, setShowToneDropdown,
    personalNumber, setPersonalNumber,
    personalNumberError, setPersonalNumberError,
    showPersonalNumber, setShowPersonalNumber,
    legalAddress, setLegalAddress,
    legalPhone, setLegalPhone,
    legalEmail, setLegalEmail,
    legalEmailError, setLegalEmailError,
    generatedEmails, loadingSite, copiedSite, setCopiedSite,
    generateEmailForSite, mailtoLink, getMailtoFallback,
    buildLegalTemplate,
    emailSites, formSites,
    error, setError,
    isPreparingStep5, prepareAndGoToStep5,
    setStep,
}) {
    return (
        <div>
            <StepIndicator current={4} onNavigate={setStep} />
            <h1>Ta bort dina uppgifter</h1>
            <p className="muted">Följ instruktionerna nedan för varje sajt. Du signerar i nästa steg.</p>

            {/* ── Välj begäranstyp ── */}
            <div style={{ display: "flex", gap: 12, margin: "20px 0" }}>
                <button
                    type="button"
                    className={`btn${requestPath === "simple" ? "" : " btn-secondary"}`}
                    style={{ flex: 1, flexDirection: "column", gap: 4, padding: "14px 12px" }}
                    onClick={() => { setRequestPath("simple"); setError(""); }}
                >
                    <span style={{ fontWeight: 700 }}>Enkel begäran</span>
                    <span style={{ fontSize: "0.78rem", opacity: 0.8, fontWeight: 400 }}>AI-genererad GDPR-förfrågan</span>
                </button>
                <button
                    type="button"
                    className={`btn${requestPath === "legal" ? "" : " btn-secondary"}`}
                    style={{ flex: 1, flexDirection: "column", gap: 4, padding: "14px 12px" }}
                    onClick={() => { setRequestPath("legal"); setError(""); }}
                >
                    <span style={{ fontWeight: 700 }}>Juridisk begäran</span>
                    <span style={{ fontSize: "0.78rem", opacity: 0.8, fontWeight: 400 }}>Formell mall med IMY-hänvisning</span>
                </button>
            </div>

            {/* ── Fält för juridisk begäran ── */}
            {requestPath === "legal" && (
                <div>
                    <hr className="divider" />
                    <h2>Uppgifter för juridisk begäran</h2>
                    <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 12 }}>
                        Används enbart för att generera brevet — sparas inte i systemet.
                    </p>
                    <div className="info-hint-box">
                        <span className="info-hint-icon">💡</span>
                        <span>Ju mer information du anger, desto lättare är det för sajten att identifiera dig — vilket ökar chansen att din begäran beviljas snabbt.</span>
                    </div>

                    <div className="field">
                        <label>Personnummer *</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPersonalNumber ? "text" : "password"}
                                placeholder="XXXXXX-XXXX"
                                value={personalNumber}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, "");
                                    if (raw.length === 1 && raw !== "1" && raw !== "2") return;
                                    if (raw.length > 12) return;
                                    const formatted = raw.length >= 9
                                        ? raw.slice(0, 8) + "-" + raw.slice(8, 12)
                                        : raw;
                                    setPersonalNumber(formatted);
                                    setPersonalNumberError("");
                                }}
                                onBlur={() => {
                                    const valid10 = /^\d{6}-\d{4}$/.test(personalNumber);
                                    const valid12 = /^\d{8}-\d{4}$/.test(personalNumber);
                                    if (personalNumber && !valid10 && !valid12) {
                                        setPersonalNumberError("Ange format ÅÅMMDD-XXXX (10 siffror) eller ÅÅÅÅMMDD-XXXX (12 siffror).");
                                    }
                                }}
                                autoComplete="off"
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPersonalNumber((v) => !v)}
                                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, display: "flex", alignItems: "center" }}
                            >
                                {showPersonalNumber ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                )}
                            </button>
                        </div>
                        {personalNumberError && <small className="hint">{personalNumberError}</small>}
                        <small className="hint">Sparas inte — används enbart för att skapa brevet.</small>
                    </div>

                    <div className="field" style={{ marginTop: 12 }}>
                        <label>Adress <span className="muted">(valfritt)</span></label>
                        <input
                            type="text"
                            placeholder="Gatuadress, postnummer och stad"
                            value={legalAddress}
                            onChange={(e) => setLegalAddress(e.target.value)}
                            autoComplete="off"
                        />
                        <small className="hint">Hjälper sajten att matcha din folkbokföringsadress mot det som visas.</small>
                    </div>

                    <div className="field" style={{ marginTop: 12 }}>
                        <label>Telefonnummer <span className="muted">(valfritt)</span></label>
                        <input
                            type="tel"
                            placeholder="07X-XXX XX XX"
                            value={legalPhone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9\-]/g, "");
                                const dashes = (val.match(/-/g) || []).length;
                                if (dashes <= 1) setLegalPhone(val);
                            }}
                            autoComplete="off"
                        />
                        <small className="hint">Gör det lättare för sajten att nå dig om de behöver bekräfta din identitet.</small>
                    </div>

                    <div className="field" style={{ marginTop: 12 }}>
                        <label>Din e-postadress <span className="muted">(valfritt)</span></label>
                        <input
                            type="email"
                            placeholder="din@epost.se"
                            value={legalEmail}
                            onChange={(e) => { setLegalEmail(e.target.value); setLegalEmailError(""); }}
                            onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val && !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(val)) {
                                    setLegalEmailError("Ogiltig e-postadress.");
                                }
                            }}
                            autoComplete="off"
                        />
                        {legalEmailError && <small className="hint">{legalEmailError}</small>}
                        <small className="hint">Sajten kan skicka en bekräftelse direkt till dig när begäran är behandlad.</small>
                    </div>
                    <hr className="divider" />

                    {/* ── Tonalitet för juridisk begäran ── */}
                    <div className="field" style={{ marginTop: 4, marginBottom: 20 }}>
                        <label>Tonalitet</label>
                        <small className="muted" style={{ display: "block", marginBottom: 6, fontSize: "0.78rem" }}>
                            Justera tonen i det juridiska brevet — neutral fungerar i de flesta fall, formell passar vid officiell korrespondens och bestämd om du vill understryka dina rättigheter.
                        </small>
                        <div className="filter-dropdown-wrapper" style={{ paddingLeft: 0 }}>
                            <button type="button" className="filter-dropdown-btn" onClick={() => setShowToneDropdown(v => !v)}>
                                {tone === "neutral" ? "Neutral" : tone === "formal" ? "Formell" : "Bestämd"}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                            </button>
                            {showToneDropdown && (
                                <div className="filter-dropdown-menu">
                                    {[["neutral","Neutral"],["formal","Formell"],["firm","Bestämd"]].map(([val, label]) => (
                                        <div key={val} className="filter-dropdown-item" onClick={() => { setTone(val); setShowToneDropdown(false); }}>{label}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Enkel: inställningar för AI-mejl ── */}
            {requestPath === "simple" && emailSites.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <hr className="divider" />
                    <h2>Inställningar för AI-genererat mejl</h2>
                    <div className="field">
                        <label>Typ av begäran</label>
                        <div className="chip-grid">
                            {REQUEST_TYPES.map((t) => {
                                const isComingSoon = t.id !== "delete";
                                return (
                                    <label
                                        className="chip"
                                        key={t.id}
                                        title={isComingSoon ? "Ej tillgänglig ännu — kommer snart!" : undefined}
                                        style={isComingSoon ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={requestTypes.includes(t.id)}
                                            onChange={() => !isComingSoon && toggleRequestType(t.id)}
                                            disabled={isComingSoon}
                                        />
                                        <span>{t.label}{isComingSoon && " 🔒"}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {requestTypes.some(id => id !== "delete") && (
                            <small className="hint" style={{ color: "orange", marginTop: 6, display: "block" }}>
                                Endast radering är tillgängligt just nu — övriga typer kommer snart.
                            </small>
                        )}
                        <small className="muted" style={{ marginTop: 6, display: "block" }}>
                            Rättelse, Begränsning, Invändning och Dataportabilitet är ej tillgängliga ännu.
                        </small>
                    </div>
                    <div className="field" style={{ marginTop: 20 }}>
                        <label>Tonalitet</label>
                        <small className="muted" style={{ display: "block", marginBottom: 6, fontSize: "0.78rem" }}>
                            Justera tonen i det AI-genererade mejlet — neutral fungerar i de flesta fall, formell passar vid officiell korrespondens och bestämd om du vill understryka dina rättigheter.
                        </small>
                        <div className="filter-dropdown-wrapper" style={{ paddingLeft: 0 }}>
                            <button type="button" className="filter-dropdown-btn" onClick={() => setShowToneDropdown(v => !v)}>
                                {tone === "neutral" ? "Neutral" : tone === "formal" ? "Formell" : "Bestämd"}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                            </button>
                            {showToneDropdown && (
                                <div className="filter-dropdown-menu">
                                    {[["neutral","Neutral"],["formal","Formell"],["firm","Bestämd"]].map(([val, label]) => (
                                        <div key={val} className="filter-dropdown-item" onClick={() => { setTone(val); setShowToneDropdown(false); }}>{label}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <hr className="divider" />
                </div>
            )}

            {/* ── Formulär-sajter: gemensam notering ── */}
            {formSites.length > 0 && requestPath === "simple" && (
                <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 16, lineHeight: 1.7 }}>
                    De flesta sajter kräver BankID för att godkänna borttagning via formuläret — det är oftast det snabbaste sättet.
                    Har du inte BankID, eller vill inte använda det? Välj{" "}
                    <button type="button" onClick={() => setRequestPath("legal")} style={{ background: "none", border: "none", padding: 0, color: "rgba(16,32,86,0.86)", fontWeight: 600, cursor: "pointer", fontSize: "inherit", textDecoration: "underline" }}>Juridisk begäran</button>
                    {" "}— vi genererar ett formellt brev och skickar det å dina vägnar.
                    Skulle sajten neka din begäran hjälper vi dig att motargumentera på ett korrekt juridiskt sätt.
                </p>
            )}
            {formSites.length > 0 && requestPath === "legal" && !personalNumber.trim() && (
                <small className="hint" style={{ display: "block", marginBottom: 16 }}>Fyll i personnummer ovan för att se den juridiska mallen per sajt.</small>
            )}

            {/* ── Formulär-sajter ── */}
            {formSites.map((site) => (
                <div key={site.name} style={{ marginBottom: 24 }}>
                    <h2>{site.name}</h2>
                    {requestPath === "simple" ? (
                        <>
                            {site.removeNote && (
                                <div style={{ background: "#fff8e1", border: "1px solid #f59e0b", borderRadius: 8, padding: "8px 14px", margin: "8px 0 10px", fontSize: "0.84rem", color: "#92400e" }}>
                                    ⚠ {site.removeNote}
                                </div>
                            )}
                            <ol style={{ margin: "8px 0 14px", paddingLeft: 22, color: "#334155", fontSize: "0.9rem", lineHeight: 2 }}>
                                {(site.removeSteps || []).map((text, idx) => (
                                    <li key={idx}>{text}</li>
                                ))}
                            </ol>
                            <a
                                href={site.removeStartUrl ? site.removeStartUrl(fullName.trim(), city.trim()) : site.removeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <button className="btn" type="button">Öppna {site.name} →</button>
                            </a>
                        </>
                    ) : (
                        personalNumber.trim() ? (
                            <div>
                                <p style={{ margin: "4px 0 8px", color: "#334155", fontSize: "0.9rem" }}>
                                    Kopiera mallen och skicka den till sajtens GDPR-kontakt. Kontaktuppgifterna hittar du på deras hemsida.
                                </p>
                                <textarea
                                    readOnly
                                    value={buildLegalTemplate()}
                                    style={{ minHeight: 120, width: "100%", marginBottom: 6, fontSize: "0.8rem", boxSizing: "border-box" }}
                                />
                                <div style={{ display: "flex", gap: 8 }}>
                                    <a href={getMailtoFallback(site)}>
                                        <button className="btn" type="button">Öppna i mejlklient</button>
                                    </a>
                                    <button
                                        className={copiedSite === site.name ? "btn" : "btn btn-secondary"}
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(buildLegalTemplate());
                                            setCopiedSite(site.name);
                                            setTimeout(() => setCopiedSite(null), 2000);
                                        }}
                                    >
                                        {copiedSite === site.name ? "Kopierat!" : "Kopiera mall"}
                                    </button>
                                </div>
                            </div>
                        ) : null
                    )}
                </div>
            ))}

            {/* ── Mejl-sajter ── */}
            {emailSites.map((site) => (
                <div key={site.name} style={{ marginBottom: 24 }}>
                    <h2>{site.name}</h2>
                    {!generatedEmails[site.name] ? (
                        <button
                            className="btn"
                            type="button"
                            disabled={
                                loadingSite === site.name ||
                                (requestPath === "simple" && requestTypes.length === 0) ||
                                (requestPath === "legal" && !personalNumber.trim())
                            }
                            onClick={() => generateEmailForSite(site)}
                        >
                            {loadingSite === site.name
                                ? "Genererar..."
                                : requestPath === "legal"
                                ? "Generera juridisk mall"
                                : "Generera mejl med AI"}
                        </button>
                    ) : (
                        <div>
                            <textarea
                                readOnly
                                value={`Ämne: ${generatedEmails[site.name].subject}\n\n${generatedEmails[site.name].body}`}
                                style={{ minHeight: 160, width: "100%", marginBottom: 8 }}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
                                <a href={mailtoLink(site)}>
                                    <button className="btn" type="button">Öppna i mejlklient</button>
                                </a>
                                <button
                                    className="btn btn-secondary"
                                    type="button"
                                    onClick={() => generateEmailForSite(site)}
                                    disabled={loadingSite === site.name}
                                >
                                    Generera om
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {error && (
                <div style={{ marginTop: 8 }}>
                    <small className="hint">{error}</small>
                </div>
            )}

            <div className="actions">
                <button className="btn btn-secondary" type="button" onClick={() => { setError(""); setStep(3); }}>Tillbaka</button>
                <button className="btn" type="button" onClick={prepareAndGoToStep5} disabled={isPreparingStep5}>
                    {isPreparingStep5 ? "Förbereder..." : "Nästa"}
                </button>
            </div>
        </div>
    );
}
