import { apiFetch } from "./client";

// Skapar ett nytt ärende (utkast) i databasen kopplat till den inloggade användaren.
// Anropas av FormPage när användaren når steg 4 och väljer sajter att skicka till.
// data innehåller t.ex: { company_name, company_email, full_name, city, birth_date, tone }
export function createPrivacyRequest(data) {
    return apiFetch("/privacy-requests", {
        method: "POST",
        body: data,
    });
}

// Hämtar alla ärenden som tillhör den inloggade användaren.
// Används i DashboardPage (lista + statistik) och i FormPage (för att undvika dubbletter).
export function getPrivacyRequests() {
    return apiFetch("/privacy-requests");
}

// Ber backend generera ett AI-mejl för ett specifikt ärende.
// id — ärendets databas-ID (måste skapas via createPrivacyRequest först).
// data — inställningar, t.ex: { tone: "formal", message_type: "initial_request", request_types: ["delete"] }
//        Vid juridisk begäran läggs även personal_number, legal_address m.fl. till.
// Kedja: FormPage → generateEmailForSite → generateMessage(id, data)
//        → backend anropar Anthropic API → svarar med { subject, message_body }
export function generateMessage(id, data) {
    return apiFetch(`/privacy-requests/${id}/generate`, {
        method: "POST",
        body: data,
    });
}

// Hämtar alla meddelanden (initial_request, follow_up, reminder) för ett ärende.
// Används i MessagesPage för att visa konversationshistoriken.
export function getRequestMessages(id) {
    return apiFetch(`/privacy-requests/${id}/messages`);
}

// Skickar det genererade mejlet till sajten å användarens vägnar.
// personalNumber skickas med vid juridisk begäran — det används enbart för att generera
// brevtexten och lagras aldrig i databasen (ersätts med platshållare i vår lagrade version).
export function sendRequest(id, personalNumber = null) {
    return apiFetch(`/privacy-requests/${id}/send`, {
        method: "POST",
        body: personalNumber ? { personal_number: personalNumber } : {},
    });
}

// Raderar ett ärende och all kopplad data från databasen.
// Anropas från DashboardPage när användaren klickar "Ta bort".
export function deletePrivacyRequest(id) {
    return apiFetch(`/privacy-requests/${id}`, {
        method: "DELETE",
    });
}

// Genererar och skickar en påminnelse till sajten för ett specifikt ärende.
// Skapar ett nytt meddelande av typen "reminder" och uppdaterar ärendets status till "waiting".
export function sendReminder(id) {
    return apiFetch(`/privacy-requests/${id}/reminder`, {
        method: "POST",
    });
}
