import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

import { getPrivacyRequests, sendReminder, deletePrivacyRequest } from "../api/privacyRequestsApi";
import { deleteAccount } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { translateStatus } from "../utils/translations";
import { mockRequests } from "../mocks/mockData";

import { useEffect, useRef, useState } from "react"

function DashboardPage(){

// ref används för att peka på donut-diven i JSX så att animationen kan ändra dess CSS.
// useRef — skapar en referens till ett DOM-element. Utan den vet inte JavaScript vilken div det handlar om
const ref = useRef(null)
const navigate = useNavigate();
const { logout } = useAuth();
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteLoading, setDeleteLoading] = useState(false);

async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
        await deleteAccount();
        logout();
        navigate("/", { replace: true });
    } catch {
        setDeleteLoading(false);
        setShowDeleteConfirm(false);
    }
}


    // [] = startvärdet är en tom lista, för när sidan laddas har vi ingen data ännu.
    // requests — själva listan med ärenden (börjar som [])
    // requests fylls med det backend skickar tillbaka — en lista av objekt. Varje objekt är ett ärende:
    // setRequests — funktionen som ersätter listan med ny data

    const [requests, setRequests] = useState(mockRequests)

// reminderState — håller koll på varje ärendes påminnelseknapp: null | "loading" | "sent" | "error"
const [reminderState, setReminderState] = useState({});

async function handleDelete(id) {
    try {
        await deletePrivacyRequest(id);
        setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
        console.error(err);
    }
}

async function handleSendReminder(id) {
    setReminderState(s => ({ ...s, [id]: "loading" }));
    try {
        await sendReminder(id);
        setReminderState(s => ({ ...s, [id]: "sent" }));
    } catch {
        setReminderState(s => ({ ...s, [id]: "error" }));
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

// Beräknar procentvärden för donuten baserat på riktiga ärenden
const total = requests.length || 1;
const completePercent = Math.round((requests.filter(r => r.status === "complete").length / total) * 100);
const waitingPercent = Math.round((requests.filter(r => ["waiting", "generated"].includes(r.status)).length / total) * 100);
const deniedPercent = Math.round((requests.filter(r => r.status === "denied").length / total) * 100);

// Filtrerar listan baserat på aktiva filter
const filteredRequests = requests.filter((req) => {
    if (req.status === "draft") return filters.utkast;
    const pagaende = ["generated", "waiting"].includes(req.status);
    const avslutad = ["complete", "denied"].includes(req.status);
    return (pagaende && filters.pagaende) || (avslutad && filters.avslutad);
});


// getPrivacyRequests anropar apiFetch som automatiskt skickar token i headern → backend godkänner → ärenden hämtas och visas.
// Innan hade vi ingen token, backend nekade 
// Återställ notiser varje gång dashboarden laddas (för demo)
useEffect(() => {
    localStorage.removeItem("dismissedNotifications");
    localStorage.setItem("unreadRequests", JSON.stringify([1]));
}, []);

useEffect(() => {
    async function load() {
        try {
            const data = await getPrivacyRequests();
            if (data.length > 0) setRequests(data);
        } catch (err) {
            console.error(err);
        }
    }
    load();
}, [])



// Animation JS 
useEffect(() => { 

    // ref pekar på donut-diven i JSX (<div className="donut" ref={ref}>). 
    // .current hämtar ut den faktiska div-noden.
    const donut = ref.current
    // Finds child-element och donut-center class
    // querySelector är ett inbyggt webb-API — letar efter ett child-element inuti donut-diven med klassen .donut-center. 
    // Det är den lilla cirkeln i mitten med siffran.
    // Alltså: donut = hela donut-diven, center = siffran i mitten av donuten.
    const center = donut.querySelector(".donut-center");

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

        <div className="donut" ref={ref} data-waiting={waitingPercent} data-complete={completePercent} data-denied={deniedPercent} data-total={requests.length}>
            <div className="donut-center">
                0
                <span>Ärenden</span>
            </div>
        </div>
    </div>

    <div className="border">
    {/* Caselist */} 
    <div className="case-list">
        
        {/* Header Row */} 
        <div className="case-row header">
            <div className="cell">Företag</div>
            <div className="cell">Status</div>
            <div className="cell">Åtgärder</div>
        </div>

{/* requests = listan vi hämtar från backend */} 
{/* .map = gå igenom varje ärende i listan och gör om till jsx */}
{/* one = ett ärende i taget */} 
{filteredRequests.map((one) => (

    <div className="case-row" key={one.id}>
        {/* Skapar en rad för varje ärende.
        key={one.id} = React kräver en unik nyckel på varje element
        i en lista så den vet vilken rad som är vilken. 
        one.id kommer från backend. */}
        {/* Visar företagsnamnet. one.company_name är fältet från backend (snake_case). */}
        <div className="cell">{one.company_name}</div>
        {/* className={...} — sätter CSS-klassen dynamiskt.
            Backticks   `` används för att mixa fast text och variabler:
            `cell status ${one.status}`
            Om one.status är "waiting" → blir klassen "cell status waiting"
            Om one.status är "complete" → blir klassen "cell status complete"
            Det gör att CSS:en kan styla varje status olika med .status.waiting och .status.complete*/}
        <div className={`cell status ${one.status}`}>{translateStatus(one.status)}</div>
        <div className="cell case-actions">
            <button className="btn-dashboard" onClick={() => navigate(one.status === "draft" ? "/create-request" : `/messages?id=${one.id}`)}>Visa</button>
            {one.status === "draft" && (
                <button className="btn-dashboard" onClick={() => handleDelete(one.id)}>Radera</button>
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

</section>

)
}

export default DashboardPage