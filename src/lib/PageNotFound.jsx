import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-7xl font-light text-muted-foreground/40">404</h1>
                    <div className="h-0.5 w-16 bg-border mx-auto"></div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-medium text-foreground">Página não encontrada</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        A página <span className="font-medium text-foreground">"{pageName}"</span> não existe no Fizza.
                    </p>
                </div>

                <div className="pt-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                        <Home className="w-4 h-4" />
                        Voltar ao início
                    </Link>
                </div>
            </div>
        </div>
    )
}
