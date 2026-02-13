

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-amber-200/50 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">Carregando sistema...</p>
            </div>
        </div>
    );
}
