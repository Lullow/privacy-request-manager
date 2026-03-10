import { useEffect, useRef, useState } from "react"

// function DashboardPage() är själva komponenten — 
// det är React-sättet att skapa en återanvändbar bit av UI.
// Utan funktionen har React ingenting att importera eller visa. Det är funktionen som:
// Håller all logik (useState, useEffect, fetch)
// Returnerar JSX (det som syns på skärmen)
function DashboardPage(){

// ref används för att peka på donut-diven i JSX så att animationen kan ändra dess CSS.
// useRef — skapar en referens till ett DOM-element. Utan den vet inte JavaScript vilken div det handlar om
const ref = useRef(null)


    const [requests, setRequests] = useState([])  // tom lista från start
    // [] = startvärdet är en tom lista, för när sidan laddas har vi ingen data ännu.

// Hämta datan 
useEffect(() => {
    // fetch = webbläsarens inbyggda funktion för att hämta data från en URL. Den skickar en HTTP-request till din backend
    fetch("http://localhost:8000/api/privacy-requests")
    // svaret kommer tillbaka som råtext → gör om till ett JavaScript-objekt.
        .then(res => res.json())
        // stoppa in datan i state. React ritar om.
        .then(data => setRequests(data))
        // useEffect med [] = kör en gång när komponenten visas.
}, [])


useEffect(() => { 
// Animation JS 

    const donut = ref.current
    // Finds child-element och donut-center class
    const center = donut.querySelector(".donut-center");

    // string to int
    const complete = parseInt(donut.dataset.complete);
    const waiting = parseInt(donut.dataset.waiting);
    const denied = parseInt(donut.dataset.denied);

    let currentComplete = 0;
    let currentWaiting = 0;
    let currentDenied = 0;

    const animationSteps = 100;
    let step = 0;

    const animateDonut = () => {
        step++;
        currentComplete = (complete / animationSteps) * step;
        currentWaiting = (waiting / animationSteps) * step;
        currentDenied = (denied / animationSteps) * step;

        donut.style.setProperty('--complete', `${currentComplete}%`);
        donut.style.setProperty('--waiting', `${currentComplete + currentWaiting}%`);
        donut.style.setProperty('--denied', `${currentComplete + currentWaiting + currentDenied}%`);

        if (step < animationSteps) {
            requestAnimationFrame(animateDonut);
        }
    };

    animateDonut();

    let total = 0;
    const totalCount = document.querySelectorAll(".status").length;

    const animateCenter = () => {
    if (total < totalCount) {
        total++;
        center.firstChild.textContent = total;
        setTimeout(animateCenter, 1000 / totalCount);
    }
};

    animateCenter();
}, [])




return(

<section className="dashboard">

    <div className="dashboard-header">
        <h1>Mina ärenden</h1>

   {/* Notification icon. Scalable vector graphics (svg) from heroicons */} 
        <div className="header-icons">
            <button className="notification-btn">
                    <svg className="bell-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
            </button>

    {/* Message icon. Scalable vector graphics (svg) from heroicons */}  
            <button className="message-btn">
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
        <div className={`cell status ${one.status}`}>{one.status}</div>
        <div className="cell case-actions">
            <button className="btn-dashboard">Visa</button>
            <button className="btn-dashboard">Skicka påminnelse</button>
        </div>
    </div>
))}

        </div>
    </div>


        {/* Question section */} 
<section className="dashboard-under-panel">
    <div className="questions">
        <h3>Har du frågor?</h3>
        <h5>Vad är mina rättigheter?</h5>
        <h5>Vad är paragraf 17?</h5>
        <h5>Varför blev mitt ärende nekat och vad är nästa steg?</h5>
        <h5>Inom hur lång tid ska ett företag svara?</h5>
    </div>
</section>


</section>

)
}

export default DashboardPage