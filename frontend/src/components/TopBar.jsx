import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import NotificationBell from "./NotificationBell";

export default function TopBar() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    function handleLogout() {
        logout();
        navigate("/");
    }

    function navClass(path) {
        return location.pathname === path ? "topbar-nav-link active" : "topbar-nav-link";
    }

    return (
        <header className="topbar-header">
            <div className="topbar">
                <button className="topbar-brand" onClick={() => navigate("/")}>
                    <img src="/mainlogga.png" alt="Logo" style={{ height: 80 }} />
                </button>

                <nav className="topbar-nav">
                    {isAuthenticated ? (
                        <>
                            <NotificationBell />
                            <button
                                className={`topbar-icon-btn${location.pathname === "/messages" ? " active" : ""}`}
                                onClick={() => navigate("/messages")}
                                title="Meddelanden"
                            >
                                <svg className="message-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                            </button>
                            <button
                                className={`topbar-icon-btn${location.pathname === "/dashboard" ? " active" : ""}`}
                                onClick={() => navigate("/dashboard")}
                                title="Dashboard"
                            >
                                <svg className="dashboard-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                                </svg>
                            </button>
                            <button className="topbar-nav-link topbar-logout" onClick={handleLogout}>Logga ut</button>
                        </>
                    ) : (
                        <button className={navClass("/login")} onClick={() => navigate("/login")}>Logga in</button>
                    )}
                </nav>
            </div>
        </header>
    );
}
