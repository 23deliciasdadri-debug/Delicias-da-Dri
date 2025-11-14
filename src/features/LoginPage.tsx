import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Cake } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

const LoginPage: React.FC = () => {
  const { signIn, authError, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!email || !password) {
      setFormError('Informe e-mail e senha.');
      return;
    }
    setIsSubmitting(true);
    const { error } = await signIn({ email, password });
    if (error) {
      setFormError(error);
    }
    setIsSubmitting(false);
  };

  const errorMessage = formError ?? authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 relative backdrop-blur-sm bg-white/90">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="mx-auto w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Cake className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-serif font-bold text-balance bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              Delícias da Dri
            </CardTitle>
            <p className="text-muted-foreground text-lg">Gerencie seu negócio com facilidade</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@empresa.com"
                className="h-12 border-2 focus:border-rose-500 transition-colors"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12 border-2 focus:border-rose-500 transition-colors"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            {errorMessage ? (
              <p className="text-sm font-medium text-red-500 text-center">{errorMessage}</p>
            ) : null}
            <Button
              className="w-full h-12 gradient-primary text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100"
              type="submit"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Esqueceu sua senha?{' '}
            <span className="text-rose-600 font-medium cursor-pointer hover:underline">Recuperar</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
