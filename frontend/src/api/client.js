// export — gör så att andra filer kan importera och använda den.
// const API_BASE = "/api" — sparar bas-URL:en som en variabel så du inte behöver skriva /api varje gång.
// Istället för ex fetch("/api/auth/login")
// Skriver du bara: fetch(`${API_BASE}/auth/login`)
export const API_BASE = "/api";

// export function getToken() — skapar en funktion som andra filer kan importera och använda.
// localStorage.getItem("token") — hämtar token-strängen från webbläsarens minne.
// localStorage är en liten databas i webbläsaren (inbyggt, behöver ej importeras) där du kan spara text. Den finns kvar även om du laddar om sidan eller stänger fliken.
// getItem är också inbyggt i webbläsaren — det är en metod som tillhör localStorage.
// getItem("token") letar efter nyckeln "token" i localStorage och returnerar värdet — eller null om den inte finns.
export function getToken() {
    return localStorage.getItem("token");
}

// Funktionen emot en token och sparar den i localStorage.
// setItem sparar ett värde i localStorage.
// Den tar två argument - nyckel: "token", värde: token strängen
export function setToken(token) {
    localStorage.setItem("token", token);
}

// Tar bort token från localStorage — alltså loggar ut användaren.
// användaren klickar "Logga ut" → removeToken() anropas →  token är borta → användaren är utloggad
// Utan token kan användaren inte längre nå skyddade sidor.
export function removeToken() {
    localStorage.removeItem("token");
}

// Hämta token från localStorage  
// Den är async för att den använder fetch som tar tid.
// endpoint — den specifika URL-delen, t.ex. "/auth/login" eller "/privacy-requests"
// const token = getToken() — hämtar token från localStorage direkt när funktionen körs. 
// Antingen får den tillbaka en token-sträng eller null om användaren inte är inloggad.
// options = {} — extra inställningar som method, body osv. = {} betyder att om man inte skickar in något är den ett tomt objekt som standard.
// Ex GET-request hämtar bara data — den behöver ingen body. En POST-request skickar data — den behöver en body med det du vill skicka.
export async function apiFetch(endpoint, options = {}) {
    const token = getToken();


// Funktionen talar om för backend tre saker varje gång:
// Content-Type: application/json → datan är i JSON-format
// Authorization: Bearer token → användaren är inloggad (om token finns)
// Eventuella extra headers du skickar med
// Med varje request till backend så skickar funktionen med vilken format datan var i och och användaren är inloggad(token)
// "Content-Type": "application/json" — talar om för backend att datan kommer i JSON-format. Alltid med.
    const headers = {
        "Content-Type": "application/json",
        // ...(token && { Authorization: \Bearer ${token}` })` — lägger till token om den finns:
        // $ är template literals — ett sätt att sätta in en variabel i en sträng
        // token = (getToken)
        // ... = Den "packar upp" ett objekt och lägger till innehållet i ett annat 
        // Bearer betyder ungefär "den som bär denna token har tillgång". Det är bara ett protokoll — backend läser av det och plockar ut token-strängen efter Bearer .
        ...(token && { Authorization: `Bearer ${token}` }),
        // ...options.headers — om du skickat med egna headers när du anropar apiFetch läggs de till här.
        ...options.headers,
    };

    // fetch(...) — skickar requesten till backend.
    // `${API_BASE}${endpoint}` — bygger ihop hela URL:en:
    // Vite-proxyn ser att URL:en börjar med /api och vidarebefordrar den till http://localhost:8000 där backend körs.
    // await — väntar på svar från backend innan koden fortsätter.
    // const res = — sparar svaret från backend.
const res = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: headers,
});

    // if (!res.ok) — om backend svarade med ett fel (t.ex. 401, 400, 500). (ok inbyggt i fetch)
    // 200-299 → res.ok = true
    //400, 401, 500 osv → res.ok = false
    if (!res.ok) {
        // await res.json().catch(() => ({})) — försöker läsa felmeddelandet från backend. Await för att hinna läsa och tolka svaret från backend
    // försök läsa JSON från svaret → om det misslyckas → använd {} istället
    // .catch(() => ({})) (catch inbyggt i js) — om det inte går att läsa svaret, använd ett tomt objekt {} istället för att krascha
        const error = await res.json().catch(() => ({}));
        // // Om backend inte skickade något detail: "API error"  // ←  är då fallback
        // throw är inbyggt i JavaScript. Det stoppar funktionen och skickar upp ett fel till den som anropade funktionen
        // Error är inbyggt i JavaScript — det är en klass som skapar ett fel-objekt.
        // new är nyckelordet du använder för att skapa ett nytt objekt av en klass
        throw new Error(
    typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error.detail) || "API error"
);}

    return res.json();
}
