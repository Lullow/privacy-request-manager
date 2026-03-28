// Översätter backend-statuskoder till svenska etiketter för visning i UI.
// Används i DashboardPage (statuskolumn + donut-diagram) och MessagesPage (ärendelistan).
// Fallback: returnerar den ursprungliga strängen om statuskoden inte är känd.
export function translateStatus(status) {
    const statuses = {
        draft: "Utkast",
        generated: "Genererat",
        sent: "Skickat",
        waiting: "Väntar",
        complete: "Mottaget",
        denied: "Nekat",
    };
    return statuses[status] || status;
}

// Översätter meddelandetyper till svenska etiketter för visning i MessagesPage.
// Fallback: returnerar den ursprungliga strängen om typen inte är känd.
export function translateMessageType(type) {
    const types = {
        initial_request: "Förfrågan",
        follow_up: "Uppföljning",
        reminder: "Påminnelse",
    };
    return types[type] || type;
}
