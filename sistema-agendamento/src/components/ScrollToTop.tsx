import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Use a small timeout to ensure it runs after layout calculation/browser scroll restoration
        const timeoutId = setTimeout(() => {
            // Force window scroll
            window.scrollTo(0, 0);
            document.documentElement.scrollTo(0, 0);
            document.body.scrollTo(0, 0);

            // Reset AdminLayout scroll container
            const adminContent = document.getElementById('admin-main-content');
            if (adminContent) {
                adminContent.scrollTo(0, 0);
            }
        }, 10); // 10ms delay is usually sufficient to override native behavior

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    return null;
}
