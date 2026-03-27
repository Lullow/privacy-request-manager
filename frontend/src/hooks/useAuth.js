import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Enkel hook som exponerar AuthContext till komponenter.
// Används i stället för useContext(AuthContext) direkt — håller importerna rena
// och gör det tydligt att auth-data hämtas från ett dedikerat ställe.
export function useAuth() {
    return useContext(AuthContext);
}
