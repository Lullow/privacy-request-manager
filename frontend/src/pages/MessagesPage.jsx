import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "../components/TopBar";
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
        generated: "Genererat",
        sent: "Skickat",
        waiting: "Väntar",
        complete: "Mottaget",
        denied: "Nekat",
    };
    return statuses[status] || status;
}

function MessagesPage() {
    const navigate = useNavigate();
    const location = useLocation();
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

    // Auto-välj ärende om ?id= finns i URL:en
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = parseInt(params.get("id"));
        if (id) {
            const req = requests.find((r) => r.id === id);
            if (req) handleSelectRequest(req);
        }
    }, [location.search, requests]);

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
            <TopBar />
            <div className="messages-layout">
                {/* Sidebar — utanför container, i linje med loggan */}
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

                {/* Meddelandeyta — centrerad */}
                <div className="messages-main">
                    <div className="messages-main-header">
                        <h1>Meddelanden</h1>
                        <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>Tillbaka</button>
                    </div>

                    <div className="border">
                        <div className="messages-thread">
                            {!selectedRequest && (
                                <p className="muted">Välj ett ärende för att se meddelanden.</p>
                            )}
                            {selectedRequest && (
                                <>
                                    <h2>{selectedRequest.company_name}</h2>
                                    {selectedRequest.status === "draft" && (
                                        <div className="draft-placeholder">
                                            <p className="muted">Du har inte skickat någon förfrågan för detta ärende än.</p>
                                            <button className="draft-continue-btn" onClick={() => navigate("/create-request")}>Fortsätt formuläret →</button>
                                        </div>
                                    )}
                                    {selectedRequest.status !== "draft" && messages.length === 0 && (
                                        <p className="muted">Inga meddelanden för detta ärende.</p>
                                    )}
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="message-bubble">
                                            <div className="message-meta">
                                                <span className="message-type">{translateMessageType(msg.message_type)}</span>
                                                <span className="message-date">
                                                    {new Date(msg.created_at).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
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
                </div>
            </div>
        </section>
    );
}

export default MessagesPage;
