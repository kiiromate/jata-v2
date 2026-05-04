import EmptyState from '../components/EmptyState';

const AnalyticsPage = () => {
  return (
    <div className="container mx-auto p-sm sm:p-md lg:p-lg max-w-4xl">
      <div className="mb-md">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Analytics are temporarily unavailable while the launch data contract is being finalized.
        </p>
      </div>
      <EmptyState message="Your dashboard and application tracking are ready. Analytics will return after the RPC contract is aligned in the next branch." />
    </div>
  );
};

export default AnalyticsPage;
