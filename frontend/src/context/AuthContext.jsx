import { createContext, useEffect, useState } from "react";

// Skapar auth-kontexten som delas i hela appen via AuthProvider.
// Konsumeras via useAuth-hooken (src/hooks/useAuth.js).
export const AuthContext = createContext();

export function AuthProvider({ children }) {
    // Initieras direkt från localStorage så att inloggad status återställs vid sidladdning.
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    // Användarens profildata hämtas från backend efter att token verifierats.
    const [user, setUser] = useState(null);
    // loading är true tills vi vet om token är giltig — hindrar ProtectedRoute från att
    // omdirigera för tidigt innan auth-kontrollen är klar.
    const [loading, setLoading] = useState(true);

    // Verifierar token mot backend och hämtar användarens profildata.
    // Om token är ogiltig eller utgången rensas den och användaren loggas ut tyst.
    async function fetchMe(currentToken) {
        try {
            const response = await fetch("/api/auth/me", {
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Ogiltig token");
            }

            const data = await response.json();
            setUser(data);
        } catch {
            // Token är ogiltig — rensa auth-state helt.
            localStorage.removeItem("token");
            setToken("");
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    // Körs varje gång token ändras (inloggning, utloggning, sidladdning).
    useEffect(() => {
        if (token) {
            fetchMe(token);
        } else {
            // Ingen token — ingen nätverksbegäran behövs, laddar klart direkt.
            setLoading(false);
        }
    }, [token]);

    // Sparar token i både localStorage (persistent) och state (reaktivt).
    // Anropas från LoginPage och VerifyEmailPage efter lyckad autentisering.
    function login(newToken) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
    }

    // Rensar token och användardata. Anropas från TopBar via handleLogout.
    function logout() {
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
