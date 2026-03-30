import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// Egen hook så att vi simpelt kan använda auth i andra komponenter
export function useAuth() {
    return useContext(AuthContext);
}