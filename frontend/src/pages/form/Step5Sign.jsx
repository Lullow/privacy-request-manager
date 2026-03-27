import StepIndicator from "../../components/StepIndicator";
import GDPRConsent from "../../components/GDPRConsent";

export default function Step5Sign({ fullName, requestIds, requestPath, personalNumber, handleSendAll, setStep }) {
    return (
        <div>
            <StepIndicator current={5} onNavigate={setStep} />
            <h1>Signera fullmakt</h1>
            <p className="muted">Granska och godkänn dina begäranden. Detta är ditt sista steg.</p>
            <GDPRConsent
                userName={fullName}
                onComplete={() => {
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
