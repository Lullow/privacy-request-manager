import StepIndicator from "../../components/StepIndicator";
import GDPRConsent from "../../components/GDPRConsent";

// Steg 5: Användaren signerar fullmakten digitalt via GDPRConsent-komponenten.
// När signeringen är klar navigeras användaren till steg 6 OCH alla begäranden
// skickas parallellt via handleSendAll. Personnummer skickas bara med vid juridisk begäran.
export default function Step5Sign({ fullName, requestIds, requestPath, personalNumber, handleSendAll, setStep }) {
    return (
        <div>
            <StepIndicator current={5} onNavigate={setStep} />
            <h1>Signera fullmakt</h1>
            <p className="muted">Granska och godkänn dina begäranden. Detta är ditt sista steg.</p>
            <GDPRConsent
                userName={fullName}
                onComplete={() => {
                    // Navigera till steg 6 direkt — sändningen sker i bakgrunden
                    // och statusen uppdateras löpande i sendStatus-state.
                    setStep(6);
                    handleSendAll(
                        requestIds,
                        requestPath === "legal" ? personalNumber : null
                    );
                }}
                onBack={() => setStep(4)}
            />
        </div>
    );
}
