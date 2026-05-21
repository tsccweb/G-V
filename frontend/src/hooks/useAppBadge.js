import { useEffect, useCallback } from 'react';

/**
 * Hook to manage the PWA App Icon Badge
 * @param {boolean} isAuthenticated - Whether the user is logged in
 */
export const useAppBadge = (isAuthenticated) => {
  const updateBadge = useCallback(async () => {
    if (!isAuthenticated) {
      if ('clearAppBadge' in navigator) {
        await navigator.clearAppBadge().catch(() => {});
      }
      return;
    }

    if (!('setAppBadge' in navigator)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/count`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.total || 0;
        
        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
      }
    } catch (error) {
      console.error('Failed to update app badge:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Update immediately
    updateBadge();

    // Poll every 1 minute
    const interval = setInterval(updateBadge, 60000);

    return () => clearInterval(interval);
  }, [updateBadge]);

  return { updateBadge };
};
