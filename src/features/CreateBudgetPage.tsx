import React from 'react';
import { Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Page } from '../components/layout/Sidebar';
import { useAuth } from '../providers/AuthProvider';
import BudgetForm from './budgets/BudgetForm';

interface CreateBudgetPageProps {
  setCurrentPage: (page: Page) => void;
}

const CreateBudgetPage: React.FC<CreateBudgetPageProps> = ({ setCurrentPage }) => {
  const { profile, isLoading: isAuthLoading } = useAuth();
  const isAdmin = profile?.role === 'admin';

  if (isAuthLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-rose-500" />
        <p>Carregando permissoes...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Novo fluxo</p>
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              Criar Orcamento
            </h1>
            <p className="text-muted-foreground">
              Apenas administradores podem gerar orcamentos para evitar alteracoes indevidas.
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Sua conta atual nao possui permissao para criar orcamentos. Solicite acesso ou volte para a listagem.
          </AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentPage('budgets')}
          className="h-11 px-6 border-2 hover:border-rose-500 hover:text-rose-600"
        >
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <BudgetForm
      mode="create"
      onBack={() => setCurrentPage('budgets')}
      onSuccess={() => setCurrentPage('budgets')}
    />
  );
};

export default CreateBudgetPage;
