import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import QuotePreview from '../budgets/QuotePreview';
import { Button } from '../../components/ui/button';
import {
  approveQuoteViaToken,
  buildQuoteWhatsAppShare,
  getQuotePublicPreview,
  type QuoteDetails,
  type QuotePublicPreviewPayload,
} from '../../services/quotesService';

const extractTokenFromPath = (path: string) => {
  const match = path.match(/orcamento\/preview\/([a-zA-Z0-9-]+)/);
  return match?.[1] ?? null;
};

const mapPayloadToDetails = (payload: QuotePublicPreviewPayload): QuoteDetails => ({
  ...payload.quote,
  client: payload.client,
  items: payload.items,
});

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

const PublicQuotePreviewApp: React.FC = () => {
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<FeedbackState | null>(null);
  const token = useMemo(() => extractTokenFromPath(window.location.pathname), []);

  const loadQuote = useCallback(
    async (currentToken: string) => {
      const payload = await getQuotePublicPreview(currentToken);
      return mapPayloadToDetails(payload);
    },
    [],
  );

  useEffect(() => {
    if (!token) {
      setError('Link inválido ou expirado.');
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setApprovalFeedback(null);
      try {
        const result = await loadQuote(token);
        setQuote(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'não foi possivel carregar este orçamento.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, [token, loadQuote]);

  const handleWhatsapp = () => {
    if (!quote) {
      return;
    }
    const whatsappHref = buildQuoteWhatsAppShare({
      phone: quote.client?.phone,
      clientName: quote.client?.name,
      quoteUrl: window.location.href,
      totalAmount: quote.total_amount,
    });
    if (whatsappHref) {
      window.open(whatsappHref, '_blank', 'noopener');
    }
  };

  const handleApproveQuote = async () => {
    if (!token || !quote || quote.status === 'Aprovado') {
      return;
    }
    setIsApproving(true);
    setApprovalFeedback(null);
    try {
      await approveQuoteViaToken(token);
      const refreshed = await loadQuote(token);
      setQuote(refreshed);
      setApprovalFeedback({
        type: 'success',
        message: 'orçamento aprovado com sucesso! Avisaremos a equipe automaticamente.',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'não conseguimos aprovar este orçamento.';
      setApprovalFeedback({
        type: 'error',
        message,
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="text-center space-y-1">
          <p className="text-xs uppercase tracking-[0.6em] text-rose-400">Delicias da Dri</p>
          <h1 className="text-3xl font-serif font-bold text-foreground">Visualizacao de orçamento</h1>
          <p className="text-sm text-muted-foreground">
            Este link e seguro e permite apenas a leitura deste documento.
          </p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-rose-500" />
            <p>Carregando orcamento...</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-card p-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-foreground mb-2">Ops!</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : quote ? (
          <QuotePreview
            quote={quote}
            showApproveHint
            footerActions={
              <>
                {quote.status !== 'Aprovado' ? (
                  <Button className="w-full" onClick={handleApproveQuote} disabled={isApproving}>
                    {isApproving ? 'Enviando confirmação...' : 'Aprovar orçamento'}
                  </Button>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-700 text-center">
                    Este orçamento foi aprovado em{' '}
                    <span className="font-semibold">
                      {quote.approved_at
                        ? new Date(quote.approved_at).toLocaleDateString('pt-BR')
                        : 'data não informada'}
                    </span>
                    .
                  </div>
                )}
                <Button className="w-full" variant="secondary" onClick={handleWhatsapp}>
                  Conversar pelo WhatsApp
                </Button>
                {approvalFeedback ? (
                  <p
                    className={`text-xs text-center ${
                      approvalFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {approvalFeedback.message}
                  </p>
                ) : null}
              </>
            }
          />
        ) : null}

        <footer className="text-center text-xs text-muted-foreground">
          {`Delicias da Dri ${new Date().getFullYear()}`} -- Este link expira automaticamente quando o
          orcamento for atualizado.
        </footer>
      </div>
    </div>
  );
};

export default PublicQuotePreviewApp;
