import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { createPrivacyRequest, generateMessage, sendRequest, getPrivacyRequests } from "../api/privacyRequestsApi";
import GDPRConsent from "../components/GDPRConsent";

function toSearchQuery(name) {
    return encodeURIComponent(name).replace(/%20/g, "+");
}

const SITES = [
    {
        name: "Ratsit",
        searchUrl: (name, city) => `https://www.ratsit.se/sok/person?vem=${toSearchQuery(name)}${city ? `&ort=${toSearchQuery(city)}` : ""}&m=0&k=0&r=0&er=0&b=0&eb=0&amin=16&amax=120&fon=1&page=1`,
        removeMethod: "form",
        removeUrl: "https://www.ratsit.se/tabort",
        removeEmail: "kundservice@ratsit.se",
        removeSteps: [
            "Kryssa i villkorsrutan och klicka på \"Ta bort dig från Ratsit\"",
            "Välj \"Mobilt BankID\" eller \"BankID på denna enhet\"",
            "Skanna QR-koden med BankID-appen",
            "Klart — dina uppgifter tas bort inom 24 timmar",
        ],
    },
    {
        name: "Mrkoll",
        searchUrl: (name, city) => `https://mrkoll.se/resultat?n=${toSearchQuery(name)}&c=${city ? toSearchQuery(city) : ""}&min=16&max=120&sex=a&c_stat=all&company=`,
        removeMethod: "form",
        removeUrl: "https://mrkoll.se/om/kundservice-publicerade-uppgifter/",
        removeEmail: "hej@nusvar.se",
        removeSteps: [
            "Klicka på \"Logga in med Mobilt BankID\"",
            "Klicka på \"Starta inloggning med Mobilt BankID\"",
            "Skanna QR-koden med BankID-appen",
            "Välj att dölja ditt telefonnummer och/eller adress under \"Ändra uppgifter\"",
        ],
        removeNote: "Mrkoll döljer uppgifterna — de raderas inte permanent. Vill du begära permanent radering? Välj Juridisk begäran.",
    },
    {
        name: "Hitta.se",
        searchUrl: (name, city) => `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(city ? `${name} ${city}` : name)}`,
        removeMethod: "form",
        removeUrl: "https://www.hitta.se/kontakta-oss/ta-bort-kontaktsida",
        //removeEmail: "kundservice@hitta.se",
        removeEmail: "bellaroupe@gmail.com",
        removeSteps: [
            "Sök på ditt namn i sökfältet",
            "Klicka på dig själv i sökresultaten",
            "Klicka på \"Ta bort\" på din profilsida",
            "Logga in med BankID och skanna QR-koden",
            "Bekräfta borttagningen — klart!",
        ],
    },
    {
        name: "Eniro",
        searchUrl: (name, city) => `https://www.eniro.se/${toSearchQuery(city ? `${name} ${city}` : name)}/personer`,
        removeMethod: "form",
        removeUrl: "https://personer-uppdatera.eniro.se/",
        removeEmail: "info@eniro.com",
        removeSteps: [
            "Sök upp ditt namn på sidan",
            "Logga in med BankID och skanna QR-koden",
            "Följ instruktionerna på sajten för att uppdatera eller ta bort dina uppgifter",
        ],
    },
    {
        name: "Birthday",
        searchUrl: (name, city) => `https://www.birthday.se/sok?whowhere=${toSearchQuery(city ? `${name} ${city}` : name)}&similar=true`,
        removeMethod: "email",
        removeEmail: "info@birthday.se",
        removeUrl: "https://www.birthday.se/personuppgifter",
    },
    {
        name: "Merinfo",
        searchUrl: (name, city) => `https://www.merinfo.se/search?q=${toSearchQuery(city ? `${name} ${city}` : name)}`,
        removeMethod: "email",
        removeEmail: "info@merinfo.se",
        removeUrl: "https://www.merinfo.se/om",
    },
];

const REQUEST_TYPES = [
    { id: "delete", label: "Radering" },
    { id: "access", label: "Registerutdrag" },
    { id: "rectify", label: "Rättelse" },
    { id: "restrict", label: "Begränsning" },
    { id: "object", label: "Invändning" },
    { id: "portability", label: "Dataportabilitet" },
];

const STEP_LABELS = ["Ditt namn", "Sök upp dig", "Träffar", "Ta bort", "Signera"];

