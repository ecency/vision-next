import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-5 py-12">
        <h1 
          className="text-4xl font-bold mb-6"
          style={{ 
            fontFamily: '"Helvetica Neue", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
            color: 'rgba(0, 0, 0, 0.84)',
            letterSpacing: '-0.015em'
          }}
        >
          Welcome Home!
        </h1>
        <p 
          className="text-xl"
          style={{ 
            color: 'rgba(0, 0, 0, 0.84)',
            lineHeight: '1.58'
          }}
        >
          This is your self-hosted blog powered by Ecency.
        </p>
      </div>
    </div>
  );
}
