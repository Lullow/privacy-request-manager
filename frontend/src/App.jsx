import { useState } from 'react';
import FirstPage from './pages/FirstPage'
import FormPage from './pages/FormPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';


function App() {
  const [page, setPage] = useState("home");

// FORM PAGE
if (page === "form"){
  return <FormPage onBack={() => setPage("home")} />;
}

// LOGIN PAGE
if (page == "login"){
  return <LoginPage onBack={() => setPage("home")} onLogin={() => setPage("dashboard")} />;

}

// DASHBOARD PAGE
if (page === "dashboard") {
  return <DashboardPage/>}

// FIRST PAGE (HOME)
  return (
  <FirstPage 
  goToForm={() => setPage("form")} 
  goToLogin={() => setPage("login")}
  goToDashboard={() => setPage("dashboard")}
  />
  );
}




export default App;


