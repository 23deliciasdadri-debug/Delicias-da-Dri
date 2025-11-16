import React, { useMemo } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';

import type { QuoteDetails } from '../../services/quotesService';
import { prepareQuoteDocumentData } from '../../services/quotesService';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  Pendente: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  Aprovado: {
    label: 'Aprovado',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  Recusado: {
    label: 'Recusado',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Sem data definida';
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date(value));
  } catch {
    return value;
  }
};

interface QuotePreviewProps {
  quote: QuoteDetails;
  headerActions?: React.ReactNode;
  footerActions?: React.ReactNode;
  showApproveHint?: boolean;
  className?: string;
}

const QuotePreview: React.FC<QuotePreviewProps> = ({
  quote,
  headerActions,
  footerActions,
  showApproveHint = false,
  className,
}) => {
  const documentData = useMemo(() => prepareQuoteDocumentData({ quote, client: quote.client || undefined, items: quote.items }), [quote]);
  const statusInfo = STATUS_LABELS[quote.status] ?? STATUS_LABELS.Pendente;
  const isQuoteApproved = quote.status === 'Aprovado';

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card shadow-lg shadow-rose-100/50 overflow-hidden flex flex-col',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-5 bg-gradient-to-r from-rose-50 to-orange-50">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Orcamento #{quote.id.slice(0, 8)}</p>
          <h2 className="text-3xl font-serif font-bold text-foreground mt-1">{quote.event_type || 'Proposta personalizada'}</h2>
          <p className="text-sm text-muted-foreground">{documentData.client.name || 'Cliente não identificado'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
          <p className="text-xs text-muted-foreground">Atualizado em {formatDate(documentData.updatedAt)}</p>
          {headerActions}
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-xl border border-dashed border-rose-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">Informações do cliente</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="font-medium text-foreground">{documentData.client.name || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="font-medium text-foreground">{documentData.client.phone || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="font-medium text-foreground">{documentData.client.email || 'Não informado'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-rose-500" />
                <p className="text-sm text-foreground">{formatDate(documentData.eventDate)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground uppercase">Itens detalhados</div>
            <div className="divide-y divide-border">
              {documentData.items.length ? (
                documentData.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-3 text-sm items-center">
                    <span className="font-medium text-foreground">{item.title}</span>
                    <span className="text-center text-muted-foreground">{item.quantity} un.</span>
                    <span className="text-right text-muted-foreground">{item.formattedUnitPrice}</span>
                    <span className="text-right font-semibold text-foreground">{item.formattedSubtotal}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhum item cadastrado.</div>
              )}
            </div>
          </div>

          {documentData.notes ? (
            <div className="rounded-xl border border-dashed border-rose-200 p-4 bg-rose-50/50">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Observações</h3>
              <p className="text-sm text-foreground whitespace-pre-line">{documentData.notes}</p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/60 p-5 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumo financeiro</p>
              <p className="text-4xl font-bold text-rose-600">{documentData.formattedTotal}</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Quantidade de itens</span>
                <span className="font-semibold text-foreground">{documentData.items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cliente</span>
                <span className="font-semibold text-foreground truncate max-w-[160px]">
                  {documentData.client.name || '-'}
                </span>
              </div>
            </div>
            {isQuoteApproved ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-700 flex items-start gap-2">
                <CheckCircle2 className="size-4 mt-0.5" />
                <p>Este orcamento foi aprovado e esta bloqueado para alteracoes.</p>
              </div>
            ) : showApproveHint ? (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-card/80 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="size-4 mt-0.5" />
                <p>
                  Ao aprovar este orcamento, registraremos automaticamente a data e notificaremos aos nosso colaboradores.
                </p>
              </div>
            ) : null}
            {footerActions ? <div className="flex flex-col gap-2">{footerActions}</div> : null}
          </div>
          <div className="rounded-xl border border-border p-4 space-y-2 text-sm text-muted-foreground">
            <p>
              Documento gerado em{' '}
              <span className="font-semibold text-foreground">{formatDate(documentData.createdAt)}</span>
            </p>
            {documentData.approvedAt ? (
              <p className="text-emerald-600 font-medium">
                Aprovado em {formatDate(documentData.approvedAt)}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default QuotePreview;
