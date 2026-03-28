import { apiFetch, setToken } from "./client";

// Registrerar ett nytt konto. Backend skapar användaren och skickar ett verifieringsmejl.
// Kedja: LoginPage → registerUser({ email, password }) → POST /api/auth/register
//        → backend skapar konto → svarar med { id, email, created_at }
export async function registerUser(data) {
    return apiFetch("/auth/register", {
        method: "POST",
        body: data,
    });
}

// Loggar in med e-post och lösenord. Backend validerar och svarar med en JWT-token.
// Token sparas direkt i localStorage via setToken så att användaren förblir inloggad.
// Kedja: LoginPage → loginUser({ email, password }) → POST /api/auth/login
//        → backend svarar med { access_token, token_type } → token sparas → navigate("/dashboard")
export async function loginUser(data) {
    const res = await apiFetch("/auth/login", {
        method: "POST",
        body: data,
    });
    setToken(res.access_token);
    return res;
}

// Hämtar den inloggade användarens profildata.
// Anropas av AuthContext vid appstart för att verifiera att token fortfarande är giltig.
// Kedja: app laddas → AuthContext.fetchMe() → GET /api/auth/me
//        → backend svarar med { id, email, created_at } → user-state uppdateras
export async function getMe() {
    return apiFetch("/auth/me");
}

// Raderar kontot och all kopplad data permanent.
// Anropas från inställningarna i DashboardPage efter att användaren bekräftat.
export async function deleteAccount() {
    return apiFetch("/auth/account", { method: "DELETE" });
}

// Skickar om verifieringsmejlet till angiven e-postadress.
// Anropas om användaren inte fått eller tappat bort sitt verifieringsmejl.
export async function resendVerification(email) {
    return apiFetch("/auth/resend-verification", {
        method: "POST",
        auth: false,
        body: { email },
    });
}

// Verifierar e-postadressen via länken i välkomstmejlet.
// auth: false — token skickas inte med eftersom användaren inte är inloggad ännu.
// Backend svarar med en JWT-token som sparas direkt så att användaren loggas in automatiskt.
export async function verifyEmail(token) {
    const res = await apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
        auth: false,
    });
    setToken(res.access_token);
    return res;
}
