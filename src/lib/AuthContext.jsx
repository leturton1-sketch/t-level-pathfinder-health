import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { getCurrentUser, setAppUser, setPlatformUser } from '@/lib/clinicalAuth';
import { clearSession, hasSession } from '@/lib/authSession';

import { resetModuleSession } from './moduleSession';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    const storedUser = getCurrentUser();

    if (storedUser?.id && hasSession()) {
      try {
        const verifiedUser = await base44.functions.invoke('appData', {
          entity_name: 'AppUser',
          operation: 'get',
          args: { id: storedUser.id },
        });
        if (!verifiedUser?.id || verifiedUser.active === false) {
          throw new Error('LEE session is no longer valid.');
        }
        setAppUser(verifiedUser, storedUser.auth_method || 'pin');
        setUser(verifiedUser);
        setIsAuthenticated(true);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        return true;
      } catch {
        clearSession();
        setAppUser(null);
      }
    }

    if (appParams.token) {
      try {
        const platformUser = await base44.auth.me();
        if (platformUser?.id) {
          setPlatformUser(platformUser);
          setUser(platformUser);
          setIsAuthenticated(true);
          setAuthChecked(true);
          setIsLoadingAuth(false);
          return true;
        }
      } catch {
        // The custom LEE login remains available when a platform token
        // is missing, expired or not accepted by the published environment.
      }
    }

    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    setIsLoadingAuth(false);
    return false;
  }, []);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(true);
    setAppPublicSettings({ id: appParams.appId, public_settings: {} });
    try {
      await checkUserAuth();
    } catch (error) {
      setAuthError({
        type: 'unknown',
        message: error?.message || 'Unable to initialise LEE.',
      });
    } finally {
      setIsLoadingPublicSettings(false);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const logout = (shouldRedirect = true) => {
    resetModuleSession();
    if (hasSession()) {
      base44.functions.invoke('appData', { revoke_session: true }).catch(() => {});
    }
    setPlatformUser(null);
    setAppUser(null);
    clearSession();
    for (const key of ['pathfinder-unlocked', 'pathfinder-welcomed', 'pathfinder-app-user-v2']) {
      try { sessionStorage.removeItem(key); } catch {}
    }
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);

    if (shouldRedirect && appParams.token) {
      base44.auth.logout(window.location.origin + '/');
    } else if (typeof window !== 'undefined') {
      window.location.assign('/');
    }
  };

  const navigateToLogin = () => {
    if (appParams.token) base44.auth.redirectToLogin('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};