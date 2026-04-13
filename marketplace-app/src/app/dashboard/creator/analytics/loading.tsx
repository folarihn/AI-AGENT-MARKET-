export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-100 rounded mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-7 w-32 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-8">
        <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b">
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
