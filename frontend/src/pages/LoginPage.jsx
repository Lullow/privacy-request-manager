import React, { useState } from "react"
import TopBar from "../components/TopBar"

function LoginPage({ onBack }) {

    //Toggles between login and register account
    const [mode, setMode] = useState("login"); // login // register
    
    return (
        <div className="page">
            <TopBar onBack={onBack}/>

            <main className="container">
                <div className="card">
                    <h1>{mode === "login" ? "Logga in" : "Skapa konto"}</h1>
                    <p className="muted">
                        {mode === "login"
                        ? "Logga in för att.."
                        : "Skapa ett konto först.."
                        }
                    </p>
                </div>
            </main>
        </div>
    )
}

export default LoginPage;