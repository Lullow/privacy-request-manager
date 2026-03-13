import React, { useState } from "react"
// topbar återanvändbar component
import TopBar from "../components/TopBar"

// Så kedjan är: användaren klickar bakåt → TopBar anropar onBack → 
// App.jsx byter sida till "home".
function LoginPage({ onBack }) {

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

//TODO Skapa funktion för att skicka data till backend när man trycker logga in/skapa konto.
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
        <button className="btn" type="button" disabled={loading}>
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