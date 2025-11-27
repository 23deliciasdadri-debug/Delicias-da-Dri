import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Check, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import QuotePreview from './budgets/QuotePreview';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { fetchQuoteDetails, updateQuoteStatus } from '../services/quotesService';
import { useSupabaseMutation } from '../hooks/useSupabaseMutation';

export default function PublicProposalPage() {
    const { id } = useParams<{ id: string }>();

    const fetcher = useCallback(() => {
        if (!id) throw new Error('ID do orçamento não fornecido');
        return fetchQuoteDetails(id);
    }, [id]);

    const { data: quote, isLoading, error, refetch } = useSupabaseQuery(fetcher, {
        enabled: !!id,
        deps: [id],
    });

    const approveMutation = useSupabaseMutation(
        ({ id }: { id: string }) => updateQuoteStatus(id, 'Aprovado'),
        {
            onSuccess: () => {
                toast.success('Orçamento aprovado com sucesso! Entraremos em contato em breve.');
                void refetch();
            },
            onError: () => {
                toast.error('Erro ao aprovar orçamento. Tente novamente.');
            }
        }
    );

    const handleApprove = () => {
        if (!quote) return;
        approveMutation.mutate({ id: quote.id });
    };

    const handleWhatsApp = () => {
        // TODO: Implement WhatsApp link generation based on client/company number
        toast.info('Redirecionando para o WhatsApp...');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Orçamento não encontrado</h1>
                <p className="text-slate-500">O link pode estar expirado ou incorreto.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto space-y-8 fade-in">
                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-4 shadow-lg shadow-slate-900/20">
                        <span className="text-2xl font-bold">M</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Proposta Comercial</h1>
                    <p className="text-slate-500">Preparado especialmente para você</p>
                </div>

                <QuotePreview
                    quote={quote}
                    footerActions={
                        <>
                            <Button
                                className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleApprove}
                                disabled={quote.status === 'Aprovado' || approveMutation.isMutating}
                            >
                                <Check className="mr-2 h-5 w-5" />
                                {quote.status === 'Aprovado' ? 'Orçamento Aprovado' : 'Aprovar Orçamento'}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full h-12 text-base bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                                onClick={handleWhatsApp}
                            >
                                <MessageCircle className="mr-2 h-5 w-5 text-green-600" />
                                Falar no WhatsApp
                            </Button>
                        </>
                    }
                />

                <div className="text-center text-sm text-slate-400">
                    <p>Este link expira em 7 dias.</p>
                </div>
            </div>
        </div>
    );
}
