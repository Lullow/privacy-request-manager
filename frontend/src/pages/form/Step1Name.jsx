import StepIndicator from "../../components/StepIndicator";

// Steg 1: Samlar in namn, ort, födelsedag och kräver att användaren godkänner
// integritetspolicyn och användarvillkoren innan de kan fortsätta.
export default function Step1Name({
    fullName, setFullName,
    city, setCity,
    birthDate, setBirthDate,
    acceptedTerms, setAcceptedTerms,
    confirmedData, setConfirmedData,
    error, setError,
    onBack, setStep,
}) {
    return (
        <div>
            <StepIndicator current={1} onNavigate={setStep} />
            <h1>Vem är du?</h1>
            <p className="muted">Ange ditt namn och ort för att söka upp dig på personregistren.</p>

            <div className="field" style={{ marginTop: 16 }}>
                <label>Ditt namn *</label>
                <input
                    type="text"
                    placeholder="För- och efternamn"
                    value={fullName}
                    // Tillåter bara bokstäver (inkl. svenska), bindestreck och apostrof.
                    // Förhindrar att siffror eller specialtecken hamnar i namnet.
                    onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-ZåäöÅÄÖéèüÜ\s\-']/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && fullName.trim() && setStep(2)}
                    autoFocus
                />
            </div>
            <div className="field" style={{ marginTop: 16 }}>
                <label>Ort <span className="muted">(valfritt, ger färre träffar)</span></label>
                <input
                    type="text"
                    placeholder="Ex: Stockholm"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fullName.trim() && setStep(2)}
                />
            </div>
            <div className="field" style={{ marginTop: 16 }}>
                <label>Födelsedag <span className="muted">(rekommenderas — hjälper sajterna att identifiera dig)</span></label>
                <input
                    type="date"
                    value={birthDate}
                    min="1900-01-01"
                    max={new Date().toISOString().split("T")[0]}
                    // Begränsar årtalet till max 4 siffror för att undvika ogiltiga datum
                    // som webbläsarens date-input annars kan acceptera (t.ex. år 12345).
                    onChange={(e) => {
                        const val = e.target.value;
                        if (!val || val.split("-")[0].length <= 4) setBirthDate(val);
                    }}
                />
            </div>

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <span className="muted" style={{ fontSize: "0.82rem", lineHeight: 1.55 }}>
                        Jag har läst och godkänner{" "}
                        <a href="/integritetspolicy" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>integritetspolicyn</a>
                        {" "}och{" "}
                        <a href="/villkor" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>användarvillkoren</a>.
                    </span>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={confirmedData}
                        onChange={(e) => setConfirmedData(e.target.checked)}
                        style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <span className="muted" style={{ fontSize: "0.82rem", lineHeight: 1.55 }}>
                        Jag bekräftar att uppgifterna jag lämnar är korrekta och att Privacy Request Manager får behandla dem för att skapa och skicka min begäran.
                    </span>
                </label>
            </div>

            {error && <small className="hint" style={{ display: "block", marginTop: 8, marginBottom: 0 }}>{error}</small>}
            <div className="actions">
                <button className="btn btn-secondary" type="button" onClick={onBack}>Avbryt</button>
                <button
                    className="btn"
                    type="button"
                    onClick={() => {
                        if (!fullName.trim()) {
                            setError("Fyll i ditt namn för att fortsätta.");
                            return;
                        }
                        if (!acceptedTerms || !confirmedData) {
                            setError("Du behöver godkänna villkoren för att fortsätta.");
                            return;
                        }
                        setError("");
                        setStep(2);
                    }}
                >
                    Nästa
                </button>
            </div>
        </div>
    );
}
