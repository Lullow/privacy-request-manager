import { useEffect, useRef } from "react"


function DashboardPage(){

const ref = useRef(null)


useEffect(() => {


// Animation JS 

    const donut = ref.current
    const center = donut.querySelector(".donut-center");

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
        total++;
        center.firstChild.textContent = total;
        if(total < totalCount) {
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

        {/* Case Rows */} 
        <div className="case-row">
            <div className="cell"><a href="https://www.merinfo.se">Merinfo</a></div>
            <div className="cell status waiting">Pågående</div>
            <div className="cell case-actions">
                <button className="btn-dashboard">Visa</button>
                <button className="btn-dashboard">Skicka påminnelse</button>
            </div>
        </div>

        <div className="case-row">
            <div className="cell"><a href="https://www.ratsit.se">Ratsit</a></div>
            <div className="cell status complete">Avslutad</div>
            <div className="cell case-actions">
                <button className="btn-dashboard">Visa</button>
                <button className="btn-dashboard">Skicka påminnelse</button>
            </div>
        </div>

        <div className="case-row">
            <div className="cell"><a href="https://mrkoll.se">MrKoll</a></div>
            <div className="cell status complete">+ 30 dagar</div>
            <div className="cell case-actions">
                <button className="btn-dashboard">Visa</button>
                <button className="btn-dashboard">Skicka påminnelse</button>
            </div>
        </div>
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