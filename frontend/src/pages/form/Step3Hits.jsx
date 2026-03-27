import StepIndicator from "../../components/StepIndicator";
import { SITES } from "../../data/sites";

// Steg 3: Användaren markerar vilka sajter de faktiskt hittades på (baserat på steg 2).
// Minst en sajt måste väljas för att kunna gå vidare — dessa skickas sedan som
// selectedRemoveSites till steg 4 där borttagningsbegäranden skapas.
export default function Step3Hits({
    selectedRemoveSites, toggleSite,
    error, setError,
    setStep,
}) {
    return (
        <div>
            <StepIndicator current={3} onNavigate={setStep} />
            <h1>Var hittades du?</h1>
            <p className="muted">Välj de sajter där du fick träff och vill bli borttagen från — klicka sedan på Nästa.</p>

            <div className="chip-grid" style={{ marginTop: 16 }}>
                {SITES.map((site) => (
                    <label className="chip" key={site.name}>
                        <input
                            type="checkbox"
                            checked={selectedRemoveSites.includes(site.name)}
                            onChange={() => toggleSite("remove", site.name)}
                        />
                        <span>{site.name}</span>
                    </label>
                ))}
            </div>

            {error && <small className="hint" style={{ display: "block", marginBottom: 8 }}>{error}</small>}
            <div className="actions">
                <button className="btn btn-secondary" type="button" onClick={() => { setError(""); setStep(2); }}>Tillbaka</button>
                <button
                    className="btn"
                    type="button"
                    onClick={() => {
                        if (selectedRemoveSites.length === 0) {
                            setError("Välj minst en sajt för att fortsätta.");
                            return;
                        }
                        setError("");
                        setStep(4);
                    }}
                >
                    Nästa
                </button>
            </div>
        </div>
    );
}
