export default function TopBar({ onBack }){
    return(
        <header className="topbar">
            <button className="brand" type="button" onClick={onBack}>
                <span className="brand-dot"></span>
                Privacy Request Manager
            </button>


            <button className="btn btn-secondary" type="button" onClick={onBack}>
                Tillbaka
            </button>
            
        </header>
    );
}