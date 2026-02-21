import { useState } from 'react';
import FirstPage from './pages/FirstPage'
import FormPage from './pages/FormPage';

function App() {
  const [page, setPage] = useState("home");

if (page === "form"){
  return <FormPage onBack={() => setPage("home")} />;
}

  return <FirstPage goToForm={() => setPage("form")} />;
}

export default App;


