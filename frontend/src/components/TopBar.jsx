import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
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
                    <span className="brand-dot" />
                    Privacy Request Manager
                </button>

                <nav className="topbar-nav">
                    <button className={navClass("/")} onClick={() => navigate("/")}>Hem</button>

                    {isAuthenticated ? (
                        <>
                            <button className={navClass("/create-request")} onClick={() => navigate("/create-request")}>Skapa begäran</button>
                            <button className={navClass("/dashboard")} onClick={() => navigate("/dashboard")}>Dashboard</button>
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
