// DUMMY DATA — används när backend inte returnerar data (demo/offline-läge)

export const mockRequests = [
    { id: 1, company_name: "Merinfo", status: "generated" },
    { id: 2, company_name: "Eniro", status: "draft" },
];

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

export const mockNotifications = [
    { id: 1, text: "Merinfo AB har svarat på din begäran.", requestId: 1 },
];
