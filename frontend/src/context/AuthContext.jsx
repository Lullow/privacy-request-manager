import { createContext, useContext, useEffect, useState } from "react";


// Skapar en auth-contect så att det går att dela auth-data i hela appen
// Detta funkar men Vite/Lint klagar TODO? 
export const AuthContext = createContext();




export function AuthProvider({ children }) {
    // Hämta token från localStorage om användaren redan varit inloggad
    const [token, setToken] = useState(localStorage.getItem("token",) || "");
    // Spara info om den inloggade användern
    const [user, setUser] = useState(null);
    // Håller koll på om vi fortfarande laddar auth-status
    const [loading, setLoading] = useState(true);
    // TEST:
    const isAuthenticated = !!token;
    console.log({ token, isAuthenticated });

    // Hämtar användarens info från backen med hjälp av token
    async function fetchMe(currentToken) {
    try {
        const response = await fetch("/api/auth/me", {
        headers: {
            // Skickar token men hjälp av authorization header
            Authorization: `Bearer ${currentToken}`,
        },
        });

        // Error-hantering (om inte token funkar)
        if (!response.ok) {
        throw new Error("Ogiltig token");
        }

        // Gör om svaret från backend till JSON
        const data = await response.json();
        // Spara användarens data i state
        setUser(data);
    } catch {
        // Om token är fel så loggas användaren ut
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
    } finally {
        // När kontrollen är klar slutar det ladda
        setLoading(false);
    }
    }

    // Körs när token ändrss
    useEffect(() => {
    if (token) {
        // Om token finns, kontrollera vem användaren är
        // Om token finns, kontrollera vem användaren är
        //fetchMe(token);
        setUser({ email: "dummy@dummy.com", id: 1 }); // dummy user
        setLoading(false);
    } else {
        // Om token INTE finns då är vi klara direkt
        setLoading(false);
    }
    }, [token]);

    // Körs när användaren loggar in
    function login(newToken) {
    // Sparar token i localStorage så den finns kvar efter en refresh
    localStorage.setItem("token", newToken);
    // Sparar token i state
    setToken(newToken);
    }

    // Körs när användaren loggas ut
    function logout() {
    // Tar bort token från localStorage
    localStorage.removeItem("token");
    // Nollställer auth-state
    setToken("");
    setUser(null);
    }

    return (
    <AuthContext.Provider
        // Delar ut auth-datan och auth-funktionerna till resten av appen
        value={{
        token,
        user,
        loading,
        login,
        logout,
        // True om användardata finns, annars blir det false
        isAuthenticated: !!token,
        }}
    >
        {children}
    </AuthContext.Provider>
    );
}
