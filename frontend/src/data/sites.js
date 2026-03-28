// Bygger en URL-kodad söksträng där mellanslag ersätts med "+" (kompatibelt med de flesta söktjänsters format).
function toSearchQuery(name) {
    return encodeURIComponent(name).replace(/%20/g, "+");
}

// Konfiguration för alla sajter som stöds av tjänsten.
// Varje sajt har:
//   searchUrl  — funktion som genererar en direktlänk till sökresultatsidan för användarens namn/ort.
//   removeMethod — "form" (BankID-flöde på sajten) eller "email" (mejl till sajtens kundservice).
//   removeUrl  — länk till sajtens borttagningssida eller kontaktformulär.
//   removeEmail — e-postadress dit AI-genererade mejl skickas (används i FormPage steg 4).
//   removeSteps — steg-för-steg-instruktioner som visas för användaren i formuläret.
//   removeNote  — valfri varning/notering om sajtens begränsningar (t.ex. att Mrkoll bara döljer).
export const SITES = [
    {
        name: "Ratsit",
        searchUrl: (name, city) => `https://www.ratsit.se/sok/person?vem=${toSearchQuery(name)}${city ? `&ort=${toSearchQuery(city)}` : ""}&m=0&k=0&r=0&er=0&b=0&eb=0&amin=16&amax=120&fon=1&page=1`,
        removeMethod: "form",
        removeUrl: "https://www.ratsit.se/tabort",
        removeEmail: "kundservice@ratsit.se",
        removeSteps: [
            "Kryssa i villkorsrutan och klicka på \"Ta bort dig från Ratsit\"",
            "Välj \"Mobilt BankID\" eller \"BankID på denna enhet\"",
            "Skanna QR-koden med BankID-appen",
            "Klart — dina uppgifter tas bort inom 24 timmar",
        ],
    },
    {
        name: "Mrkoll",
        searchUrl: (name, city) => `https://mrkoll.se/resultat?n=${toSearchQuery(name)}&c=${city ? toSearchQuery(city) : ""}&min=16&max=120&sex=a&c_stat=all&company=`,
        removeMethod: "form",
        removeUrl: "https://mrkoll.se/om/kundservice-publicerade-uppgifter/",
        removeEmail: "hej@nusvar.se",
        removeSteps: [
            "Klicka på \"Logga in med Mobilt BankID\"",
            "Klicka på \"Starta inloggning med Mobilt BankID\"",
            "Skanna QR-koden med BankID-appen",
            "Välj att dölja ditt telefonnummer och/eller adress under \"Ändra uppgifter\"",
        ],
        // OBS: Mrkoll döljer uppgifterna snarare än att radera dem permanent.
        removeNote: "Mrkoll döljer uppgifterna — de raderas inte permanent. Vill du begära permanent radering? Välj Juridisk begäran.",
    },
    {
        name: "Hitta.se",
        searchUrl: (name, city) => `https://www.hitta.se/s%C3%B6k?vad=${encodeURIComponent(city ? `${name} ${city}` : name)}`,
        removeMethod: "form",
        removeUrl: "https://www.hitta.se/kontakta-oss/ta-bort-kontaktsida",
        removeEmail: "kundservice@hitta.se",
        removeSteps: [
            "Sök på ditt namn i sökfältet",
            "Klicka på dig själv i sökresultaten",
            "Klicka på \"Ta bort\" på din profilsida",
            "Logga in med BankID och skanna QR-koden",
            "Bekräfta borttagningen — klart!",
        ],
    },
    {
        name: "Eniro",
        searchUrl: (name, city) => `https://www.eniro.se/${toSearchQuery(city ? `${name} ${city}` : name)}/personer`,
        removeMethod: "form",
        removeUrl: "https://personer-uppdatera.eniro.se/",
        removeEmail: "info@eniro.com",
        removeSteps: [
            "Sök upp ditt namn på sidan",
            "Logga in med BankID och skanna QR-koden",
            "Följ instruktionerna på sajten för att uppdatera eller ta bort dina uppgifter",
        ],
    },
    {
        name: "Birthday",
        searchUrl: (name, city) => `https://www.birthday.se/sok?whowhere=${toSearchQuery(city ? `${name} ${city}` : name)}&similar=true`,
        removeMethod: "email",
        removeEmail: "info@birthday.se",
        removeUrl: "https://www.birthday.se/personuppgifter",
    },
    {
        name: "Merinfo",
        searchUrl: (name, city) => `https://www.merinfo.se/search?q=${toSearchQuery(city ? `${name} ${city}` : name)}`,
        removeMethod: "email",
        removeEmail: "info@merinfo.se",
        removeUrl: "https://www.merinfo.se/om",
    },
];

// GDPR-begärantyper som användaren kan välja bland i formuläret (steg 4).
// id matchar backend-värden; label visas i UI.
export const REQUEST_TYPES = [
    { id: "delete", label: "Radering" },
    { id: "rectify", label: "Rättelse" },
    { id: "restrict", label: "Begränsning" },
    { id: "object", label: "Invändning" },
    { id: "portability", label: "Dataportabilitet" },
];

// Etiketter för steg-indikatorn i formuläret.
// Ordningen matchar stegnumren i FormPage (steg 1–5 visas, steg 6 är bekräftelsesidan).
export const STEP_LABELS = ["Ditt namn", "Sök upp dig", "Träffar", "Ta bort", "Signera"];
