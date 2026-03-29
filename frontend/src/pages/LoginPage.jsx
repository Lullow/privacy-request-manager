// LoginPage behöver funktionerna från authApi.js för att prata med backend.
import { registerUser, loginUser } from "../api/authApi";
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
// topbar återanvändbar component
import TopBar from "../components/TopBar"

function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [searchParams] = useSearchParams();
    const next = searchParams.get("next") || "/dashboard";

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
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        setForm({ email: "", password: "" });
        setError("");
        setSuccess("");
    }

    // Innan: // Skickade fetch direkt med fel URL och sparade token även efter register
    // Register gav ingen token — backend returnerar bara användarinfo vid register, inte token. Så vi visar "konto skapat" och byter till login istället
    // Efter: loginUser sparar token automatiskt — via setToken i authApi.js

    // Flödet:
    // Register → anropar registerUser → visar "konto skapat" → byter till login-läget (sparar ingen token eftersom backend inte ger någon vid register)
    // Login → anropar loginUser → token sparas automatiskt → navigerar till Dashboard via onLogin()
async function handleSubmit() {
    setError("");

    // Validera lokalt innan vi skickar till backend.
    if (!form.email || !form.email.includes("@")) {
        setError("Ange en giltig e-postadress.");
        return;
    }
    if (!form.password || form.password.length < 8) {
        setError("Lösenordet måste vara minst 8 tecken.");
        return;
    }

    setLoading(true);

    try {
        if (mode === "register") {
            await registerUser({ email: form.email, password: form.password, redirect_to: next });
            setSuccess("✓ Konto skapat! Kontrollera din e-post och klicka på verifieringslänken.");
        } else {
            const res = await loginUser({ email: form.email, password: form.password });
            login(res.access_token);
            navigate(next, { replace: true });
        }
    } catch (err) {
        // Visa generiskt meddelande för login-fel för att inte avslöja om kontot finns.
        if (mode === "login") {
            setError("Felaktig e-postadress eller lösenord.");
        } else {
            setError(err.message);
        }
    }

    setLoading(false);
}


    return (
        <div className="page">
            <TopBar />

            <main className="container">
                <div className="card">
                    <h1>{mode === "login" ? "Logga in" : "Skapa konto"}</h1>
                    <p className="muted" style={{ marginBottom: 24 }}>
                        {mode === "login"
                        ? "Välkommen tillbaka — logga in för att fortsätta"
                        : "Skapa ett konto först.."
                        }
                    </p>
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
    <div className="field">
        <label>E-post</label>
        <input
            type="email"
            placeholder="din@epost.se"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
        />
    </div>

    <div className="field" style={{ marginTop: 20 }}>
        <label>Lösenord</label>
        <div style={{ position: "relative" }}>
            <input
                type={showPassword ? "text" : "password"}
                placeholder="Minst 8 tecken"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                style={{ width: "100%", paddingRight: "2.5rem", boxSizing: "border-box" }}
            />
            <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                    position: "absolute",
                    right: "0.6rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1rem",
                    padding: 0,
                }}
                aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
            >
                {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="18" height="18">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="18" height="18">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                )}
            </button>
        </div>
    </div>

    {success && <small style={{ color: "green" }}>{success}</small>}
    {error && <small className="hint">{error}</small>}

    <div className="actions">
        <button className="btn" type="submit" disabled={loading}>
            {loading ? "Laddar..." : mode === "login" ? "Logga in" : "Skapa konto"}
        </button>
    </div>

    <p className="muted" style={{ marginTop: 12 }}>
        {mode === "login" ? (
            <>Inget konto? <button type="button" className="btn btn-secondary" onClick={() => switchMode("register")}>Skapa ett konto</button></>
        ) : (
            <>Har du redan ett konto? <button type="button" className="btn btn-secondary" onClick={() => switchMode("login")}>Logga in</button></>
        )}
    </p>
                    </form>

                    </div>
                </main>
            </div>
        )
    }

export default LoginPage;
