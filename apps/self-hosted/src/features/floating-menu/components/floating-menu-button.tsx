import { memo } from 'react';
import { FLOATING_MENU_THEME } from '../constants';

interface FloatingMenuButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingMenuButton = memo<FloatingMenuButtonProps>(
  ({ onClick, isOpen }) => {
    return (
      <button
        onClick={onClick}
        className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-full text-sm font-sans text-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent"
        style={{
          backgroundColor: FLOATING_MENU_THEME.background,
        }}
        aria-label={isOpen ? 'Close config editor' : 'Open config editor'}
        aria-expanded={isOpen}
        type="button"
      >
        {isOpen && (
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
        <span>Theme Settings</span>
      </button>
    );
  },
);

FloatingMenuButton.displayName = 'FloatingMenuButton';
