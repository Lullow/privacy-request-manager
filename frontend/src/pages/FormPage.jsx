import React, { useState } from "react";
import TopBar from "../components/TopBar";

// Creates the component
function FormPage({ onBack }){ {/* onBack recives prop from App.jsx */}

{/* Creates the form-state in this component */}
const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    fullName: "",
    city: "",
    profileUrl: "",
});

// Helper: updates a field in the form-state without having to write the object multiple times
// prev = earlier state / ...prev copies all the old fields / [key]: value overwrites the fields that we wanna change
function updateField(key, value) {
    setForm((prev) => ({
        ...prev, 
        [key]: value,
    }));
}

    return (
        <div className="page">
            {/* Topbar navigaton button*/}
            <TopBar onBack={onBack} />

            {/* Main content */}
            <main className="container">
                <div className="card">
                    <h1>Skapa GDPR-begäran</h1>
                    <p>Fyll i dina uppgifter nedan för att skapa din begäran.</p>

                    {/* FORM: company names */}
                    <div className="field">
                        <label>Företag *</label>
                        <input 
                        type="text" 
                        placeholder="Ex: Google, Mrkoll.." 
                        value={form.companyName} // Reads the value from state
                        onChange={(e) => updateField ("companyName", e.target.value)} // Writes back the value from state
                        />
                    </div>

                    {/* FORM: company email */}
                    <div className="field">
                        <label>Företagets e-post *</label>
                        <input 
                        type="email"
                        placeholder="Exempel@live.se"
                        value={form.companyEmail}
                        onChange={(e) => updateField ("companyEmail", e.target.value)}
                        />
                    </div>

                    {/* FORM: name */}
                    <div className="field">
                        <label>Ditt namn *</label>
                        <input
                        type="text"
                        placeholder="För- efternamn"
                        value={form.fullName}
                        onChange={(e) => updateField ("fullName", e.target.value)}
                        />                        
                    </div>

                    {/* FORM: city */}
                    <div className="field">
                        <label>Ort</label>
                        <input
                        type="text"
                        placeholder="Ex: Sollentuna"
                        value={form.city}
                        onChange={(e) => updateField ("city", e.target.value)}
                        />
                    </div>

                    {/* FORM: profile URL */}
                    <div className="field" style={{ gridColumn: "1 / -1"}}> {/*TODO: DOESNT WORK AS INTENDED CHECK .GRID-2 IN STYLE.CSS */}
                        <label>Länk (valfritt)</label>
                        <input
                        type="url"
                        placeholder="Ex: https://exempel.com/profil/..."
                        value={form.profileUrl}
                        onChange={(e) => updateField ("profileUrl", e.target.value)}
                        />
                    </div>

                    {/* DEBUG: test för att se att state funkar */}
                    <pre style={{ marginTop: 16 }}>
                    {JSON.stringify(form, null, 2)}

                    </pre>
                </div>
            </main>
        </div>
    );
}
{/* Export the component */}
export default FormPage 