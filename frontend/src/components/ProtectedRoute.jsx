// Navigate gör så att det går att omdirigera användare till en annan sida
import { Navigate } from "react-router-dom"
// importerar den skapade custom hook som ger auth-data
import { useAuth } from "../context/useAuth"

// ProtectedRoute är en "wrapper-komponent" som används för att skydda sidor
// Den tar "children" som input, d.v.s komponenter som ska visas om användaren är inloggad
export default function ProtectedRoute ({ children }) {
    // Hämtar auth-status från context
    const { isAuthenticated, loading } = useAuth();

    // Om auth-status fortfarande laddas: ex. vi väntar på backend. Visas Laddar.. 
    if (loading) {
        return <p>Laddar..</p>
    }

    // Om auth-status inte är loggad, omdirigeras användaren till login-sidan
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }
    
    // Visa all innehåll som ligger i "children" om användaren är inloggad
    return children;
}