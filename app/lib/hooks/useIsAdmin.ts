import { useState, useEffect } from "react";

export function useIsAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const response = await fetch("/api/user/check-admin");
            const data = await response.json();
            setIsAdmin(data.isAdmin || false);
        } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    return { isAdmin, loading };
}
