import { createFileRoute } from '@tanstack/react-router';
import { HostingSignup } from '@/features/hosting/components/hosting-signup';

const HOSTING_API_URL = 'https://api.blogs.ecency.com/hosting';

export const Route = createFileRoute('/hosting')({
  component: HostingPage,
});

function HostingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <HostingSignup apiBaseUrl={HOSTING_API_URL} />
    </div>
  );
}
