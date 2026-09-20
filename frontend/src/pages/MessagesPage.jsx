import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "../components/TopBar";
import { getPrivacyRequests, getRequestMessages, getInboundMessages } from "../api/privacyRequestsApi";
import { translateStatus, translateMessageType } from "../utils/translations";
import { mockRequests, mockMessages } from "../mocks/mockData";

function MessagesPage() {
    const navigate = useNavigate();
    const location = useLocation();
    // Initieras med mockRequests som placeholder tills backend svarar.
    const [requests, setRequests] = useState(mockRequests);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inboundMessages, setInboundMessages] = useState([]);
    const [messagesError, setMessagesError] = useState(null);
    const [loadError, setLoadError] = useState(null);
    // unreadRequests — lista med ärende-ID:n som har olästa notiser.
    // Sparas i localStorage av NotificationBell och rensas här när användaren öppnar ärendet.
    const [expandedInbound, setExpandedInbound] = useState({});
    const [unreadRequests, setUnreadRequests] = useState(
        JSON.parse(localStorage.getItem("unreadRequests") || "[]")
    );

    // Hämtar alla ärenden när sidan laddas och grupperar utkast till ett
    useEffect(() => {
        async function load() {
            try {
                const data = await getPrivacyRequests();
                if (data.length > 0) {
                    const notSentStatuses = ["draft"];
                    const drafts = data.filter(r => notSentStatuses.includes(r.status));
                    const sent = data.filter(r => !notSentStatuses.includes(r.status));
                    const grouped = drafts.length > 0 ? [{
                        ...drafts[0],
                        company_name: drafts.length === 1 ? drafts[0].company_name : `Flera valda`,
                        _allDraftIds: drafts.map(d => d.id),
                    }] : [];
                    setRequests([...grouped, ...sent]);
                }
            } catch (err) {
                setLoadError("Kunde inte hämta ärenden från servern. Visar lokal data.");
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

        setMessagesError(null);
        setInboundMessages([]);
        try {
            const [outbound, inbound] = await Promise.all([
                getRequestMessages(request.id),
                getInboundMessages(request.id),
            ]);
            setMessages(outbound);
            setInboundMessages(inbound);
        } catch {
            setMessagesError("Kunde inte hämta meddelanden från servern.");
        }
    }

    return (
        <section className="messages-page">
            <TopBar />
            <div className="messages-layout">
                {/* Sidebar — utanför container, i linje med loggan */}
                <div className="messages-sidebar">
                    <h2>Ärenden</h2>
                {loadError && (
                    <p className="hint" style={{ color: "orange", fontSize: "0.85rem" }}>{loadError}</p>
                )}
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
                                    {messagesError && (
                                        <p className="hint" style={{ color: "orange" }}>{messagesError}</p>
                                    )}
                                    {selectedRequest.status === "draft" && (
                                        <div className="draft-placeholder">
                                            <p className="muted">Du har inte skickat någon förfrågan för detta ärende än.</p>
                                            <button className="draft-continue-btn" onClick={() => navigate("/create-request")}>Fortsätt formuläret →</button>
                                        </div>
                                    )}
                                    {selectedRequest.status !== "draft" && messages.length === 0 && inboundMessages.length === 0 && (
                                        <p className="muted">Inga meddelanden för detta ärende.</p>
                                    )}
                                    {[
                                        ...messages.map(m => ({ ...m, _kind: "outbound", _ts: new Date(m.created_at) })),
                                        ...inboundMessages.map(m => ({ ...m, _kind: "inbound", _ts: new Date(m.received_at) })),
                                    ]
                                        .sort((a, b) => a._ts - b._ts)
                                        .map((msg) => msg._kind === "outbound" ? (
                                            <div key={`out-${msg.id}`} className="message-bubble">
                                                <div className="message-meta">
                                                    <span className="message-type">{translateMessageType(msg.message_type)}</span>
                                                    <span className="message-date">
                                                        {msg._ts.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                                                    </span>
                                                </div>
                                                <p className="message-subject"><strong>{msg.subject}</strong></p>
                                                <p className="message-body">{msg.message_body}</p>
                                            </div>
                                        ) : (
                                            <div
                                                key={`in-${msg.id}`}
                                                className="message-bubble message-bubble--inbound"
                                                style={{ cursor: "pointer" }}
                                                onClick={() => setExpandedInbound(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                                            >
                                                <div className="message-meta">
                                                    <span className="message-type">Svar från {msg.from_email}</span>
                                                    <span className="message-date">
                                                        {msg._ts.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                                                    </span>
                                                </div>
                                                <p className="message-subject"><strong>{msg.subject}</strong></p>
                                                {expandedInbound[msg.id] && <p className="message-body">{msg.body}</p>}
                                            </div>
                                        ))
                                    }
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
