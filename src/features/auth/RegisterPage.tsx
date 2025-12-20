import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabaseClient';

/**
 * Página de cadastro para novos clientes.
 * Suporta cadastro com email/senha e Google OAuth.
 */
const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { session, isLoading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirecionar se já estiver logado
    useEffect(() => {
        if (session && !authLoading) {
            navigate('/');
        }
    }, [session, authLoading, navigate]);

    /**
     * Atualiza campos do formulário
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    /**
     * Cadastro com email e senha
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { name, email, phone, password, confirmPassword } = formData;

        // Validações
        if (!name.trim() || !email.trim() || !password.trim()) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        phone: phone,
                    },
                },
            });

            if (error) {
                if (error.message.includes('already registered')) {
                    toast.error('Este email já está cadastrado');
                } else {
                    toast.error(error.message);
                }
            } else {
                toast.success('Cadastro realizado! Verifique seu email para confirmar.');
                navigate('/login');
            }
        } catch (err) {
            toast.error('Erro ao criar conta. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Cadastro com Google OAuth
     */
    const handleGoogleSignup = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                toast.error('Erro ao iniciar cadastro com Google');
            }
        } catch (err) {
            toast.error('Erro ao conectar com Google');
        }
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-storefront-cream">
                <div className="w-8 h-8 border-4 border-storefront-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-storefront-cream to-storefront-primary-light p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center space-y-2">
                    <Link to="/" className="inline-block">
                        <CardTitle className="text-3xl font-bold text-storefront-primary">
                            Delícias da Dri
                        </CardTitle>
                    </Link>
                    <CardDescription>
                        Crie sua conta e comece a encomendar
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Google OAuth Button */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 h-12"
                        onClick={handleGoogleSignup}
                        disabled={isSubmitting}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Cadastrar com Google
                    </Button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">ou</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome completo *</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Seu nome"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="pl-10"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="pl-10"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="pl-10"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mínimo 6 caracteres"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="pl-10 pr-10"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Repita a senha"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="pl-10"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-storefront-primary hover:bg-storefront-primary/90"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center text-sm">
                    <div className="text-muted-foreground">
                        Já tem uma conta?{' '}
                        <Link
                            to="/login"
                            className="text-storefront-primary font-medium hover:underline"
                        >
                            Entrar
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RegisterPage;
