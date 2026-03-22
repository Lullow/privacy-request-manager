import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// TODO:?
// ESLint/Vite klagar på useAuth eftersom AuthProvider exportas ovanför. Koden funkar men den rekommenderar att ändra.
// Går att fixa genom att lägga in denna export i en annan fil, ex. src/components(AuthContext.jsx)
// Importa då och lägg in funktionen:
//import { useContext } from "react";
//import { AuthContext } from "./AuthContext";
// Egen hook så att vi simpelt kan använda auth i andra komponenter 
export function useAuth() {
    return useContext(AuthContext);
}