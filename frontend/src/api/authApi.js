import { apiFetch, setToken } from "./client";


// async — behövs för att apiFetch tar tid (väntar på svar från backend).
// function registerUser(data) — tar emot data, alltså det användaren fyllt i: data = { email: "bella@gmail.com", password: "123" }
export async function registerUser(data) {
    // return apiFetch(...) — skickar anropet till backend och returnerar svaret tillbaka.
    // "/auth/register" — endpoint, apiFetch lägger automatiskt till /api så det blir /api/auth/register.
    return apiFetch("/auth/register", {
        // Skicka data 
        method: "POST",
        // body: JSON.stringify(data) — gör om JS-objektet till JSON-sträng och skickar med i requesten:
        body: data,
    });
}
// Kedjan: 
// LoginPage anropar registerUser({ email, password })
// → skickar POST till /api/auth/register
// → backend skapar användaren i databasen
// → backend svarar med { id, email, created_at }
// → LoginPage visar "konto skapat, logga in"



export async function loginUser(data) {
    // const res = await apiFetch(...) — spara svaret istället för att returnera direkt. Det är skillnaden mot registerUser:
    // För att vi behöver plocka ut token ur svaret innan vi returnerar
    const res = await apiFetch("/auth/login", {
        method: "POST",
        body: data,
    });

// Kedjan: 
// LoginPage anropar loginUser({ email, password })
// → skickar POST till /api/auth/login
// → backend kollar email + lösenord mot databasen
// → backend svarar med { access_token, token_type }
// → token sparas i localStorage
// → LoginPage anropar onLogin() → Dashboard





    // setToken(res.access_token) — plockar ut token ur svaret och sparar den i localStorage:
    setToken(res.access_token);
    // return res — skickar tillbaka hela svaret till den som anropade loginUser, t.ex. LoginPage.
    return res;
}

// Kedjan:
// appen laddas
// → getMe() anropas 
// → skickar GET till /api/auth/me med token i header
// → backend svarar med { id, email, created_at }
// → appen vet att användaren är inloggad




export async function getMe() {
    return apiFetch("/auth/me");
}

export async function deleteAccount() {
    return apiFetch("/auth/account", { method: "DELETE" });
}

export async function verifyEmail(token) {
    const res = await apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
        auth: false,
    });
    setToken(res.access_token);
    return res;
}

// LoginPage anropar loginUser()
// → apiFetch skickar till backend
// → backend svarar med token
// → setToken sparar token i localStorage
// → return res skickar svaret tillbaka till LoginPage
// → LoginPage anropar onLogin() och navigerar till Dashboard

