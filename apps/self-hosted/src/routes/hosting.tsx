import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

// Signup, pricing and payment live in the main Ecency app; this route only forwards there so
// stale pricing/copy can never drift on tenant instances again.
const SIGNUP_URL = 'https://ecency.com/hosting';

export const Route = createFileRoute('/hosting')({
  component: HostingPage,
});

function HostingPage() {
  useEffect(() => {
    window.location.replace(SIGNUP_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <a
        href={SIGNUP_URL}
        className="text-blue-600 dark:text-blue-400 hover:underline"
      >
        Continue to Ecency blog and community hosting
      </a>
    </div>
  );
}
