import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Check, MessageCircle } from 'lucide-react';

import QuotePreview from '../budgets/QuotePreview';
import { Button } from '../../components/ui/button';
import {
  approveQuoteViaToken,
  getQuotePublicPreview,
  type QuoteDetails,
  type QuotePublicPreviewPayload,
} from '../../services/quotesService';
import { supabase } from '../../lib/supabaseClient';

const extractTokenFromPath = (path: string) => {
  const match = path.match(/orcamento\/preview\/([a-zA-Z0-9-]+)/);
  return match?.[1] ?? null;
};

const mapPayloadToDetails = (payload: QuotePublicPreviewPayload): QuoteDetails => ({
  ...payload.quote,
  client: payload.client,
  items: payload.items,
});

const sanitizePhone = (phone?: string | null) => phone?.replace(/\D/g, '') ?? '';

const buildClientToBusinessWhatsApp = ({
  businessPhone,
}: {
  businessPhone: string;
}): string | null => {
  const digits = sanitizePhone(businessPhone);
  if (!digits) return null;

  const formattedDigits = digits.startsWith('55') ? digits : `55${digits}`;
  const text = encodeURIComponent('Olá! Gostaria de tirar uma dúvida.');

  return `https://wa.me/${formattedDigits}?text=${text}`;
};

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
  const [businessPhone, setBusinessPhone] = useState<string | null>(null);
  const token = useMemo(() => extractTokenFromPath(window.location.pathname), []);

  const loadQuote = useCallback(
    async (currentToken: string) => {
      const payload = await getQuotePublicPreview(currentToken);
      return mapPayloadToDetails(payload);
    },
    [],
  );

  // Fetch business phone on mount
  useEffect(() => {
    const fetchBusinessPhone = async () => {
      try {
        const { data } = await supabase.rpc('get_business_contact_phone');
        if (data) setBusinessPhone(data);
      } catch (err) {
        console.error('Erro ao buscar telefone da empresa:', err);
      }
    };
    void fetchBusinessPhone();
  }, []);

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
    if (!quote || !businessPhone) {
      return;
    }
    const whatsappHref = buildClientToBusinessWhatsApp({
      businessPhone,
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
        {/* Header Removed to match prototype */}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-rose-500" />
            <p>Carregando orcamento...</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-foreground mb-2">Ops!</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : quote ? (
          <QuotePreview
            quote={quote}
            variant="public"
            footerActions={
              <>
                {quote.status !== 'Aprovado' ? (
                  <Button
                    className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleApproveQuote}
                    disabled={isApproving}
                  >
                    <Check className="mr-2 h-5 w-5" />
                    {isApproving ? 'Enviando confirmação...' : 'Aprovar Orçamento'}
                  </Button>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-700 text-center w-full">
                    Este orçamento foi aprovado em{' '}
                    <span className="font-semibold">
                      {quote.approved_at
                        ? new Date(quote.approved_at).toLocaleDateString('pt-BR')
                        : 'data não informada'}
                    </span>
                    .
                  </div>
                )}
                <Button
                  className="w-full h-12 text-base bg-card hover:bg-muted/50 text-foreground border border-border"
                  variant="outline"
                  onClick={handleWhatsapp}
                >
                  <MessageCircle className="mr-2 h-5 w-5 text-green-600" />
                  Falar no WhatsApp
                </Button>
                {approvalFeedback ? (
                  <p
                    className={`text-xs text-center ${approvalFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
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
