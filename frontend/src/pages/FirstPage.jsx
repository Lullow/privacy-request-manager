import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth"


export default function FirstPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();


    // Skapar en tom referens för att peka på en div (pekar ännu inte pga null)
    // ref={ref1} i JSX → React kopplar diven till referensen
    // observer.observe(ref1.current) → nu vet observatören exakt vilken div den ska bevaka
    const ref1 = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);

    // Tre separata state-variabler, en per feature-div.
    // useState(false) — startar som false (osynlig) för alla tre.
    // Varför false som startvärde? För att när sidan laddas är divarna inte synliga ännu — de är längre ner på sidan och användaren har inte scrollat dit.
    // isVisible = false, setIsVisible function will change value to True
    // isVisible1 är false → className = "feature" (ingen animation)
    // isVisible1 är true → className = "feature visible" (animation startar)
    const [isVisible1, setIsVisible1] = useState(false);
    const [isVisible2, setIsVisible2] = useState(false);
    const [isVisible3, setIsVisible3] = useState(false);

    // useEffect(() => { Kör koden inuti en gång när sidan laddas ([] i slutet).
    useEffect(() => {
        // new IntersectionObserver to observe what element is visible in window
        // const observer = new IntersectionObserver((entries) => {
        // Skapar en "bevakare" — ett inbyggt webb-API som automatiskt kollar vilka element som är synliga i fönstret. entries = en lista av alla element den bevakar.
        const observer = new IntersectionObserver((entries) => {
            // entries.forEach((entry) => {
            // Går igenom varje bevakat element ett i taget. entry = ett element.
            entries.forEach((entry) => {
                // isIntersecting checking if ref in window
                // if (entry.isIntersecting) {
                // isIntersecting är true när elementet är synligt i webbläsarfönstret. Utan den här checken skulle koden köras även när elementen är utanför skärmen.
                if (entry.isIntersecting) {
                    // if (entry.target === ref1.current) setIsVisible1(true)
                    // entry.target = vilket element som scrollades in.
                    // Kollar: är det ref1:s div? → sätt isVisible1 till true → animation startar.
                    //Samma för ref2 och ref3.
                    if (entry.target === ref1.current) setIsVisible1(true)
                    if (entry.target === ref2.current) setIsVisible2(true)
                    if (entry.target === ref3.current) setIsVisible3(true)
                }
            });
        });

        // Point IntersectionObserver to the div useRef points to
        // observer.observe(ref1.current)
        // Talar om för observatören vilka element den ska bevaka. Utan dessa rader vet den ingenting — den är skapad men lyssnar inte på något.
        // ref1.current = den faktiska div-noden som ref1 pekar på (kopplingen sker i JSX via ref={ref1}).
        observer.observe(ref1.current)
        observer.observe(ref2.current)
        observer.observe(ref3.current)


        // Disconnect watcher when site is closed
        return () => observer.disconnect();
    }, []);

    return(
        <section className="hero">
            {/* Header icons */}
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
                <button 
                    className="dashboard-button"
                    onClick={() => 
                    (isAuthenticated ? navigate("/dashboard") : navigate ("/login"))}>
                        <svg className="dashboard-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                        </svg>
                </button>
                </div>

                {/* Hero content */}
                <div className="hero-content">
                    <div className="hero-text">
                        <h1>Radera dina personuppgifter enklare</h1>
                        <p>Skapa, skicka och följ upp GDPR-begäran på ett enkelt och tydligt sätt.</p>

                {/* goToLogin placeholder  */}  
                <div className="Buttons">
                    <button className= "FirstPage-btn" 
                    type="button" 
                    onClick={() => {
                        if (isAuthenticated) {
                            navigate("/create-request");
                        } else {
                            navigate("/login");
                        }
                    }}
                >
                    Skapa GDPR-begäran
                </button>
                </div>
            </div>
        </div>

        {/* HeroImage  */}  
        <div className="hero-image">
            <img src="./first-page.png" alt="Hero bild"/>
        </div>


        {/* feature div for different background color */}  
        <section className="features">
            <div className="feature-list">
                <div ref= {ref1} className= {isVisible1 ? "feature visible" : "feature"}>
                    <h3>Skapa konto</h3>
                    <p>Registrera dig säkert och enkelt</p>
                    <button className="get-get-btn" onClick={() => navigate("/login")}>
                        Logga in
                    </button>
                </div>

                <div ref = {ref2} className={isVisible2 ? "feature visible" : "feature"}>
                    <h3>Generera begäran</h3>
                    <p>Få juridiskt korrekt GDPR-begäran</p>
                </div>

                <div ref = {ref3} className={isVisible3 ? "feature visible" : "feature"}>
                    <h3>Följ upp</h3>
                    <p>Spåra status och få påminnelser</p>
                </div>
            </div>

            <img src="./first-page2.png" alt="GDPR illustration" className="feature-image"/>
        </section>
    </section>
    );
}
