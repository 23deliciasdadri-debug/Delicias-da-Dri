import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { useAuth } from '../providers/AuthProvider';

export default function LoginPage() {
  const { signIn, authError, isLoading: authLoading, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Informe e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn({ email, password });
    if (error) {
      setFormError(error);
    } else {
      navigate('/dashboard');
    }
    setIsSubmitting(false);
  };

  const isLoading = isSubmitting || authLoading;
  const errorMessage = formError || authError;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Bem-vindo de volta</h1>
          <p className="text-muted-foreground mt-2">Acesse seu painel administrativo para gerenciar seu negócio.</p>
        </div>

        <Card className="border-border shadow-xl shadow-border/40">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl">Entrar na conta</CardTitle>
            <CardDescription>Insira suas credenciais para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    placeholder="admin@empresa.com"
                    type="email"
                    className="pl-10"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a href="#" className="text-xs text-rose-600 hover:text-rose-700 font-medium">
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm font-medium">
                  {errorMessage}
                </div>
              )}

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    Acessar Painel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-border py-4">
            <p className="text-xs text-muted-foreground">
              Sistema protegido e monitorado.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
