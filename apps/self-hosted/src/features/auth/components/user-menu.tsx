'use client';

import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useAuth, useIsAuthenticated, useIsAuthEnabled } from '../hooks';
import { t } from '@/core';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, logout } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const isAuthEnabled = useIsAuthEnabled();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setIsOpen(false);
  }, [logout]);

  // If auth is disabled, don't show anything
  if (!isAuthEnabled) {
    return null;
  }

  // If not authenticated, show login link
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        search={{ redirect: '/' }}
        className={clsx(
          'px-3 py-1.5 text-sm font-medium rounded-md',
          'text-theme-primary hover:bg-theme-hover transition-colors',
          className
        )}
      >
        {t('login')}
      </Link>
    );
  }

  // Show user menu dropdown
  return (
    <div className={clsx('relative', className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-theme-hover transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-theme-primary font-medium hidden sm:inline">
          {user?.username}
        </span>
        <svg
          className={clsx('w-4 h-4 text-theme-muted transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 py-1 rounded-md shadow-lg bg-theme border border-theme z-50">
          <div className="px-4 py-2 border-b border-theme">
            <p className="text-sm font-medium text-theme-primary truncate">{user?.username}</p>
            <p className="text-xs text-theme-muted capitalize">{user?.loginType}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-theme-hover transition-colors"
          >
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}
