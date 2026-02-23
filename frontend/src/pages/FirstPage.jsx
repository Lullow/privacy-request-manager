import { useRef, useState, useEffect } from "react";

function FirstPage({ goToForm }) {

const goToLogin = () => {
// TODO: add loginpage 
}
const goToTemplate = () => {
    if (goToForm) {
    goToForm(); // kopplar till App utan att ändra din struktur

}
}

// Point to div
const ref1 = useRef(null)
const ref2 = useRef(null)
const ref3 = useRef(null)

// isVisible = false, setIsVisible function will change value to True
const [isVisible1, setIsVisible1] = useState(false)
const [isVisible2, setIsVisible2] = useState(false)
const [isVisible3, setIsVisible3] = useState(false)

useEffect(() => {
    // new IntersectionObserver to observe what element is visible in window
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            // isIntersecting checking if ref in window
            if (entry.isIntersecting) {
                if (entry.target === ref1.current) setIsVisible1(true)
                if (entry.target === ref2.current) setIsVisible2(true)
                if (entry.target === ref3.current) setIsVisible3(true)
            }
        })
    })

    // Point IntersectionObserver to the div ref points to
    observer.observe(ref1.current)
    observer.observe(ref2.current)
    observer.observe(ref3.current)


    // Disconnect watcher when site is closed
    return () => observer.disconnect ()
}, [])

return(

<section className="hero">
    <div className="hero-content">

        <div className="hero-text">
            <h1>Radera ditt digitala fotspår</h1>
            <p>Hantera GDPR-raderingar enkelt och strukturerat</p>

  {/* goToLogin placeholder  */}  
            <div className="Buttons">
                <button className= "FirstPage-btn" type="button" onClick={goToTemplate}>
                    Kom igång→
                </button>
            </div>
        </div>
    </div>

  {/* HeroImage  */}  
    <div className="hero-image">
        <img src="./first-page.png" alt="Hero bild"/>
    </div>


 {/* feature div for different background color */}  
<section className="features">
    <div className="feature-list">
        <div ref= {ref1} className= {isVisible1 ? "feature visible" : "feature"}>
            <h3>Skapa konto</h3>
            <p>Registrera dig säkert och enkelt</p>
        </div>

        <div ref= {ref2} className= {isVisible2 ? "feature visible" : "feature"}>
            <h3>Generera begäran</h3>
                <p>Få juridiskt korrekt GDPR-begäran</p>
            </div>

        <div ref= {ref3} className= {isVisible3 ? "feature visible" : "feature"}>
            <h3>Följ upp</h3>
            <p>Spåra status och få påminnelser</p>
        </div>

        <div className="Buttons">
            {/* To form/template or to login? */}  
            <button className="FirstPage-btn" onClick={goToTemplate}>   
                Börja direkt
            </button>
        </div>
    </div>


    <img src="./first-page2.png" alt="GDPR illustration" className="feature-image"/>
</section>

</section>
);

}
export default FirstPage

