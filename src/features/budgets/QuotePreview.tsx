import React from 'react';
import { Tag, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import type { QuoteDetails } from '../../services/quotesService';
import { cn } from '../../lib/utils';
import { parseLocalDate } from '../../utils/dateHelpers';

interface QuotePreviewProps {
  quote: QuoteDetails;
  className?: string;
  variant?: 'admin' | 'public';
  footerActions?: React.ReactNode;
  onGenerateOrCopyLink?: () => void;
  onShareWhatsapp?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSharing?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  Pendente: 'bg-amber-100 text-amber-800',
  Aprovado: 'bg-emerald-100 text-emerald-800',
  Recusado: 'bg-rose-100 text-rose-800',
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Não informado';
  try {
    // Usa parseLocalDate para datas YYYY-MM-DD (evita problema de timezone)
    // Para timestamps ISO, usa Date diretamente
    const date = value.includes('T') ? new Date(value) : parseLocalDate(value);
    if (!date || Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
  } catch {
    return value;
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-1 text-sm">
    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
    <p className="text-foreground font-semibold">{value || 'Não informado'}</p>
  </div>
);

const QuotePreview: React.FC<QuotePreviewProps> = ({
  quote,
  className,
  variant = 'admin',
  footerActions,
  onGenerateOrCopyLink,
  onShareWhatsapp,
  onEdit,
  onDelete,
  isSharing,
}) => {
  const statusClass = STATUS_STYLES[quote.status] ?? STATUS_STYLES.Pendente;
  const client = quote.client;
  const items = quote.items ?? [];
  const totalItems = items.reduce(
    (acc, item) => acc + Number((item as any).quantity ?? 0),
    0,
  );

  return (
    <div
      className={cn(
        variant === 'public'
          ? 'bg-card min-h-[70vh]'
          : 'rounded-2xl border border-border shadow-xl overflow-hidden bg-card',
        className,
      )}
    >
      <div className="mx-auto max-w-5xl">
        <div className="px-6 py-5 border-b border-border bg-muted/20">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {variant === 'public' ? 'Visualização de orçamento' : 'Resumo do orçamento'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {variant === 'public'
                ? 'Este link é seguro e permite apenas a leitura deste documento.'
                : 'Visualize os itens enviados ao cliente e notas complementares.'}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-4 md:gap-2 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.1em] text-primary">
                ORÇAMENTO #{quote.id.slice(0, 6)}
              </p>
              <h1 className="text-3xl font-black text-foreground">{quote.event_type || 'Orçamento'}</h1>
              <p className="text-sm text-muted-foreground">{client?.name || 'Cliente não informado'}</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <Badge className={cn('px-3 py-1 text-xs font-semibold', statusClass)}>{quote.status}</Badge>
              <p className="text-xs text-muted-foreground">
                Atualizado em {formatDate(quote.updated_at || quote.created_at)}
              </p>
              {variant === 'admin' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-border bg-card shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateOrCopyLink?.();
                    }}
                    disabled={isSharing}
                    title="Gerar/Copiar link público"
                  >
                    <Tag className="h-4 w-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-border bg-card shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareWhatsapp?.();
                    }}
                    disabled={!quote.public_link_token}
                    title="Enviar por WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-border bg-card shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                    title="Editar orçamento"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full border border-border bg-card shadow-sm text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    title="Excluir orçamento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-muted/10 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground tracking-wide">Informações do cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Nome" value={client?.name} />
                <InfoRow label="Telefone" value={client?.phone} />
                <InfoRow label="E-mail" value={client?.email} />
                <InfoRow label="Data do evento" value={formatDate(quote.event_date)} />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground tracking-wide">Resumo financeiro</p>
              <p className="text-3xl font-extrabold text-primary">{formatCurrency(quote.total_amount)}</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Quantidade de itens:{' '}
                  <span className="font-semibold">{totalItems}</span>
                </p>
                <p>
                  Cliente: <span className="font-semibold">{client?.name || 'Não informado'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground tracking-wide">Itens detalhados</h4>
            </div>
            <div className="divide-y divide-border">
              {items.length > 0 ? (
                items.map((item) => {
                  const name = (item as any).product_name_copy || (item as any).title || 'Item';
                  const quantity = Number((item as any).quantity ?? 0);
                  const price = Number((item as any).price_at_creation ?? (item as any).unit_price ?? 0);
                  const lineTotal = price * quantity;
                  return (
                    <div key={item.id} className="py-3 flex items-center text-sm">
                      <div className="flex-1 font-semibold text-foreground">{name}</div>
                      <div className="w-20 text-center text-muted-foreground">{quantity} un.</div>
                      <div className="w-28 text-right text-muted-foreground">{formatCurrency(price)}</div>
                      <div className="w-28 text-right font-semibold text-foreground">{formatCurrency(lineTotal)}</div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-muted-foreground text-sm">Nenhum item adicionado.</div>
              )}
            </div>
          </div>

          {quote.notes && (
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <h4 className="text-sm font-semibold text-foreground tracking-wide mb-2">Observações</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{quote.notes}</p>
            </div>
          )}

          {footerActions && (
            <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-3">
              {footerActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotePreview;
