import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { createPrivacyRequest, generateMessage, sendRequest, getPrivacyRequests } from "../api/privacyRequestsApi";
import { SITES } from "../data/sites";

import Step1Name from "./form/Step1Name";
import Step2Search from "./form/Step2Search";
import Step3Hits from "./form/Step3Hits";
import Step4Remove from "./form/Step4Remove";
import Step5Sign from "./form/Step5Sign";
import Step6Done from "./form/Step6Done";

// Läser in sparad wizard-state från sessionStorage.
// sessionStorage rensas automatiskt när fliken stängs — känslig data stannar inte kvar.
function getSaved() {
    try {
        const saved = sessionStorage.getItem("prm_wizard");
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
}

function FormPage() {
    const navigate = useNavigate();
    const onBack = () => navigate("/");
    const s = getSaved();

    // --- Wizard-state ---
    // Alla dessa värden sparas löpande i sessionStorage (se useEffect nedan)
    // så att användaren kan ladda om sidan utan att tappa data.
    const [step, setStep] = useState(s.step || 1);
    const [fullName, setFullName] = useState(s.fullName || "");
    const [city, setCity] = useState(s.city || "");
    const [birthDate, setBirthDate] = useState(s.birthDate || "");
    const [selectedSearchSites, setSelectedSearchSites] = useState(s.selectedSearchSites || []);
    const [selectedRemoveSites, setSelectedRemoveSites] = useState(s.selectedRemoveSites || []);
    const [requestTypes, setRequestTypes] = useState(s.requestTypes || ["delete"]);
    const [tone, setTone] = useState(s.tone || "neutral");
    const [requestPath, setRequestPath] = useState(s.requestPath || "simple");
    const [generatedEmails, setGeneratedEmails] = useState({});
    // requestIds: { [sajtnamn]: databas-id } — kopplar sajt till ärende-ID i backend.
    const [requestIds, setRequestIds] = useState(s.requestIds || {});
    // sendStatus: { [sajtnamn]: "sending" | "sent" | "failed" } — visas i steg 6.
    const [sendStatus, setSendStatus] = useState({});
    const [isPreparingStep5, setIsPreparingStep5] = useState(false);
    const [showToneDropdown, setShowToneDropdown] = useState(false);
    const [loadingSite, setLoadingSite] = useState(null);
    const [copiedSite, setCopiedSite] = useState(null);
    const [error, setError] = useState("");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [confirmedData, setConfirmedData] = useState(false);

    // Juridiska fält — sparas INTE i sessionStorage eftersom personnummer
    // aldrig ska lagras persistent, inte ens temporärt i webbläsaren.
    const [personalNumber, setPersonalNumber] = useState("");
    const [personalNumberError, setPersonalNumberError] = useState("");
    const [showPersonalNumber, setShowPersonalNumber] = useState(false);
    const [legalAddress, setLegalAddress] = useState("");
    const [legalPhone, setLegalPhone] = useState("");
    const [legalEmail, setLegalEmail] = useState("");
    const [legalEmailError, setLegalEmailError] = useState("");

    // Används för att skilja på webbläsarnavigation (bakåt/framåt) och
    // programmatisk stegnavigation — förhindrar att history-stacken byggs upp felaktigt.
    const isBrowserNav = useRef(false);

    // Stänger ton-dropdown med Escape-tangenten.
    useEffect(() => {
        function handleEsc(e) { if (e.key === "Escape") setShowToneDropdown(false); }
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, []);

    // Sparar wizard-state i sessionStorage varje gång relevanta värden ändras.
    // Personnummer ingår medvetet INTE i listan.
    useEffect(() => {
        sessionStorage.setItem("prm_wizard", JSON.stringify({
            step, fullName, city, birthDate, selectedSearchSites, selectedRemoveSites, requestTypes, tone, requestPath, requestIds,
        }));
    }, [step, fullName, city, birthDate, selectedSearchSites, selectedRemoveSites, requestTypes, tone, requestPath, requestIds]);

    // Synkar wizard-stegen med webbläsarens history-stack så att bakåtknappen fungerar.
    // replaceState på steg 1 undviker att lägga till ett extra entry på den initiala sidan.
    useEffect(() => {
        if (isBrowserNav.current) {
            isBrowserNav.current = false;
            return;
        }
        if (step === 1) {
            window.history.replaceState({ step }, "");
        } else {
            window.history.pushState({ step }, "");
        }
    }, [step]);

    // Lyssnar på webbläsarens bakåt/framåt-navigation och uppdaterar wizard-steget.
    useEffect(() => {
        function handlePopState(e) {
            const targetStep = e.state?.step;
            if (targetStep !== undefined) {
                isBrowserNav.current = true;
                setStep(targetStep);
                setError("");
            }
        }
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    // Gemensam toggle-funktion för båda sajt-listorna.
    // type === "search" → selectedSearchSites, type === "remove" → selectedRemoveSites.
    // Lägg till om inte finns, ta bort om den redan finns.
    function toggleSite(type, name) {
        const setArr = type === "search" ? setSelectedSearchSites : setSelectedRemoveSites;
        setArr((prev) =>
            prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
        );
    }

    function toggleRequestType(id) {
        setRequestTypes((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    // Delar upp valda sajter i två grupper baserat på borttagningsmetod.
    // emailSites: sajter som hanteras via AI-genererat mejl (Birthday, Merinfo).
    // formSites: sajter med eget BankID-formulär (Ratsit, Mrkoll, Hitta.se, Eniro).
    const emailSites = selectedRemoveSites
        .map((name) => SITES.find((s) => s.name === name))
        .filter((s) => s?.removeMethod === "email");

    const formSites = selectedRemoveSites
        .map((name) => SITES.find((s) => s.name === name))
        .filter((s) => s?.removeMethod === "form");

    // Skapar utkast i databasen för alla e-postsajter när användaren når steg 4.
    // Kontrollerar befintliga ärenden först för att undvika dubbletter vid återsökning.
    useEffect(() => {
        if (step !== 4 || !fullName.trim() || emailSites.length === 0) return;

        async function createDrafts() {
            const newIds = { ...requestIds };
            let changed = false;

            // Återanvänd befintliga utkast om de redan finns i databasen.
            try {
                const existing = await getPrivacyRequests();
                for (const site of emailSites) {
                    if (newIds[site.name]) continue;
                    const match = existing.find(
                        (r) => r.company_name === site.name && r.status === "draft"
                    );
                    if (match) {
                        newIds[site.name] = match.id;
                        changed = true;
                    }
                }
            } catch (err) {
                console.error("Kunde inte hämta befintliga ärenden", err);
            }

            // Skapa nya utkast för sajter som inte har något befintligt ärende.
            for (const site of emailSites) {
                if (newIds[site.name]) continue;
                try {
                    const req = await createPrivacyRequest({
                        company_name: site.name,
                        company_email: site.removeEmail,
                        full_name: fullName,
                        city: city || null,
                        birth_date: birthDate || null,
                        profile_url: null,
                        tone,
                    });
                    newIds[site.name] = req.id;
                    changed = true;
                } catch (err) {
                    console.error("Kunde inte skapa utkast för", site.name, err);
                }
            }
            if (changed) setRequestIds(newIds);
        }

        createDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // Genererar ett AI-mejl för en specifik sajt.
    // Vid juridisk begäran skickas personnummer och övriga juridiska fält med.
    // Skapar ett ärende i databasen om det inte redan finns.
    async function generateEmailForSite(site) {
        if (requestPath === "legal" && !personalNumber.trim()) {
            setError("Personnummer krävs för juridisk begäran.");
            return;
        }
        setLoadingSite(site.name);
        setError("");
        try {
            let requestId = requestIds[site.name];
            if (!requestId) {
                const requestData = await createPrivacyRequest({
                    company_name: site.name,
                    company_email: site.removeEmail,
                    full_name: fullName,
                    city: city || null,
                    birth_date: birthDate || null,
                    profile_url: null,
                    tone,
                });
                requestId = requestData.id;
                setRequestIds((prev) => ({ ...prev, [site.name]: requestId }));
            }
            const msgPayload = { tone, message_type: "initial_request", request_types: requestTypes };
            if (birthDate) msgPayload.birth_date = birthDate;
            if (requestPath === "legal") {
                msgPayload.use_legal_template = true;
                msgPayload.personal_number = personalNumber.trim();
                if (legalAddress.trim()) msgPayload.legal_address = legalAddress.trim();
                if (legalPhone.trim()) msgPayload.legal_phone = legalPhone.trim();
                if (legalEmail.trim()) msgPayload.legal_email = legalEmail.trim();
            }
            const msgData = await generateMessage(requestId, msgPayload);
            setGeneratedEmails((prev) => ({
                ...prev,
                [site.name]: {
                    subject: msgData.subject || "",
                    body: msgData.message_body || "",
                },
            }));
        } catch (err) {
            setError(err.message || "Något gick fel vid generering.");
        } finally {
            setLoadingSite(null);
        }
    }

    // Bygger en fullständig juridisk brevmall lokalt utan att anropa AI.
    // Används som fallback (mailto-länk) och vid juridisk begäran för form-sajter.
    // Personnummer inkluderas i texten men lagras aldrig — texten lever bara i webbläsaren.
    function buildLegalTemplate() {
        const identityLines = [
            `• Fullständigt namn: ${fullName}`,
            `• Personnummer: ${personalNumber}`,
            birthDate ? `• Födelsedag: ${birthDate}` : null,
            city ? `• Ort: ${city}` : null,
            legalAddress ? `• Adress: ${legalAddress}` : null,
            legalPhone ? `• Telefon: ${legalPhone}` : null,
            legalEmail ? `• E-post: ${legalEmail}` : null,
        ].filter(Boolean).join("\n");

        return `Hej,

Jag agerar som ombud för ${fullName}, personnummer ${personalNumber}, med stöd av bifogad fullmakt. Denna begäran görs i enlighet med artikel 17 i EU:s dataskyddsförordning (GDPR).

Den registrerade begär att samtliga personuppgifter som rör honom/henne raderas från era system och tjänster, inklusive men inte begränsat till:
• Namn, adress och kontaktuppgifter
• Telefonnummer
• Eventuella foton eller profilbilder
• All övrig data kopplad till den registrerade

Identifiering
Följande uppgifter tillhandahålls för att verifiera den registrerades identitet:
${identityLines}

Vi anser att ovanstående uppgifter är tillräckliga för att verifiera den registrerades identitet i enlighet med GDPR artikel 12.6. Enligt artikel 12.2 får ytterligare identifiering, såsom kopia på ID-handling eller krav på BankID, endast begäras om ni har rimliga tvivel kring den registrerades identitet. Då vi tillhandahåller personnummer och övriga registeruppgifter som redan finns i ert system bör sådana tvivel inte föreligga.

Rättslig grund
Enligt GDPR artikel 12.3 ska ni bekräfta att raderingen har genomförts utan onödigt dröjsmål och senast inom en månad från mottagandet av denna begäran.

Om ni anser att det finns rättslig grund att behålla uppgifterna, ber vi er specificera exakt vilken grund enligt GDPR artikel 17.3 ni åberopar samt motivera detta skriftligen.

Gällande utgivningsbevis och YGL-undantaget
IMY har i sitt rättsliga ställningstagande IMYRS 2024:1 (publicerat 14 maj 2024) bedömt att myndigheten är behörig att inleda tillsyn mot söktjänster med utgivningsbevis. IMY konstaterar att den svenska regleringen som ger söktjänster med utgivningsbevis generella undantag från GDPR inte är förenlig med EU-rätten. Mot denna bakgrund anser vi att utgivningsbeviset inte utgör giltig grund för att avslå denna raderingsbegäran.

Konsekvenser vid utebliven åtgärd
Om begäran inte besvaras inom en månad kommer vi att anmäla ärendet till IMY (GDPR art. 77) och begära avindexering från sökmotorer.

Med vänliga hälsningar,
Privacy Request Manager
på uppdrag av ${fullName}

Bilagor: Fullmakt (elektroniskt undertecknad)
Referenser: GDPR art. 12, 17, 77 · IMY IMYRS 2024:1 · Dataskyddslagen (2018:218) § 7`;
    }

    // Bygger en mailto-länk med AI-genererat ämne och brödtext för en specifik sajt.
    function mailtoLink(site) {
        const email = generatedEmails[site.name];
        if (!email) return "#";
        return `mailto:${site.removeEmail}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    }

    // Returnerar antingen AI-genererad mailto-länk eller en fallback med juridisk mall.
    // Används i steg 6 om ett AI-mejl inte genererades innan avsändning.
    function getMailtoFallback(site) {
        if (generatedEmails[site.name]) return mailtoLink(site);
        const subject = encodeURIComponent(`Raderingsbegäran GDPR – ${fullName}`);
        return `mailto:${site.removeEmail}?subject=${subject}&body=${encodeURIComponent(buildLegalTemplate())}`;
    }

    // Skickar alla ärenden parallellt via Promise.all.
    // Varje sajt får sin egen status (sending/sent/failed) som visas i steg 6.
    async function handleSendAll(ids, personalNum = null) {
        const entries = Object.entries(ids);
        if (entries.length === 0) return;
        await Promise.all(
            entries.map(async ([siteName, id]) => {
                setSendStatus((prev) => ({ ...prev, [siteName]: "sending" }));
                try {
                    await sendRequest(id, personalNum);
                    setSendStatus((prev) => ({ ...prev, [siteName]: "sent" }));
                } catch {
                    setSendStatus((prev) => ({ ...prev, [siteName]: "failed" }));
                }
            })
        );
    }

    // Förbereder ärenden för form-sajter (Ratsit, Mrkoll m.fl.) vid juridisk begäran
    // innan användaren går till signeringssteget. Skapar och genererar juridiska mejl
    // så att de finns redo att skickas när användaren signerat.
    async function prepareAndGoToStep5() {
        setError("");
        if (requestPath === "legal" && personalNumber.trim() && formSites.length > 0) {
            setIsPreparingStep5(true);
            try {
                const newIds = { ...requestIds };
                for (const site of formSites) {
                    if (newIds[site.name]) continue;
                    const req = await createPrivacyRequest({
                        company_name: site.name,
                        company_email: site.removeEmail,
                        full_name: fullName,
                        city: city || null,
                        birth_date: birthDate || null,
                        profile_url: null,
                        tone,
                    });
                    const msgPayload = {
                        tone,
                        message_type: "initial_request",
                        request_types: requestTypes,
                        use_legal_template: true,
                        personal_number: personalNumber.trim(),
                    };
                    if (birthDate) msgPayload.birth_date = birthDate;
                    if (legalAddress.trim()) msgPayload.legal_address = legalAddress.trim();
                    if (legalPhone.trim()) msgPayload.legal_phone = legalPhone.trim();
                    if (legalEmail.trim()) msgPayload.legal_email = legalEmail.trim();
                    await generateMessage(req.id, msgPayload);
                    newIds[site.name] = req.id;
                }
                setRequestIds(newIds);
            } catch (err) {
                setError("Kunde inte förbereda alla begäranden: " + (err.message || "Något gick fel."));
                setIsPreparingStep5(false);
                return;
            }
            setIsPreparingStep5(false);
        }
        setStep(5);
    }

    // Samlar alla props som Step4Remove behöver i ett objekt för att hålla JSX-koden ren.
    const sharedStep4Props = {
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
        generateEmailForSite, mailtoLink,
        buildLegalTemplate,
        emailSites, formSites,
        error, setError,
        isPreparingStep5, prepareAndGoToStep5,
        setStep,
    };

    return (
        <div className="page">
            <TopBar onBack={onBack} />
            <main className="container">
                <div className="card">
                    {step === 1 && (
                        <Step1Name
                            fullName={fullName} setFullName={setFullName}
                            city={city} setCity={setCity}
                            birthDate={birthDate} setBirthDate={setBirthDate}
                            acceptedTerms={acceptedTerms} setAcceptedTerms={setAcceptedTerms}
                            confirmedData={confirmedData} setConfirmedData={setConfirmedData}
                            error={error} setError={setError}
                            onBack={onBack} setStep={setStep}
                        />
                    )}
                    {step === 2 && (
                        <Step2Search
                            fullName={fullName} city={city}
                            selectedSearchSites={selectedSearchSites}
                            toggleSite={toggleSite}
                            setStep={setStep}
                        />
                    )}
                    {step === 3 && (
                        <Step3Hits
                            selectedRemoveSites={selectedRemoveSites}
                            toggleSite={toggleSite}
                            error={error} setError={setError}
                            setStep={setStep}
                        />
                    )}
                    {step === 4 && <Step4Remove {...sharedStep4Props} />}
                    {step === 5 && (
                        <Step5Sign
                            fullName={fullName}
                            requestIds={requestIds}
                            requestPath={requestPath}
                            personalNumber={personalNumber}
                            handleSendAll={handleSendAll}
                            setStep={setStep}
                        />
                    )}
                    {step === 6 && (
                        <Step6Done
                            selectedRemoveSites={selectedRemoveSites}
                            requestIds={requestIds}
                            requestPath={requestPath}
                            sendStatus={sendStatus}
                            getMailtoFallback={getMailtoFallback}
                            onBack={onBack}
                            // Återställer all wizard-state när användaren startar om.
                            onReset={() => {
                                setStep(1); setFullName(""); setCity("");
                                setSelectedSearchSites([]); setSelectedRemoveSites([]);
                                setGeneratedEmails({}); setRequestIds({}); setSendStatus({});
                            }}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

export default FormPage;
