import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Skyddar routes som kräver inloggning.
// Om användaren inte är autentiserad omdirigeras de till /login med "next"-parametern
// så att de hamnar på rätt sida efter inloggning.
// loading-kontrollen är viktig: utan den skulle ProtectedRoute omdirigera direkt vid
// sidladdning, innan AuthContext hunnit verifiera token mot backend.
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <p>Laddar..</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
    }

    return children;
}