function StepIndicator({ current, onNavigate }) {
    return (
        <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 6 }}>
                {STEP_LABELS.map((label, i) => {
                    const stepNum = i + 1;
                    const done = stepNum < current;
                    const active = stepNum === current;
                    const clickable = done;
                    return (
                        <div
                            key={label}
                            onClick={() => clickable && onNavigate(stepNum)}
                            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: clickable ? "pointer" : "default" }}
                        >
                            <div style={{
                                height: 6,
                                width: "100%",
                                borderRadius: 999,
                                background: done || active ? "rgba(16, 32, 86, 0.85)" : "#e2e8f0",
                                opacity: active ? 1 : done ? 0.5 : 1,
                                transition: "all 0.3s ease",
                            }} />
                            <span style={{
                                fontSize: "0.72rem",
                                fontWeight: active ? 700 : 400,
                                color: active ? "rgba(16, 32, 86, 0.9)" : done ? "rgba(16, 32, 86, 0.6)" : "#94a3b8",
                                transition: "color 0.3s ease",
                                whiteSpace: "nowrap",
                                textDecoration: clickable ? "underline" : "none",
                            }}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

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
    const [requestIds, setRequestIds] = useState(s.requestIds || {});   // { [sajtnamn]: backendId }
    const [sendStatus, setSendStatus] = useState({});   // { [sajtnamn]: "sending"|"sent"|"failed" }
    const [isPreparingStep5, setIsPreparingStep5] = useState(false);
    const [showToneDropdown, setShowToneDropdown] = useState(false);

    useEffect(() => {
        function handleEsc(e) { if (e.key === "Escape") setShowToneDropdown(false); }
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, []);
    const [loadingSite, setLoadingSite] = useState(null);
    const [copiedSite, setCopiedSite] = useState(null);
    const [error, setError] = useState("");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [confirmedData, setConfirmedData] = useState(false);

    // Juridiska fält — sparas INTE i sessionStorage
    const [personalNumber, setPersonalNumber] = useState("");
    const [personalNumberError, setPersonalNumberError] = useState("");
    const [showPersonalNumber, setShowPersonalNumber] = useState(false);
    const [legalAddress, setLegalAddress] = useState("");
    const [legalPhone, setLegalPhone] = useState("");
    const [legalEmail, setLegalEmail] = useState("");
    const [legalEmailError, setLegalEmailError] = useState("");

    const isBrowserNav = useRef(false);

    // Spara wizard-state till sessionStorage när något ändras
    // OBS: personnummer och övriga juridiska fält sparas INTE
    useEffect(() => {
        sessionStorage.setItem("prm_wizard", JSON.stringify({
            step, fullName, city, birthDate, selectedSearchSites, selectedRemoveSites, requestTypes, tone, requestPath, requestIds,
        }));
    }, [step, fullName, city, birthDate, selectedSearchSites, selectedRemoveSites, requestTypes, tone, requestPath]);

    // Koppla varje steg till webbläsarens historik (ej vid browser-navigering)
    useEffect(() => {
        if (isBrowserNav.current) {
            isBrowserNav.current = false;
            return;
        }
        // Steg 1 ersätter alltid current entry så inga extra history-entries staplas
        if (step === 1) {
            window.history.replaceState({ step }, "");
        } else {
            window.history.pushState({ step }, "");
        }
    }, [step]);

    // Hantera webbläsarens back- och fram-knappar
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

    function toggleSite(setArr, name) {
        setArr((prev) =>
            prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
        );
    }

    function toggleRequestType(id) {
        setRequestTypes((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    }

    // Skapar draft-ärenden för alla email-sajter när användaren når steg 4
    // Hämtar först befintliga utkast från DB för att undvika dubletter om sessionStorage rensats
    useEffect(() => {
        if (step !== 4 || !fullName.trim() || emailSites.length === 0) return;

        async function createDrafts() {
            const newIds = { ...requestIds };
            let changed = false;

            // Hämta befintliga ärenden från DB och matcha mot sajter
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

            for (const site of emailSites) {
                if (newIds[site.name]) continue; // finns redan — hoppa över
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

    async function generateEmailForSite(site) {
        if (requestPath === "legal" && !personalNumber.trim()) {
            setError("Personnummer krävs för juridisk begäran.");
            return;
        }
        setLoadingSite(site.name);
        setError("");
        try {
            // Använd befintligt draft-id om det finns, annars skapa nytt
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

    function mailtoLink(site) {
        const email = generatedEmails[site.name];
        if (!email) return "#";
        return `mailto:${site.removeEmail}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    }

    function getMailtoFallback(site) {
        if (generatedEmails[site.name]) return mailtoLink(site);
        const subject = encodeURIComponent(`Raderingsbegäran GDPR – ${fullName}`);
        return `mailto:${site.removeEmail}?subject=${subject}&body=${encodeURIComponent(buildLegalTemplate())}`;
    }

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

    const emailSites = selectedRemoveSites
        .map((name) => SITES.find((s) => s.name === name))
        .filter((s) => s?.removeMethod === "email");

    const formSites = selectedRemoveSites
        .map((name) => SITES.find((s) => s.name === name))
        .filter((s) => s?.removeMethod === "form");

    return (
        <div className="page">
            <TopBar onBack={onBack} />
            <main className="container">
                <div className="card">

                    {/* ── STEG 1: Namn & ort ── */}
                    {step === 1 && (
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
                    )}

                    {/* ── STEG 2: Sök upp dig ── */}
                    {step === 2 && (
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
                                            onChange={() => toggleSite(setSelectedSearchSites, site.name)}
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
                                <button className="btn" type="button" onClick={() => { setError(""); setStep(3); }}>Nästa</button>
                            </div>
                        </div>
                    )}

                    {/* ── STEG 3: Var hittades du? ── */}
                    {step === 3 && (
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
                                            onChange={() => toggleSite(setSelectedRemoveSites, site.name)}
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
                    )}

                    {/* ── STEG 4: Ta bort dig ── */}
                    {step === 4 && (
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
                                            {REQUEST_TYPES.map((t) => (
                                                <label className="chip" key={t.id}>
                                                    <input
                                                        type="checkbox"
                                                        checked={requestTypes.includes(t.id)}
                                                        onChange={() => toggleRequestType(t.id)}
                                                    />
                                                    <span>{t.label}</span>
                                                </label>
                                            ))}
                                        </div>
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
                    )}

                    {/* ── STEG 5: Signera fullmakt ── */}
                    {step === 5 && (
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
                    )}

                    {/* ── STEG 6: Klar ── */}
                    {step === 6 && (
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
                                                    <span style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 600 }}>✓ Skickat</span>
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
                                <button className="btn" type="button" onClick={() => {
                                    setStep(1); setFullName(""); setCity("");
                                    setSelectedSearchSites([]); setSelectedRemoveSites([]);
                                    setGeneratedEmails({}); setRequestIds({}); setSendStatus({});
                                }}>
                                    Ny begäran
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

export default FormPage;
