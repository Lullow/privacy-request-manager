import { apiFetch } from "./client";


// Funktionen behövs för att FormPage ska kunna spara ett ärende i databasen.
// När användaren fyllt i formuläret och klickar "spara" anropar FormPage createPrivacyRequest med datan — 
// och funktionen skickar det till backend som sparar det.
// Utan den hade FormPage inte haft något sätt att prata med backend.

// data — informationen användaren fyllt i i formuläret, t.ex:
// company_name: "Google",
// company_email: "privacy@google.com",
// full_name: "Bella"
export function createPrivacyRequest(data) {
    // apiFetch sköter själva fetch-anropet till backend automatiskt med:
    // rätt bas-URL (/api)
    // token i headern
    // felhantering
    return apiFetch("/privacy-requests", {
        method: "POST",
        body: data,
    });
}

// hämta alla ärenden som tillhör den inloggade användaren från databasen.
// Ingen data parameter — vi skickar ingenting, bara hämtar.
// skickar GET till /api/privacy-requests med token i headern, backend svarar med en lista:
    // { id: 1, company_name: "Google", status: "waiting", ... },
    // { id: 2, company_name: "Meta", status: "complete", ... }
// Den används i DashboardPage för att visa användarens ärenden.

export function getPrivacyRequests() {
    return apiFetch("/privacy-requests");
}


// användaren klickar "generera"
// → generateMessage(1, { tone: "formal" })
// → POST /api/privacy-requests/1/generate
// → backend genererar text med AI
// → svarar med { subject, message_body }
// → visas i formuläret

// Spara ärende först → får tillbaka id: 1
// Sedan: generera för ärende 1

// Inställningar för hur brevet ska låta:
// tone: "formal",
// message_type: "initial_request"
// Utan data vet inte AI:n hur brevet ska skrivas

//  skicka en förfrågan till backend om att generera ett AI-brev för ett specifikt ärende.
// id — vilket ärende brevet ska genereras för. Måste finnas i databasen redan.
// data — inställningar för brevet: ex tone : formal
export function generateMessage(id, data) {
    return apiFetch(`/privacy-requests/${id}/generate`, {
        method: "POST",
        body: data,
    });
}


// Hämtar alla meddelanden för ett specifikt ärende
export function getRequestMessages(id) {
    return apiFetch(`/privacy-requests/${id}/messages`);
}

// Skickar det genererade mejlet till sajten å användarens vägnar.
// Kräver att ett meddelande redan genererats för ärendet (via generateMessage).
export function sendRequest(id) {
    return apiFetch(`/privacy-requests/${id}/send`, {
        method: "POST",
    });
}
