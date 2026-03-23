// Importera sidorna i appen
import FirstPage from './pages/FirstPage'
import FormPage from './pages/FormPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MessagesPage from './pages/MessagesPage';


// Importerar ProtectedRoute som skyddar sidor för inloggade användare
import ProtectedRoute from './components/ProtectedRoute';

// Importerar nödvändigheter från react-router-dom
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


// Huvudkomponenten App
export default function App() {
  return (
    // BrowserRouter måste wrappa hela appen som använder Routes
    <BrowserRouter>
      <Routes>
        {/* Hemsidan - ska alltid vara tillgänglig */}
        <Route path="/" element={<FirstPage />} />
        {/* Loginsidan - ska alltid vara tillgänglig */}
        <Route path="/login" element={<LoginPage />} />
        {/* Skapa en skyddad request-sida */}
        <Route 
          path="/create-request"
          element={
            <ProtectedRoute>
              <FormPage />
            </ProtectedRoute>
          }
          />
          {/* Skapa en skyddad dashboard-sida */}
          <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />

        {/* Catch-all OM användaren går till en okänd route och skicka tillbaka "/" (FirstPage) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


