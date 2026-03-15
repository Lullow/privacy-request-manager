import React, { useState } from "react"
// topbar återanvändbar component
import TopBar from "../components/TopBar"

// Så kedjan är: användaren klickar bakåt → TopBar anropar onBack → 
// onLogin — anropas när inloggningen lyckas → byter sida till Dashboard
function LoginPage({ onBack, onLogin }) {

    //Toggles between login and register account
    // useState skapar en state-variabel — ett värde som React håller koll på och som kan ändras.
    // mode — själva värdet, börjar som "login"
    // setMode — funktionen du anropar när du vill ändra värdet
    // useState("login") — "login" är startvärdet
    // Vad du än skickar in — det blir det nya värdet på mode.
    // När setmode anropas så byter vi text till skapa konto
    const [mode, setMode] = useState("login"); // login // register


    // form - hela objektet { name: "Bella", email: "bella@test.se", password: "123" }
    // setForm - funktionen som uppdterar objektet (alla fält som börjar so tomma strängar alltså tomma input fält)
    // setForm körs varje gång användaren skriver en bokstav i ett inputfält — inte när allt är ifyllt.
    // Kedjan är användaren skriver "b" → onChange triggas → updateField("email", "b") → setForm körs → form.email = "b"
    const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
});

    //När användaren klickar "Logga in" eller "Skapa konto" ska en funktion köras som:
    // Sätter loading till true
    // Skickar formulärdata (form.email, form.password osv) till backend via fetch
    // Backend svarar med antingen en token (lyckat) eller ett fel
    // Om lyckat → navigera till Dashboard
    // Om fel → sätt error med ett felmeddelande
    // Sätter loading till false
    //TODO felmeddelande för (epost finns/fel lösenord eller epost)
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // updatefiled tar emot två saker
    // key - vilka fält som ska uppdateras t.ex email 
    // value - det nya värdet t.ex bella@gmail.com
    // intui anropas setform med en funktion istället för ett värde direkt 
    function updateField(key, value) {
        // ...prev — kopiera alla befintliga fält som de är
        // [key]: value — skriv över just det fältet med det nya värdet
        // Så om form är: { name: "", email: "", password: "" }
        // Och användaren skriver "b" i e-postfältet: updateField("email", "b")
        // setForm  är inbyggd i useState och gör alltid samma sak: tar emot ett nytt värde, ersätter det gamla, och berättar för React att rita om.
        // setForm körs → form.email blir "b"
        // React ser att state ändrades → ritar om
        // Inputfältet visar nu "b"
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    // switchMode tar emot ett argument:
    // newMode — antingen "login" eller "register", beroende på vad användaren klickade
    function switchMode(newMode) {
        // setMode(newMode); Byter läge — t.ex. från "login" till "register". Gör att h1, knappen och toggle-texten byter text.
        setMode(newMode);
        // Nollställer alla fält. Om användaren skrivit in sin e-post i login-läget och sen byter till register 
        // — ska fälten vara tomma, inte behålla det gamla.
        setForm({ name: "", email: "", password: "" });
        // setError("") i switchMode rensar bort eventuellt felmeddelande när man byter mellan login och register.
        // Om vi inte rensar bort felmeddelanden
        //Användaren försöker logga in → fel lösenord → "Fel lösenord" visas
        // Användaren klickar "Skapa ett" för att byta till register-läget
        // Felmeddelandet "Fel lösenord" sitter fortfarande kvar under formuläret
        setError("");
    }

    // async behövs för att fetch tar tid — den måste vänta på svar från backend. async + await gör att koden pausar och väntar på svaret innan den fortsätter 
    // istället för att bara köra vidare.
    // Utan async/await hade koden försökt läsa data innan backend hunnit svara.
    // Vad handleSubmit gör i ordning (kedjan)
    // 1. Sätt loading=true, rensa felmeddelande
    // 2. Välj rätt URL beroende på om man loggar in eller registrerar
    // 3. Skicka email + lösenord till backend via fetch (POST)
    // 4. Vänta på svar
    // 5. Om fel (t.ex. fel lösenord) → visa felmeddelande
    // Om lyckat → spara token + gå till Dashboard
    // 6. Sätt loading=false
    async function handleSubmit() {
        // setLoading(true) — sätter loading till true, vilket gör att knappen visar "Laddar..." 
        // och är inaktiverad så användaren inte kan klicka flera gånger.
    setLoading(true);
    // setError("") — rensar bort eventuellt gammalt felmeddelande (t.ex. om användaren försökte logga in fel förra gången).
    //Alltså: förberedelser innan fetch-anropet skickas.
    setError("");

    // väljer rätt url beroende på vilket läge formulärtet är i.
    // mode === "login"  →  använd /auth/login
    // mode === "register"  →  använd /auth/register
    // ? och : är en ternary operator — samma sak som en if/else fast kortare:
    const url = mode === "login"
        ? "http://localhost:8000/auth/login"
        : "http://localhost:8000/auth/register";

    // själva utskicket till backend
    // fetch(url, {...}) — skickar en HTTP-request till backend-URL:en som valdes ovan.
    // await — väntar på att fetch är klar innan koden fortsätter. 
    // const res = — sparar svaret från backend i variabeln res (response). Svaret innehåller två saker:
    // res.ok — om det gick bra (true/false)
    // res.json() — datan backend skickade tillbaka
    const res = await fetch(url, {
        // method: "POST" — talar om att vi skickar data 
        method: "POST",
        // headers: { "Content-Type": "application/json" } — talar om för backend att datan kommer i JSON-format
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ email: form.email, password: form.password }) — det här är själva datan vi skickar
        // form.email och form.password är värdena användaren skrivit i formuläret
        // JSON.stringify gör om JavaScript-objektet till en JSON-sträng, för man kan bara skicka text över nätet
        body: JSON.stringify({ email: form.email, password: form.password })
    });
    // res.json() — läser svaret från backend och gör om det från JSON-text till ett JavaScript-objekt.
    // const data = — sparar det omgjorda objektet i data.
    const data = await res.json();

    // .ok är inbyggt i fetch — webbläsaren sätter det automatiskt baserat på statuskoden backend skickar tillbaka.
    // ! vänder på uttrycket så "om det INTE gick bra (ok)" - skicka meddelandet från backend
    if (!res.ok) {
        // detail kommer från FastAPI — det är FastAPIs standardfält för felmeddelanden.
        // ex från backend raise HTTPException(status_code=400, detail="Email already registered"
        setError(data.detail); // t.ex. "Email already registered"
    } else {
        // localStorage.setItem("token", data.access_token) — sparar JWT-tokenen i webbläsarens minne.
        // localStorage är som en låda i webbläsaren där du kan spara text. Den finns kvar även om du laddar om sidan.
        // data.access_token → värdet (den långa JWT-strängen)
        localStorage.setItem("token", data.access_token); // spara token
        // navigera till Dashboard
        onLogin();

    }

    // setLoading(false) — sätter tillbaka loading till false när allt är klart.
    //Det körs oavsett om det gick bra eller fel, så knappen alltid går tillbaka till normalt läge:
    setLoading(false);
}

    
    return (
        <div className="page">
            <TopBar onBack={onBack}/>

            <main className="container">
                <div className="card">
                    <h1>{mode === "login" ? "Logga in" : "Skapa konto"}</h1>
                    <p className="muted">
                        {mode === "login"
                        ? "Logga in för att.."
                        : "Skapa ett konto först.."
                        }
                    </p>
                    {mode === "register" && (
    <div className="field">
        <label>Namn</label>
        <input
            type="text"
            placeholder="För- och efternamn"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
        />
    </div>
)}

    <div className="field">
        <label>E-post</label>
        <input
            type="email"
            placeholder="din@epost.se"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
        />
    </div>

    <div className="field">
        <label>Lösenord</label>
        <input
            type="password"
            placeholder="Minst 8 tecken"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
        />
    </div>

    {error && <small className="hint">{error}</small>}

    <div className="actions">
        <button className="btn" type="button" disabled={loading} onClick={handleSubmit}>
            {loading ? "Laddar..." : mode === "login" ? "Logga in" : "Skapa konto"}
        </button>
    </div>

    <p className="muted" style={{ marginTop: 12 }}>
        {mode === "login" ? (
            <>Inget konto? <button className="btn-link" onClick={() => switchMode("register")}>Skapa ett</button></>
        ) : (
            <>Har du redan ett konto? <button className="btn-link" onClick={() => switchMode("login")}>Logga in</button></>
        )}
    </p>

                    </div>
                </main>
            </div>
        )
    }

export default LoginPage;