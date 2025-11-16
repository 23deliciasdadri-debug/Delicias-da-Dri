import React, { useMemo, useState } from 'react';
import { Share2, LinkIcon, RefreshCcw, MessageCircle } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useSupabaseMutation } from '../../hooks/useSupabaseMutation';
import {
  buildQuotePublicUrl,
  buildQuoteWhatsAppShare,
  regenerateQuotePublicLink,
  type QuoteDetails,
} from '../../services/quotesService';

interface ShareQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteDetails | null;
  onLinkUpdated?: (payload: { token: string; expiresAt: string | null }) => void;
}

const formatExpirationInput = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 16) : '');

const ShareQuoteDialogSurface: React.FC<{
  quote: QuoteDetails | null;
  onLinkUpdated?: (payload: { token: string; expiresAt: string | null }) => void;
}> = ({ quote, onLinkUpdated }) => {
  const [expiresAt, setExpiresAt] = useState<string>(() =>
    formatExpirationInput(quote?.public_link_token_expires_at),
  );
  const [copied, setCopied] = useState(false);

  const mutation = useSupabaseMutation(
    ({ quoteId, expiresAt: input }: { quoteId: string; expiresAt?: string | null }) =>
      regenerateQuotePublicLink(quoteId, { expiresAt: input ?? null }),
    {
      onSuccess: (payload) => {
        setCopied(false);
        if (payload?.token) {
          onLinkUpdated?.({ token: payload.token, expiresAt: payload.expiresAt });
        }
      },
    },
  );

  const publicLinkToken = quote?.public_link_token ?? null;
  const currentUrl = useMemo(() => {
    if (!publicLinkToken) {
      return '';
    }
    return buildQuotePublicUrl(publicLinkToken);
  }, [publicLinkToken]);

  const handleCopy = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar link', err);
    }
  };

  const handleWhatsapp = () => {
    if (!quote) return;
    const href = buildQuoteWhatsAppShare({
      phone: quote.client?.phone,
      clientName: quote.client?.name,
      quoteUrl: currentUrl,
      totalAmount: quote.total_amount,
    });
    if (href) {
      window.open(href, '_blank', 'noopener');
    }
  };

  const handleGenerate = () => {
    if (!quote) return;
    const expiresAtISO = expiresAt ? new Date(expiresAt).toISOString() : null;
    void mutation.mutate({ quoteId: quote.id, expiresAt: expiresAtISO });
  };

  const disabledActions = !quote || mutation.isMutating;

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Compartilhar orçamento</DialogTitle>
        <DialogDescription>
          Gere um link público somente-leitura para enviar ao cliente e acompanhe o status de acesso.
        </DialogDescription>
      </DialogHeader>

      {!quote ? (
        <Alert>
          <AlertTitle>Selecione um orçamento</AlertTitle>
          <AlertDescription>Abra os detalhes de um orçamento antes de compartilhar.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-5">
          {mutation.error ? (
            <Alert variant="destructive">
              <AlertTitle>Erro ao gerar link</AlertTitle>
              <AlertDescription>{mutation.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="share-link">Link público</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="share-link"
                value={currentUrl || 'Nenhum link gerado ainda'}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={handleCopy}
                disabled={!currentUrl}
              >
                <LinkIcon className="size-4 mr-2" />
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="share-expiration">Expiração do link</Label>
              <Input
                id="share-expiration"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                disabled={disabledActions}
              />
            </div>
            <div className="space-y-2">
              <Label>Controle</Label>
              <Button type="button" onClick={handleGenerate} className="w-full" disabled={disabledActions}>
                <RefreshCcw className="size-4 mr-2" />
                {quote.public_link_token ? 'Regenerar link' : 'Gerar link'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ações rápidas</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={handleWhatsapp}
                disabled={!currentUrl}
              >
                <MessageCircle className="size-4 mr-2" />
                Enviar WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => window.open(currentUrl, '_blank', 'noopener')}
                disabled={!currentUrl}
              >
                <Share2 className="size-4 mr-2" />
                Abrir link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O cliente verá somente o documento deste orçamento e poderá aprová-lo sem acessar outras partes do app.
            </p>
          </div>
        </div>
      )}
    </DialogContent>
  );
};

const ShareQuoteDialog: React.FC<ShareQuoteDialogProps> = ({ open, onOpenChange, quote, onLinkUpdated }) => {
  const quoteKey = `${quote?.id ?? 'empty'}-${quote?.public_link_token ?? 'no-token'}-${
    quote?.public_link_token_expires_at ?? 'no-expiration'
  }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ShareQuoteDialogSurface key={quoteKey} quote={quote} onLinkUpdated={onLinkUpdated} />
    </Dialog>
  );
};

export default ShareQuoteDialog;
