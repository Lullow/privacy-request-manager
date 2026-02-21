function FirstPage({ goToForm }) {

const goToLogin = () => {
// TODO: add loginpage 
}
const goToTemplate = () => {
    if (goToForm) {
    goToForm(); // kopplar till App utan att ändra din struktur
}
}



return(

<section className="hero">
    <div className="hero-content">

        <div className="hero-text">
            <h1>Radera ditt digitala fotspår</h1>
            <p>Hantera GDPR-raderingar enkelt och strukturerat</p>

  {/* goToLogin placeholder  */}  
            <div className="Buttons">
                <button className= "get-started-btn" onClick={goToLogin}>
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
        <div className="feature">
            <h3>Skapa konto</h3>
            <p>Registrera dig säkert och enkelt</p>
        </div>

        <div className="feature">
            <div className="Buttons">

                  {/* To form/template or to login? */}  
                <button className="generate-template-btn" onClick={goToTemplate}>   
                Generera begäran
                </button>
            </div>
            <p>Få juridiskt korrekt GDPR-begäran</p>
        </div>

        <div className="feature">
            <h3>Följ upp</h3>
            <p>Spåra status och få påminnelser</p>
        </div>
    </div>

    <img src="./first-page2.png" alt="GDPR illustration" className="feature-image"/>
</section>

</section>
);

}
export default FirstPage



//  {/* ----------------------------------------------------------------------------------- */}  
// <script>

//     const features = document.querySelectorAll('.feature');

//     window.addEventListener('scroll', () => {
//     features.forEach(feature => {
//         const rect = feature.getBoundingClientRect();
//         if (rect.top < window.innerHeight - 100) {
//             feature.classList.add('visible');
//         }
//     });
// });
// </script>


// </section>
// </body>
// </html>




