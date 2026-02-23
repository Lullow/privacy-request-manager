import React, { useState } from "react";
import TopBar from "../components/TopBar";

// CHIPS - Alternatives that user can choose (Creates a list of userchoices)
const REQUEST_TYPES = [
    { id: "delete", label: "Radering (Art. 17?)"},
    { id: "access", label: "Registerutdrag (Art. 15?)"},
    { id: "rectify", label: "Rättelse (Art. 16?)"},
    { id: "restrict", label: "Begränsningar (Art. 18?)"},
    { id: "object", label: "Invändningar (Art. 21?)"},
    { id: "portability", label: "Dataportabilitet (Art. 20?)"},
];


// Creates the component
function FormPage({ onBack }){ // onBack recives prop from App.jsx

// Creates the form-state in this component
const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    fullName: "",
    city: "",
    profileUrl: "",
    requestTypes: ["delete"],
});

// UI-state - shows if we just copied the text
const [copied, setCopied] = useState(false);


// Helper: updates a field in the form-state without having to write the object multiple times
// prev = earlier state / ...prev copies all the old fields / [key]: value overwrites the fields that we wanna change
function updateField(key, value) {
    setForm((prev) => ({
        ...prev, 
        [key]: value,
    }));
}


// TOGGLE - Adds / deletes a requestType in the array
function toggleRequestType(id) {
    setForm((prev) => {
        const exists = prev.requestTypes.includes(id);

    return {
        ...prev,
        requestTypes: exists 
        ? prev.requestTypes.filter((x) => x !== id) // Deletes
        : [...prev.requestTypes, id], // Adds
    };
});
}

// Fetches labels for choosen requestTypes
const selectedRequests = REQUEST_TYPES
    .filter((t) => form.requestTypes.includes(t.id)) // Keeps what the user choosen
    .map((t) => `- ${t.label}`) // Changes to textrows
    .join("\n"); // Makes them to a "list"

// Creates the GDPR-template message
const template = `
    Ämne: GDPR-begäran - ${form.fullName || "Ditt namn"}

    Hej ${form.companyName || ""},

    Jag önskar härmed att utöva mina rättigheter enligt GDPR.

    Jag begär följande:
    ${selectedRequests || "- (Ingen vald begäran)"}

    Mina uppgifter:
    Namn: ${form.fullName}
    Ort: ${form.city}
    Profil / Länk: ${form.profileUrl}

    Vänligen bekräfta mottagandet av denna begäran och återkom inom lagstadgad tid.

    Med vänliga hälsningar,
    ${form.fullName || ""}
`.trim();

// Basic validation for missing fields TODO: Make this more advanced 
const errors = {
    companyName: form.companyName.trim() ? "" : "Fyll i företagets namn.",
    companyEmail: form.companyEmail.trim() ? "" : "Fyll i företagets e-post.",
    fullName: form.fullName.trim() ? "" : "Fyll i ditt namn.",
};

// Valid if there's no empty strings
const isValid = !errors.companyName && !errors.companyEmail && !errors.fullName;


// Copy the template to clipboard
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(template);
        setCopied(true);

        // Restore after 1.2 seconds
        setTimeout(() => setCopied(false), 1200);
    } catch (err) {
        console.error(err); {/* Logs the error to aviod ESLint unused-vars */}
        alert("Kunde inte kopiera automatiskt. Markera texten och kopiera den manuellt.")
    }
}

// Create mailto-link based on the form
const mailtoLink = `mailto:${form.companyEmail}?subject=${encodeURIComponent(
    `GDPR-begäran - ${form.fullName}`
)}&body${encodeURIComponent(template)}`;

    return (
        <div className="page">
            {/* Topbar navigaton button*/}
            <TopBar onBack={onBack} />

            {/* Main content */}
            <main className="container">
                <div className="card">
                    <div className="grid-2">
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
                            {errors.companyName && <small className="hint">{errors.companyName}</small>}
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
                            {errors.companyEmail && <small className="hint">{errors.companyEmail}</small>}
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
                            {errors.fullName && <small className="hint">{errors.fullName}</small>}
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
                        <div className="field">
                            <label>Länk (valfritt)</label>
                            <input
                            type="url"
                            placeholder="Ex: https://exempel.com/profil/..."
                            value={form.profileUrl}
                            onChange={(e) => updateField ("profileUrl", e.target.value)}
                            />
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* GDPR-type chips*/}
                    <div className="block">
                        <h2>Vad vill du begära?</h2>
                        <p className="muted">Välj en eller flera.</p>

                        <div className="chip-grid">
                            {REQUEST_TYPES.map((t) => (
                                <label className="chip" key={t.id}>
                                    <input 
                                    type="checkbox"
                                    checked={form.requestTypes.includes(t.id)}
                                    onChange={() => toggleRequestType(t.id)}
                                    />
                                    <span>{t.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <hr className="divider" />

                    <div className="field">
                        <label>Förhandsvisning av GDPR-begäran</label>
                        <textarea
                            readOnly
                            value={template}
                            style={{ minHeight: 265, minWidth: 1050}}
                        />
                    </div>

                    <div className="actions">
                        <button className="btn btn-secondary" type="button" onClick={onBack}>
                            Tillbaka
                        </button>

                        <button className="btn" type="button" onClick={copyToClipboard} disabled={!isValid}
                        style={!isValid ? { opacity: 0.6, cursor: "not-allowed"} : undefined}>
                        {copied ? "Kopierat" : "Kopiera text"}
                        </button>
                        
                        {/* Opens external mail program with the content of the form 
                        TODO: DOESN'T WORK - ONLY SUBJECT WORKS NOT THE "TEXT" INPUT. FIX!!*/}
                        <a href={isValid ? mailtoLink : "#"}
                            className="btn"
                            style={!isValid ? { opacity: 0.6, pointerEvents: "none" } : undefined}
                            >
                            Öppna i mail
                        </a>
                    </div>

                    {/* Create a textfield to user when a field that's mandatory isn't filled out  */}
                    {!isValid && (
                        <small className="hint">
                            Fyll i de obligatoriska fälten (*) för att kunna kopiera en komplett mall.
                        </small>
                    )}

                    {/* DEBUG: test för att se att state funkar */}
                    <pre style={{ marginTop: 16 }}>
                    {JSON.stringify(form, null, 2)}

                    </pre>
                </div>
            </main>
        </div>
    );
}

// Export the component
export default FormPage;