import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Reset window scroll (Global/Teacher)
        window.scrollTo(0, 0);

        // Reset AdminLayout scroll container
        const adminContent = document.getElementById('admin-main-content');
        if (adminContent) {
            adminContent.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}
