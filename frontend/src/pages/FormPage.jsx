import React, { useState } from "react";
import TopBar from "../components/TopBar";

// CHIPS - GDPR alternatives that user can choose from
// Outside components because it's hardwired and should not change
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

// All the values from the form gets saved here
const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    fullName: "",
    city: "",
    profileUrl: "",
    requestTypes: ["delete"],
});

// UI-state - Used to display "Kopierat" temporarily
const [copied, setCopied] = useState(false);


// Helper-function: updates a field in the form-state without having to write the object multiple times
// prev = earlier state / ...prev copies all the old fields / [key]: value overwrites the fields that we wanna change
// This is the standard-pattern to update objects in React
function updateField(key, value) {
    setForm((prev) => ({
        ...prev, 
        [key]: value,
    }));
}


// TOGGLE requestType - Adds or deletes a GDPR type in the array
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

// Fetches labels that matches the user choices (Derived values)
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

// Basic validation to control missing fields TODO: Make this more advanced 
const errors = {
    companyName: form.companyName.trim() ? "" : "Fyll i företagets namn.",
    companyEmail: form.companyEmail.trim() ? "" : "Fyll i företagets e-post.",
    fullName: form.fullName.trim() ? "" : "Fyll i ditt namn.",
};

// Valid if there's no empty strings
const isValid = !errors.companyName && !errors.companyEmail && !errors.fullName;


// Copies the template to clipboard
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


// DOESNT WORK AS INTENDED DELETE?
// CRLF linebreak to insert form message to e-mail program
const bodyForMail = template.replaceAll("\n", "\r\n");

// DOESNT WORK AS INTENDED DELETE?
// Create mailto-link based on the form
const mailtoLink = `mailto:${form.companyEmail}?subject=${encodeURIComponent(
    `GDPR-begäran - ${form.fullName}`
)}&body${encodeURIComponent(bodyForMail)}`;

// JSX (UI) - The visual representation of the state and functions above
    return (
        <div className="page"> {/* The outer wrapper for the entire page */}
            {/* Topbar navigaton bar - separate component 
            The onBack prop allows this component to navigate back to FirstPage.*/}
            <TopBar onBack={onBack} />

            {/* Main content */}
            <main className="container">        {/* Main content area */}
                <div className="card">          {/* Card wrapper for visual grouping of the form */}
                    <div className="grid-2">    {/* Grid wrapper for form inputs (currently single column layout) */}
                        <h1>Skapa GDPR-begäran</h1>
                        <p>Fyll i dina uppgifter nedan för att skapa din begäran.</p>

                        {/* FORM: company names (required) */}
                        <div className="field">
                            <label>Företag *</label>
                            <input 
                            type="text" 
                            placeholder="Ex: Google, Mrkoll.." 
                            value={form.companyName} // Reads the value from React state
                            onChange={(e) => updateField ("companyName", e.target.value)} // When user types -> update state                           
                            />
                            {/* Display validation error if field is empty */}
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

                    {/* GDPR-type chips - Render GDPR options dynamically from REQUEST_TYPES */}
                    <div className="block">
                        <h2>Vad vill du begära?</h2>
                        <p className="muted">Välj en eller flera.</p>

                        <div className="chip-grid">
                            {REQUEST_TYPES.map((t) => (
                                <label className="chip" key={t.id}>
                                    <input 
                                    type="checkbox"
                                    checked={form.requestTypes.includes(t.id)} // Checkbox is checked if its id exists in form.requestTypes
                                    onChange={() => toggleRequestType(t.id)} // Toggle selection on click
                                    />
                                    <span>{t.label}</span> {/* Display the readable label */} 
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <hr className="divider" />

                    <div className="field">
                        <label>Förhandsvisning av GDPR-begäran</label>
                        <textarea // Textarea displays dynamically generated template
                            readOnly
                            value={template}
                            style={{ minHeight: 265, minWidth: 1050}} // TODO: Can minWidth cause problems? Seems like it
                        />
                    </div>

                    {/* Navigate back */}
                    <div className="actions">
                        <button className="btn btn-secondary" type="button" onClick={onBack}>
                            Tillbaka
                        </button>
                        
                        {/* Copy generated template to clipboard */}
                        <button className="btn" 
                        type="button" 
                        onClick={copyToClipboard} 
                        disabled={!isValid}
                        style={!isValid ? { opacity: 0.6, cursor: "not-allowed"} : undefined}
                        >
                        {copied ? "Kopierat" : "Kopiera text"}
                        </button>
                        
                        {/* Opens external mail program with the content of the form 
                        TODO: DOESN'T WORK - ONLY SUBJECT WORKS NOT THE "TEXT" INPUT. FIX!!*/}
                        <a href={isValid ? mailtoLink : "#"}
                            type="button"
                            className="btn"
                            style={!isValid ? { opacity: 0.6, pointerEvents: "none" } : undefined}
                            >
                            Öppna i mail
                        </a>
                        
                        {/* DOESNT WORK AS INTENDED DELETE?*/}
                        <button className="btn"
                            type="button"
                            onClick={() => window.location.href = mailtoLink}
                            disabled={!isValid}
                            >
                                Öppna i mail
                        </button>

                        {/* DOESNT WORK AS INTENDED DELETE?*/}                        
                        <small className="hint">
                        Om texten inte följer med i din mailklient, använd Kopiera text. Klicka <b>Kopiera text</b> och klistra in i mailet.
                        </small>

                    </div>

                    {/* Show hint if required fields are missing  */}
                    {!isValid && (
                        <small className="hint">
                            Fyll i de obligatoriska fälten (*) för att kunna kopiera en komplett mall.
                        </small>
                    )}

                    {/* DEBUG: shows entire form state object */}
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