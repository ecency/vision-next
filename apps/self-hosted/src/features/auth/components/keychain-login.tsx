'use client';

import { useState } from 'react';
import { login } from '../auth-actions';
import { isKeychainAvailable } from '../utils/keychain';
import { LoginMethodButton } from './login-method-button';

interface KeychainLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function KeychainLogin({ onSuccess, onError }: KeychainLoginProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const keychainAvailable = typeof window !== 'undefined' && isKeychainAvailable();

  const handleLogin = async () => {
    if (!username.trim()) {
      onError?.('Please enter your username');
      return;
    }

    setLoading(true);
    try {
      await login('keychain', username.trim().toLowerCase());
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!keychainAvailable) {
    return (
      <LoginMethodButton
        icon={<KeychainIcon />}
        label="Hive Keychain"
        description="Install the Keychain browser extension"
        onClick={() => window.open('https://hive-keychain.com/', '_blank')}
        disabled
      />
    );
  }

  if (!showInput) {
    return (
      <LoginMethodButton
        icon={<KeychainIcon />}
        label="Hive Keychain"
        description="Login using the Hive Keychain browser extension"
        onClick={() => setShowInput(true)}
      />
    );
  }

  return (
    <div className="w-full p-4 rounded-theme border border-theme-strong bg-theme-secondary">
      <div className="flex items-center gap-3 mb-4">
        <KeychainIcon />
        <span className="font-medium text-theme-primary font-theme-ui">Hive Keychain</span>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your Hive username"
          className="w-full px-3 py-2 rounded-theme input-theme font-theme-ui"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleLogin();
            }
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowInput(false)}
            className="flex-1 px-4 py-2 rounded-theme border border-theme text-theme-primary hover:bg-theme-tertiary transition-theme font-theme-ui"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading || !username.trim()}
            className="flex-1 px-4 py-2 rounded-theme bg-blue-600 text-white hover:bg-blue-700 transition-theme disabled:opacity-50 disabled:cursor-not-allowed font-theme-ui"
          >
            {loading ? 'Connecting...' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

function KeychainIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C9.24 2 7 4.24 7 7V10H6C4.9 10 4 10.9 4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12C20 10.9 19.1 10 18 10H17V7C17 4.24 14.76 2 12 2ZM12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4ZM12 14C13.1 14 14 14.9 14 16C14 17.1 13.1 18 12 18C10.9 18 10 17.1 10 16C10 14.9 10.9 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  );
}
