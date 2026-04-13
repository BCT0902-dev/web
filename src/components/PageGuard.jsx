import React from 'react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import Maintenance from '../pages/Maintenance';

/**
 * PageGuard wraps a component and checks if its corresponding section is in maintenance mode.
 * @param {string} pageId - The identifier for the page in config.maintenance (e.g., 'water', 'chat', 'youtube')
 * @param {React.ReactNode} children - The actual page content to render if not in maintenance
 */
const PageGuard = ({ pageId, children }) => {
  const { config, loading } = useConfig();
  const { isAdmin } = useAuth();

  // While loading config, show nothing or a small spinner if needed
  if (loading) return null;

  const isUnderMaintenance = config?.maintenance?.[pageId] === true;

  // If page is under maintenance AND user is NOT an admin, show Maintenance page
  if (isUnderMaintenance && !isAdmin) {
    return <Maintenance />;
  }

  // Otherwise, allow access
  return <>{children}</>;
};

export default PageGuard;
