import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

import { getPrivacyRequests, sendReminder, deletePrivacyRequest } from "../api/privacyRequestsApi";
import { deleteAccount } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { translateStatus } from "../utils/translations";
import { mockRequests } from "../mocks/mockData";

import { useEffect, useRef, useState } from "react"

function DashboardPage(){

// ref pekar på donut-diven i JSX (<div className="donut" ref={ref}>).
// Utan den vet inte JavaScript vilken div det handlar om när animationen ska uppdatera CSS-variablerna.
const ref = useRef(null)
const navigate = useNavigate();
const { logout } = useAuth();
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteLoading, setDeleteLoading] = useState(false);
const [pendingDeleteIds, setPendingDeleteIds] = useState(null);
const [deleteError, setDeleteError] = useState(null);
const [loadError, setLoadError] = useState(null);
const [accountDeleteError, setAccountDeleteError] = useState(null);
const [accountDeleted, setAccountDeleted] = useState(false);

// Raderar kontot permanent via backend, loggar ut och visar bekräftelseruta.
async function handleDeleteAccount() {
    setDeleteLoading(true);
    setAccountDeleteError(null);
    try {
        await deleteAccount();
        setShowDeleteConfirm(false);
        setAccountDeleted(true);
    } catch (err) {
        setDeleteLoading(false);
        setAccountDeleteError("Kunde inte radera kontot. Försök igen.");
    }
}


    // Initieras med mockRequests som placeholder tills backend svarar.
    // Om backend returnerar data ersätts mock-datan (se useEffect nedan).
    const [requests, setRequests] = useState(mockRequests);
    const [usingMockData, setUsingMockData] = useState(false);

// reminderState — håller koll på varje ärendes påminnelseknapp: null | "loading" | "sent" | "error"
const [reminderState, setReminderState] = useState({});

async function handleDelete(id) {
    try {
        await deletePrivacyRequest(id);
        setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
        setDeleteError("Kunde inte radera ärendet. Försök igen.");
    }
}

async function handleSendReminder(id) {
    setReminderState(s => ({ ...s, [id]: "loading" }));
    try {
        await sendReminder(id);
        setReminderState(s => ({ ...s, [id]: "sent" }));
        // Återställ "Skickad" efter 4 sekunder så användaren kan skicka igen vid behov.
        setTimeout(() => setReminderState(s => ({ ...s, [id]: null })), 4000);
    } catch {
        setReminderState(s => ({ ...s, [id]: "error" }));
        // Återställ felstatus efter 4 sekunder så användaren kan försöka igen.
        setTimeout(() => setReminderState(s => ({ ...s, [id]: null })), 4000);
    }
}

// Filter-state — håller koll på vilka statusar som är aktiva
// pagaende = draft, generated, waiting | avslutad = complete, denied
const [filters, setFilters] = useState({ pagaende: true, avslutad: true, utkast: true });
const [showFilterDropdown, setShowFilterDropdown] = useState(false);

useEffect(() => {
    function handleEsc(e) { if (e.key === "Escape") setShowFilterDropdown(false); }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
}, []);

// Visar vilken text som ska stå på filter-knappen
const filterLabel = filters.pagaende && filters.avslutad && filters.utkast ? "Alla"
    : filters.utkast && !filters.pagaende && !filters.avslutad ? "Utkast"
    : filters.pagaende ? "Pågående"
    : filters.avslutad ? "Avslutad"
    : "Alla";

// Donuten räknar bara skickade ärenden — inte utkast eller genererade
const sentRequests = requests.filter(r => !["draft", "generated"].includes(r.status));
const sentTotal = sentRequests.length || 1;
const completePercent = Math.round((sentRequests.filter(r => r.status === "complete").length / sentTotal) * 100);
const waitingPercent = Math.round((sentRequests.filter(r => r.status === "waiting" || r.status === "sent").length / sentTotal) * 100);
const deniedPercent = Math.round((sentRequests.filter(r => r.status === "denied").length / sentTotal) * 100);

// draft + generated = inte skickat än → grupperas till EN rad
// sent, waiting, complete, denied = skickat → separata rader
const notSentStatuses = ["draft", "generated"];
const drafts = requests.filter(r => notSentStatuses.includes(r.status));
const combinedDraft = drafts.length > 0 ? {
    id: drafts[0].id,
    company_name: drafts.length === 1 ? drafts[0].company_name : `Flera valda`,
    status: "draft",
    _allDraftIds: drafts.map(d => d.id),
} : null;

const filteredRequests = [
    ...(filters.utkast && combinedDraft ? [combinedDraft] : []),
    ...requests.filter((req) => {
        if (notSentStatuses.includes(req.status)) return false;
        const pagaende = ["sent", "waiting"].includes(req.status);
        const avslutad = ["complete", "denied"].includes(req.status);
        return (pagaende && filters.pagaende) || (avslutad && filters.avslutad);
    }),
];


