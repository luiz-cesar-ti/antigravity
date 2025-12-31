import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">404 - Página não encontrada</h2>
                <p className="mt-2 text-sm text-gray-600">
                    A página que você está procurando não existe ou foi movida.
                </p>
                <div className="mt-6">
                    <Link to="/" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                        <Home className="h-4 w-4 mr-2" />
                        Voltar ao Início
                    </Link>
                </div>
            </div>
        </div>
    );
}
