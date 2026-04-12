import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const useAnalytics = () => {
    const trackEvent = async (eventName, params = {}) => {
        try {
            await addDoc(collection(db, 'system_analytics'), {
                event: eventName,
                ...params,
                path: window.location.pathname,
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent
            });
        } catch (err) {
            console.error("Analytics Error:", err);
        }
    };

    return { trackEvent };
};
