import { useState } from 'react';
import FirstPage from './pages/FirstPage'
import FormPage from './pages/FormPage';
import LoginPage from './pages/LoginPage';


function App() {
  const [page, setPage] = useState("home");

// FORM PAGE
if (page === "form"){
  return <FormPage onBack={() => setPage("home")} />;
}

// LOGIN PAGE
if (page == "login"){
  return <LoginPage onBack={() => setPage("home")} />;
}

// FIRST PAGE (HOME)
  return (
  <FirstPage 
  goToForm={() => setPage("form")} 
  goToLogin={() => setPage("login")}
  />
  );
}

export default App;


