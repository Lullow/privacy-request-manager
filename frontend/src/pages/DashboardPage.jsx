import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";

import { getPrivacyRequests } from "../api/privacyRequestsApi";

import { useEffect, useRef, useState } from "react"

// function DashboardPage() är själva komponenten — 
// det är React-sättet att skapa en återanvändbar bit av UI.
// Utan funktionen har React ingenting att importera eller visa. Det är funktionen som:
// Håller all logik (useState, useEffect, fetch)
// Returnerar JSX (det som syns på skärmen)
function translateStatus(status) {
    const statuses = {
        draft: "Utkast",
        generated: "Besvarad",
        waiting: "Väntar",
        complete: "Mottaget",
        denied: "Nekat",
    };
    return statuses[status] || status;
}

function DashboardPage(){

// ref används för att peka på donut-diven i JSX så att animationen kan ändra dess CSS.
// useRef — skapar en referens till ett DOM-element. Utan den vet inte JavaScript vilken div det handlar om
const ref = useRef(null)
const navigate = useNavigate();


    // [] = startvärdet är en tom lista, för när sidan laddas har vi ingen data ännu.
    // requests — själva listan med ärenden (börjar som [])
    // requests fylls med det backend skickar tillbaka — en lista av objekt. Varje objekt är ett ärende:
    // setRequests — funktionen som ersätter listan med ny data

// DUMMY DATA — visas om backend inte returnerar några ärenden
const dummyRequests = [
    { id: 1, company_name: "Merinfo", status: "generated" },
];

    const [requests, setRequests] = useState(dummyRequests)


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
    // Letar efter alla element med klassen status i hela sidan — det är statusdivarna i ärendelistan:
    const totalCount = document.querySelectorAll(".status").length;


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
}, [])




return(

<section className="dashboard">

    <div className="dashboard-header">
        <button className="back-btn" onClick={() => navigate("/")}>← Tillbaka</button>
        <h1>Mina ärenden</h1>

   {/* Notification icon. Scalable vector graphics (svg) from heroicons */}
        <div className="header-icons">
            <NotificationBell />

    {/* Message icon. Scalable vector graphics (svg) from heroicons */}  
            <button className="message-btn" onClick={() => navigate("/messages")}>
                <svg className="message-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
            </button>

    {/* Dashboard icon. Scalable vector graphics (svg) from heroicons (change name from dashboard button) */}  
            <button className="dashboard-button">
                    <svg className="dashboard-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    </svg>
            </button>
        </div>
    </div>


    {/* Filters + Donut */} 
    <div className="dashboard-top">
        <div className="filters">
            <label><input type="checkbox" defaultChecked/> Alla</label> 
            <label><input type="checkbox" defaultChecked/> Pågående </label>
            <label><input type="checkbox" defaultChecked/> Avslutad</label>
        </div>

        <div className="donut" ref={ref} data-waiting="50" data-complete="30" data-denied="20">
            <div className="donut-center">
                {/* Starting Value */} 
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
{requests.map((one) => (

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
            <button className="btn-dashboard" onClick={() => navigate(`/messages?id=${one.id}`)}>Visa</button>
            <button className="btn-dashboard">Skicka påminnelse</button>
        </div>
    </div>
))}
    {/* Kolla om listan är tom. Om den är det = "Du har inga ärenden ännu"  */}

    {requests.length === 0 && (
    <p className="muted">Du har inga ärenden ännu.</p>
)}

        </div>
    </div>




</section>

)
}

export default DashboardPage