// Återställer notis-state varje gång dashboarden laddas (demo-läge).
// I produktion ska detta tas bort — notiser ska inte återställas automatiskt.
useEffect(() => {
    localStorage.removeItem("dismissedNotifications");
    localStorage.setItem("unreadRequests", JSON.stringify([1]));
}, []);

useEffect(() => {
    async function load() {
        try {
            const data = await getPrivacyRequests();
            if (data.length > 0) {
                setRequests(data);
                setUsingMockData(false);
            }
        } catch (err) {
            setLoadError("Kunde inte hämta ärenden från servern. Visar lokal data.");
        }
    }
    load();
}, [])



// Animation JS 
useEffect(() => { 

    // ref pekar på donut-diven i JSX (<div className="donut" ref={ref}>). 
    // .current hämtar ut den faktiska div-noden.
    const donut = ref.current;
    // Skyddar mot krasch om ref inte är satt ännu (t.ex. om komponenten avmonteras innan animationen startar).
    if (!donut) return;
    const center = donut.querySelector(".donut-center");
    if (!center) return;

    // string to int
    // donut.dataset — hämtar data-* attributen från donut-diven i JSX:
    // parseInt(...) — gör om textsträngen till ett heltal.
    // Varför? För att data-* attribut alltid är text i HTML. Utan parseInt kan du inte göra matematik på dem.
    const complete = parseInt(donut.dataset.complete);
    const waiting = parseInt(donut.dataset.waiting);
    const denied = parseInt(donut.dataset.denied);
    // currentComplete är den variabeln som håller koll på "hur stor är complete-delen just nu". 
    // Den börjar på 0 och ökar lite för varje frame tills den når 30.
    let currentComplete = 0;
    let currentWaiting = 0;
    let currentDenied = 0;
    // Animationen delas upp i 100 steg totalt.
    const animationSteps = 100;
    // Räknaren som håller koll på vilket steg vi är på just nu. Börjar på 0, ökar med 1 för varje frame.
    // En frame är en bild som webläsaren ritar - precis som en film består av många bilder/sek
    // Webbläsaren ritar 60 frames per sekund normalt. Varje gång den ritar en ny bild = en frame.
    // requestAnimationFrame(animateDonut) i koden säger: "nästa gång webbläsaren ritar en frame, kör animateDonut igen."
    // Så animationen körs 60 gånger per sekund, och varje gång ökas step med 1 tills den når 100.
    let step = 0;

    // Varje frame: step ökar → alla tre beräknas om → donuten uppdateras → ser ut som smooth animation.
    const animateDonut = () => {
        step++;
        currentComplete = (complete / animationSteps) * step;
        currentWaiting = (waiting / animationSteps) * step;
        currentDenied = (denied / animationSteps) * step;

        donut.style.setProperty('--complete', `${currentComplete}%`);
        donut.style.setProperty('--waiting', `${currentComplete + currentWaiting}%`);
        donut.style.setProperty('--denied', `${currentComplete + currentWaiting + currentDenied}%`);

        // Kollar om animationen är klar. animationSteps = 100, så den fortsätter bara om step är mindre än 100.
        if (step < animationSteps) {
            // Säger till webbläsaren: "nästa frame, kör animateDonut igen." Det är så loopen fungerar 
            // — funktionen anropar sig själv om och om igen tills step når 100.
            requestAnimationFrame(animateDonut);
        }
    };
    // Startar donut-animationen. Utan den här raden sker ingenting 
    // funktionen är definierad och anropas här
    animateDonut();
    // Räknaren för siffran i donut-centern. Börjar på 0 och räknas upp mot slutvärdet.
    let total = 0;
    // Hämtar totalt antal ärenden från data-total attributet
    const totalCount = parseInt(donut.dataset.total) || 0;


    // const animateCenter = () => { Definierar animationsfunktionen för siffran i donut-centern.
    const animateCenter = () => {
    // if (total < totalCount) Kollar om animationen är klar. 
    // Fortsätter bara om total är mindre än antalet ärenden. 
    if (total < totalCount) {
        // ökar räknaren med 1
        total++;
        // center.firstChild.textContent = total
        // Uppdaterar siffran som syns i donut-centern till det nya värdet. center är donut-center-diven, firstChild är textnoden inuti den (siffran 0 i JSX).
        center.firstChild.textContent = total;
        // setTimeout(animateCenter, 1000 / totalCount)
        //Väntar en liten stund och anropar sedan sig själv igen. 
        // 1000 / totalCount = hur många millisekunder mellan varje steg.
        setTimeout(animateCenter, 1000 / totalCount);
    }
};

    animateCenter();
}, [requests])




