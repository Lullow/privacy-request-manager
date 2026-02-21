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