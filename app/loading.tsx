export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto" />
        </div>
        <h2 className="text-xl font-semibold text-blue-600 mb-2">BeBlue</h2>
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    </div>
  );
}
