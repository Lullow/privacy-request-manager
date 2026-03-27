import StepIndicator from "../../components/StepIndicator";
import { SITES } from "../../data/sites";

export default function Step2Search({
    fullName, city,
    selectedSearchSites, toggleSite,
    setStep,
}) {
    return (
        <div>
            <StepIndicator current={2} onNavigate={setStep} />
            <h1>Sök upp dig</h1>
            <p className="muted">
                Välj sajter du vill söka på och öppna varje sajt via "Öppna"-knappen — se om du har träffar.
            </p>

            <div className="chip-grid" style={{ marginTop: 16 }}>
                {SITES.map((site) => (
                    <label className="chip" key={site.name}>
                        <input
                            type="checkbox"
                            checked={selectedSearchSites.includes(site.name)}
                            onChange={() => toggleSite("search", site.name)}
                        />
                        <span>{site.name}</span>
                    </label>
                ))}
            </div>

            {selectedSearchSites.length > 0 && (
                <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <small className="muted" style={{ marginRight: 4 }}>Öppna:</small>
                    {selectedSearchSites.map((name) => {
                        const site = SITES.find((s) => s.name === name);
                        if (!site) return null;
                        return (
                            <a
                                key={name}
                                href={site.searchUrl(fullName.trim(), city.trim())}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: "0.82rem",
                                    padding: "4px 12px",
                                    borderRadius: 999,
                                    border: "1px solid currentColor",
                                    whiteSpace: "nowrap",
                                    textDecoration: "none",
                                }}
                            >
                                {name} ↗
                            </a>
                        );
                    })}
                </div>
            )}

            <div className="actions">
                <button className="btn btn-secondary" type="button" onClick={() => setStep(1)}>Tillbaka</button>
                <button className="btn" type="button" onClick={() => setStep(3)}>Nästa</button>
            </div>
        </div>
    );
}
