import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { getPrivacyRequests, getRequestMessages } from "../api/privacyRequestsApi";

// DUMMY DATA — kommentera ut för att testa utan ärenden/meddelanden
const dummyRequests = [
    { id: 1, company_name: "Merinfo", status: "generated" },
    { id: 2, company_name: "Eniro", status: "draft" },
];

const dummyMessages = {
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

function translateMessageType(type) {
    const types = {
        initial_request: "Förfrågan",
        follow_up: "Uppföljning",
        reminder: "Påminnelse",
    };
    return types[type] || type;
}

function translateStatus(status) {
    const statuses = {
        draft: "Utkast",
        generated: "Skickat",
        waiting: "Väntar",
        complete: "Mottaget",
        denied: "Nekat",
    };
    return statuses[status] || status;
}

function MessagesPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState(dummyRequests);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadRequests, setUnreadRequests] = useState(
        JSON.parse(localStorage.getItem("unreadRequests") || "[]")
    );

    // Hämtar alla ärenden när sidan laddas
    useEffect(() => {
        async function load() {
            try {
                const data = await getPrivacyRequests();
                if (data.length > 0) setRequests(data);
            } catch (err) {
                console.error(err);
            }
        }
        load();
    }, []);

    // Hämtar meddelanden när användaren väljer ett ärende
    async function handleSelectRequest(request) {
        setSelectedRequest(request);

        // Markera som läst
        const updated = unreadRequests.filter((id) => id !== request.id);
        setUnreadRequests(updated);
        localStorage.setItem("unreadRequests", JSON.stringify(updated));

        try {
            const data = await getRequestMessages(request.id);
            setMessages(data.length > 0 ? data : (dummyMessages[request.id] ?? []));
        } catch (err) {
            setMessages(dummyMessages[request.id] ?? []);
        }
    }

    return (
        <section className="messages-page">

            <div className="messages-sidebar">
                <h2>Ärenden</h2>
                {requests.map((req) => (
                    <div
                        key={req.id}
                        className={`messages-request-item ${selectedRequest?.id === req.id ? "active" : ""}`}
                        onClick={() => handleSelectRequest(req)}
                    >
                        <div className="messages-company-row">
                            <p className="messages-company">{req.company_name}</p>
                            {unreadRequests.includes(req.id) && req.status !== "draft" && <span className="unread-dot" />}
                        </div>
                        <span className={`status ${req.status}`}>{translateStatus(req.status)}</span>
                    </div>
                ))}
                {requests.length === 0 && (
                    <p className="muted">Du har inga ärenden ännu.</p>
                )}
            </div>

            <div className="messages-main">
                <div className="dashboard-header">
                    <h1>Meddelanden</h1>
                    <div className="header-icons">
                        <NotificationBell />
                        <button className="message-btn" onClick={() => navigate("/messages")}>
                            <svg className="message-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                        </button>
                        <button className="dashboard-button" onClick={() => navigate("/dashboard")}>
                            <svg className="dashboard-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="messages-thread">
                    {!selectedRequest && (
                        <p className="muted">Välj ett ärende för att se meddelanden.</p>
                    )}
                    {selectedRequest && (
                        <>
                            <h2>{selectedRequest.company_name}</h2>
                            {messages.length === 0 && (
                                <p className="muted">Inga meddelanden för detta ärende.</p>
                            )}
                            {messages.map((msg) => (
                                <div key={msg.id} className="message-bubble">
                                    <div className="message-meta">
                                        <span className="message-type">{translateMessageType(msg.message_type)}</span>
                                        <span className="message-date">
                                            {new Date(msg.created_at).toLocaleDateString("sv-SE")}
                                        </span>
                                    </div>
                                    <p className="message-subject"><strong>{msg.subject}</strong></p>
                                    <p className="message-body">{msg.message_body}</p>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

        </section>
    );
}

export default MessagesPage;
