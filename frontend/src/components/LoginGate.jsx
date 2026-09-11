import React, { useEffect, useState } from 'react';
import { Lock, AlertCircle, LogOut } from 'lucide-react';

const AUTHORIZED_EMAIL = 'kdisharoon@gmail.com';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function LoginGate({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('foursquare_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [unauthorizedError, setUnauthorizedError] = useState(false);

  useEffect(() => {
    if (user) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '43814921133-lf12s0r1stjbqt4m8m9p031l9bcc7vgb.apps.googleusercontent.com';

    const initializeGsi = () => {
      if (window.google?.accounts?.id && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const profile = parseJwt(response.credential);
            if (!profile || profile.email !== AUTHORIZED_EMAIL) {
              setUnauthorizedError(profile?.email || 'Unauthorized Account');
              localStorage.removeItem('foursquare_auth_user');
              setUser(null);
            } else {
              setUnauthorizedError(false);
              localStorage.setItem('foursquare_auth_user', JSON.stringify(profile));
              setUser(profile);
            }
          },
        });

        const btnContainer = document.getElementById('googleSignInBtn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            width: 280,
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGsi();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initializeGsi();
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('foursquare_auth_user');
    setUser(null);
    setUnauthorizedError(false);
  };

  if (user && user.email === AUTHORIZED_EMAIL) {
    return (
      <div>
        {/* User bar */}
        <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Logged in as: <strong className="text-white">{user.email}</strong></span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 hover:text-white transition-colors text-slate-400"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-100 text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5 text-rose-600 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Foursquare & Swarm Check-ins</h1>
        <p className="text-sm text-slate-600 mb-6">
          Private access portal. Only authorized personal account (<strong>{AUTHORIZED_EMAIL}</strong>) may log in.
        </p>

        {unauthorizedError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs text-left flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-900">Access Denied</p>
              <p className="mt-0.5">
                The Google account you signed in with (<span className="font-mono">{unauthorizedError}</span>) is not permitted. Only <span className="font-mono">{AUTHORIZED_EMAIL}</span> is authorized.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center my-4 min-h-[44px]">
          <div id="googleSignInBtn"></div>
        </div>

        {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <p className="text-xs text-amber-600 mt-4 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            Note: <code>VITE_GOOGLE_CLIENT_ID</code> is not configured yet in your <code>.env</code> file.
          </p>
        )}
      </div>
    </div>
  );
}