return(

<section className="dashboard">
    <TopBar />

    <div className="container">
    <div className="dashboard-header">
        <h1>Mina ärenden</h1>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>Tillbaka</button>
    </div>


    {/* Filter (vänster) + Donut (höger) */}
    <div className="dashboard-top">
        <div className="filter-dropdown-wrapper">
            <button className="filter-dropdown-btn" onClick={() => setShowFilterDropdown(v => !v)}>
                {filterLabel}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            {showFilterDropdown && (
                <div className="filter-dropdown-menu">
                    <div className="filter-dropdown-item" onClick={() => { setFilters({ pagaende: true, avslutad: true, utkast: true }); setShowFilterDropdown(false); }}>Alla</div>
                    <div className="filter-dropdown-item" onClick={() => { setFilters({ pagaende: false, avslutad: false, utkast: true }); setShowFilterDropdown(false); }}>Utkast</div>
                    <div className="filter-dropdown-item" onClick={() => { setFilters({ pagaende: true, avslutad: false, utkast: false }); setShowFilterDropdown(false); }}>Pågående</div>
                    <div className="filter-dropdown-item" onClick={() => { setFilters({ pagaende: false, avslutad: true, utkast: false }); setShowFilterDropdown(false); }}>Avslutad</div>
                </div>
            )}
        </div>

        <div className="donut" ref={ref} data-waiting={waitingPercent} data-complete={completePercent} data-denied={deniedPercent} data-total={sentRequests.length}>
            <div className="donut-center">
                0
                <span>Ärenden</span>
            </div>
        </div>
    </div>

    {loadError && (
        <p className="hint" style={{ color: "orange", marginBottom: 8 }}>{loadError}</p>
    )}
    {usingMockData && !loadError && (
        <p className="hint" style={{ color: "orange", marginBottom: 8 }}>Visar exempeldata — ansluter till servern...</p>
    )}
    <div className="border">
    {/* Caselist */}
    <div className="case-list">
        
        {/* Header Row */} 
        <div className="case-row header">
            <div className="cell">Företag</div>
            <div className="cell">Status</div>
            <div className="cell">Åtgärder</div>
        </div>

{filteredRequests.map((one) => (
    <div className="case-row" key={one.id}>
        <div className="cell">{one.company_name}</div>
        {/* Dynamisk CSS-klass kombinerar "cell status" med ärendets status (t.ex. "cell status waiting").
            CSS:en använder .status.waiting, .status.complete etc. för att färgsätta varje status. */}
        <div className={`cell status ${one.status}`}>{translateStatus(one.status)}</div>
        <div className="cell case-actions">
            <button className="btn-dashboard" onClick={() => navigate(one.status === "draft" ? "/create-request" : `/messages?id=${one.id}`)}>Visa</button>
            {one.status === "draft" && (
                <button className="btn-dashboard" onClick={() => setPendingDeleteIds(one._allDraftIds || [one.id])}>Radera</button>
            )}
            {one.status !== "draft" && (
                <button
                    className="btn-dashboard"
                    onClick={() => handleSendReminder(one.id)}
                    disabled={reminderState[one.id] === "loading" || reminderState[one.id] === "sent"}
                >
                    {reminderState[one.id] === "loading" ? "Skickar..." :
                     reminderState[one.id] === "sent" ? "Skickad" :
                     reminderState[one.id] === "error" ? "Försök igen" :
                     "Skicka påminnelse"}
                </button>
            )}
        </div>
    </div>
))}
    {/* Kolla om listan är tom. Om den är det = "Du har inga ärenden ännu"  */}

    {filteredRequests.length === 0 && (
    <p className="muted">Inga ärenden matchar filtret.</p>
)}
    {deleteError && (
    <p className="hint" style={{ color: "red", padding: "8px 16px" }}>{deleteError}</p>
)}

        </div>
    </div>

    <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e2e8f0", paddingLeft: 40 }}>
        <button
            className="btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
        >
            Radera mitt konto
        </button>
    </div>
    </div>

    {showDeleteConfirm && (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Är du säker?</h2>
                <p className="muted">Ditt konto och all kopplad data raderas permanent. Detta går inte att ångra.</p>
                {accountDeleteError && (
                    <p className="hint" style={{ color: "red" }}>{accountDeleteError}</p>
                )}
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleteLoading}>
                        Avbryt
                    </button>
                    <button className="btn-danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
                        {deleteLoading ? "Raderar..." : "Ja, radera mitt konto"}
                    </button>
                </div>
            </div>
        </div>
    )}

    {accountDeleted && (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Kontot raderat</h2>
                <p className="muted">Ditt konto och all kopplad data har raderats permanent.</p>
                <div className="modal-actions">
                    <button className="btn" onClick={() => { logout(); navigate("/", { replace: true }); }}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    )}

    {pendingDeleteIds && (
        <div className="modal-overlay">
            <div className="modal-card">
                <h2>Är du säker?</h2>
                <p className="muted">Utkastet raderas permanent. Detta går inte att ångra.</p>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setPendingDeleteIds(null)}>Avbryt</button>
                    <button className="btn-danger" onClick={async () => {
                        await Promise.all(pendingDeleteIds.map(id => handleDelete(id)));
                        setPendingDeleteIds(null);
                    }}>Ja, radera</button>
                </div>
            </div>
        </div>
    )}

</section>

)
}

export default DashboardPage