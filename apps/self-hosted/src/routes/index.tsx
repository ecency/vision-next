import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-theme-primary">
      <div className="container mx-auto px-4 sm:px-5 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 heading-theme">
          Welcome Home!
        </h1>
        <p className="text-lg sm:text-xl text-theme-primary leading-relaxed">
          This is your self-hosted blog powered by Ecency.
        </p>
      </div>
    </div>
  );
}
