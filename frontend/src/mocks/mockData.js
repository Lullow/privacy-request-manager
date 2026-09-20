// Mock-data som används som fallback när backend inte returnerar data (t.ex. offline/demo-läge).
// Importeras av DashboardPage, MessagesPage och NotificationBell.

// Exempelärenden med olika statusar för att testa dashboard-vyn och statistiken.
export const mockRequests = [
    { id: 1, company_name: "Merinfo", status: "sent" },
];

// Exempelmeddelanden, nycklat på ärendets id.
// Ärende 1 har ett AI-genererat mejl; ärende 2 är tomt (inget mejl genererat än).
export const mockMessages = {
    1: [
        {
            id: 1,
            message_type: "initial_request",
            source: "ai",
            subject: "Begäran om radering av personuppgifter – GDPR artikel 17",
            message_body: "Hej,\n\nJag skriver för att begära radering av mina personuppgifter i enlighet med artikel 17 i GDPR (rätten att bli glömd).\n\nVänligen bekräfta att ni har tagit emot denna begäran och informera mig om när uppgifterna har raderats.\n\nMed vänliga hälsningar",
            tone: "formal",
            created_at: "2026-03-10T10:00:00",
        },
    ],
    2: [],
};

// Exempelnotifikation kopplad till ärende 1.
// Klick på notifikationen markerar ärendet som oläst och navigerar till MessagesPage.
export const mockNotifications = [
    { id: 1, text: "Merinfo AB har svarat på din begäran.", requestId: 1 },
];
