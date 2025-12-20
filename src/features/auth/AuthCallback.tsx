import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

/**
 * Página de callback para OAuth.
 * Processa o retorno do provedor OAuth e redireciona o usuário.
 */
const AuthCallback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // O Supabase automaticamente processa o token da URL
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Erro no callback OAuth:', error);
                    navigate('/login?error=auth_error');
                    return;
                }

                if (session) {
                    // Buscar o perfil do cliente para determinar redirecionamento
                    const { data: client } = await supabase
                        .from('clients')
                        .select('role')
                        .eq('user_id', session.user.id)
                        .maybeSingle();

                    if (client?.role === 'admin' || client?.role === 'employee') {
                        navigate('/admin/dashboard');
                    } else {
                        navigate('/');
                    }
                } else {
                    navigate('/login');
                }
            } catch (err) {
                console.error('Erro ao processar callback:', err);
                navigate('/login?error=callback_error');
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-storefront-cream">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-storefront-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-storefront-chocolate font-medium">Finalizando login...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
