import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { mockNotifications } from "../mocks/mockData";

export default function NotificationBell() {
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);

    // Filtrera bort redan klickade notiser via localStorage
    const dismissed = JSON.parse(localStorage.getItem("dismissedNotifications") || "[]");
    const [notifications, setNotifications] = useState(
        mockNotifications.filter((n) => !dismissed.includes(n.id))
    );
    const hasNotifications = notifications.length > 0;

    useEffect(() => {
        function handleEsc(e) { if (e.key === "Escape") setShowNotifications(false); }
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, []);

    function handleNotificationClick(notification) {
        // Spara requestId som oläst
        const unread = JSON.parse(localStorage.getItem("unreadRequests") || "[]");
        if (!unread.includes(notification.requestId)) {
            localStorage.setItem("unreadRequests", JSON.stringify([...unread, notification.requestId]));
        }
        // Spara notisen som avklarad
        const dismissed = JSON.parse(localStorage.getItem("dismissedNotifications") || "[]");
        localStorage.setItem("dismissedNotifications", JSON.stringify([...dismissed, notification.id]));

        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
        navigate("/messages");
        setShowNotifications(false);
    }

    return (
        <div className="notification-wrapper">
            <button
                className="notification-btn topbar-icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifikationer"
            >
                <svg className="bell-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {hasNotifications && <span className="notification-dot">{notifications.length}</span>}
            </button>

            {showNotifications && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                        <span className="notification-dropdown-title">Notifikationer</span>
                        <button className="notification-close-btn" onClick={() => setShowNotifications(false)}>×</button>
                    </div>
                    {notifications.length === 0 ? (
                        <p className="muted">Du har inga nya notifikationer.</p>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className="notification-item" onClick={() => handleNotificationClick(n)}>
                                <p>{n.text}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
