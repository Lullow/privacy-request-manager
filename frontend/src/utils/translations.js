export function translateStatus(status) {
    const statuses = {
        draft: "Utkast",
        generated: "Besvarad",
        sent: "Skickat",
        waiting: "Väntar",
        complete: "Mottaget",
        denied: "Nekat",
    };
    return statuses[status] || status;
}

export function translateMessageType(type) {
    const types = {
        initial_request: "Förfrågan",
        follow_up: "Uppföljning",
        reminder: "Påminnelse",
    };
    return types[type] || type;
}
