// Läser in bas-URL från .env (VITE_API_BASE_URL).
// I produktion pekar den på backend-servern. Lokalt används "/api" som proxyas av Vite.
const ENV_API_BASE = import.meta.env.VITE_API_BASE_URL?.trim();

// Tar bort eventuellt avslutande snedstreck så att URL-sammanslagning
// alltid ser ut som: API_BASE + "/endpoint" → "/api/auth/login" (inte "/api//auth/login").
function normalizeApiBase(base) {
    if (!base) return "/api";
    return base.endsWith("/") ? base.slice(0, -1) : base;
}

export const API_BASE = normalizeApiBase(ENV_API_BASE);

// --- Token-hantering ---
// JWT-token sparas i localStorage så att användaren förblir inloggad vid sidladdning.

export function getToken() {
    return localStorage.getItem("token");
}

export function setToken(token) {
    localStorage.setItem("token", token);
}

export function removeToken() {
    localStorage.removeItem("token");
}

// Försöker läsa ut ett läsbart felmeddelande ur ett misslyckat API-svar.
// Backend kan returnera fel som JSON ({ detail: "..." }) eller ren text.
// Fallback: generisk sträng med HTTP-statuskoden.
async function parseErrorResponse(res) {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const error = await res.json().catch(() => ({}));

        if (typeof error.detail === "string" && error.detail.trim()) {
            return error.detail;
        }

        if (typeof error.message === "string" && error.message.trim()) {
            return error.message;
        }

        // FastAPI returnerar ibland detail som ett objekt (valideringsfel) — serialisera det.
        if (error.detail !== undefined) {
            return JSON.stringify(error.detail);
        }
    }

    // Icke-JSON-svar (t.ex. HTML-felsidor) — visa max 300 tecken.
    const text = await res.text().catch(() => "");
    if (text.trim()) {
        return text.slice(0, 300);
    }

    return `API error (${res.status})`;
}

// Gemensam fetch-wrapper som används av alla API-moduler.
// Lägger automatiskt till:
//   - Content-Type: application/json
//   - Authorization: Bearer <token> (om tillgängligt och auth !== false)
// Kastar ett Error med läsbart meddelande vid icke-OK-svar.
export async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    // auth: false kan skickas in för endpoints som inte kräver inloggning (t.ex. verifyEmail).
    const shouldSendAuth = options.auth !== false;

    const headers = {
        "Content-Type": "application/json",
        ...(shouldSendAuth && token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: options.method || "GET",
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers,
    });

    if (!res.ok) {
        throw new Error(await parseErrorResponse(res));
    }

    return res.json();
}
