import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import TopBar from "../components/TopBar";


export default function FirstPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();


    // Skapar en tom referens för att peka på en div (pekar ännu inte pga null)
    // ref={ref1} i JSX → React kopplar diven till referensen
    // observer.observe(ref1.current) → nu vet observatören exakt vilken div den ska bevaka
    const ref1 = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);
    const ref4 = useRef(null);

    // Tre separata state-variabler, en per feature-div.
    // useState(false) — startar som false (osynlig) för alla tre.
    // Varför false som startvärde? För att när sidan laddas är divarna inte synliga ännu — de är längre ner på sidan och användaren har inte scrollat dit.
    // isVisible = false, setIsVisible function will change value to True
    // isVisible1 är false → className = "feature" (ingen animation)
    // isVisible1 är true → className = "feature visible" (animation startar)
    const [isVisible1, setIsVisible1] = useState(false);
    const [isVisible2, setIsVisible2] = useState(false);
    const [isVisible3, setIsVisible3] = useState(false);
    const [isVisible4, setIsVisible4] = useState(false);

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
                    if (entry.target === ref4.current) setIsVisible4(true)
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
        observer.observe(ref4.current)


        // Disconnect watcher when site is closed
        return () => observer.disconnect();
    }, []);

    return(
        <section className="hero">
            <TopBar />

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
                <div ref={ref1} className={isVisible1 ? "feature visible" : "feature"}>
                    <div className="feature-row">
                        <img src="./frontendlogga.png" alt="" style={{ width: 44, height: 44, flexShrink: 0 }} />
                        <div>
                            <h3>Skapa konto</h3>
                            <p>Registrera dig säkert och enkelt</p>
                            <button className="get-get-btn" onClick={() => navigate("/login")}>Logga in</button>
                        </div>
                    </div>
                </div>

                <div ref={ref2} className={isVisible2 ? "feature visible" : "feature"}>
                    <div className="feature-row">
                        <img src="./frontendlogga.png" alt="" style={{ width: 44, height: 44, flexShrink: 0 }} />
                        <div>
                            <h3>Generera begäran</h3>
                            <p>Få juridiskt korrekt GDPR-begäran</p>
                        </div>
                    </div>
                </div>

                <div ref={ref3} className={isVisible3 ? "feature visible" : "feature"}>
                    <div className="feature-row">
                        <img src="./frontendlogga.png" alt="" style={{ width: 44, height: 44, flexShrink: 0 }} />
                        <div>
                            <h3>Följ upp</h3>
                            <p>Spåra status och få påminnelser</p>
                        </div>
                    </div>
                </div>

                <div ref={ref4} className={isVisible4 ? "feature visible" : "feature"}>
                    <div className="feature-row">
                        <img src="./frontendlogga.png" alt="" style={{ width: 44, height: 44, flexShrink: 0 }} />
                        <div>
                            <h3>Har du frågor?</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                                <a href="/resurser" style={{ color: "inherit" }}>Vad är mina rättigheter?</a>
                                <a href="/resurser" style={{ color: "inherit" }}>Vad är artikel 17?</a>
                                <a href="/resurser" style={{ color: "inherit" }}>Varför blev mitt ärende nekat och vad är nästa steg?</a>
                                <a href="/resurser" style={{ color: "inherit" }}>Inom hur lång tid ska ett företag svara?</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <img src="./first-page2.png" alt="GDPR illustration" className="feature-image"/>
        </section>
    </section>
    );
}
