function toSearchQuery(name) {
    return encodeURIComponent(name).replace(/%20/g, "+");
}

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

export const REQUEST_TYPES = [
    { id: "delete", label: "Radering" },
    { id: "access", label: "Registerutdrag" },
    { id: "rectify", label: "Rättelse" },
    { id: "restrict", label: "Begränsning" },
    { id: "object", label: "Invändning" },
    { id: "portability", label: "Dataportabilitet" },
];

export const STEP_LABELS = ["Ditt namn", "Sök upp dig", "Träffar", "Ta bort", "Signera"];
