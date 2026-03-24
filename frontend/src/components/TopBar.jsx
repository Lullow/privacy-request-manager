import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";


export default function TopBar() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <div>
            <button onClick={() => navigate("/")}>Hem</button>

            { isAuthenticated ? (
                <>
                    <button onClick={() => navigate("/create-request")}>Skapa begäran</button>
                    <button onClick={() => navigate("/dashboard")}>Dashboard</button>
                    <button onClick={handleLogout}>Logga ut</button>
                </>
            ) : (
                <button onClick={() => navigate("/login")}>Logga in</button>
            )}
        </div>
    );
}
