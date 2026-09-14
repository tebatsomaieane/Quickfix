/* eslint-disable react-refresh/only-export-components -- context + hook, not a page component */
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import {
    fetchCurrentUser,
    getCachedUser,
    loginUser as apiLogin,
    logoutUser as apiLogout
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function verifySession() {
            setLoading(true);

            // Optimistic boot from cache
            const cached = getCachedUser();

            if (cached) {
                setUser(cached);
            }

            // Verify against the server cookie
            try {
                const data = await fetchCurrentUser();

                setUser(data.success ? data.user : null);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        verifySession();
    }, []);

    const login = async (credentials) => {
        const data = await apiLogin(credentials);

        if (data.success) {
            setUser(data.user);
        }

        return data;
    };

    const logout = async () => {
        await apiLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, setUser, login, logout, loading }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}