export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-80 bg-gray-100 rounded mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded mt-2 animate-pulse" />
            <div className="h-3 w-1/3 bg-gray-100 rounded mt-2 animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded mt-4 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
