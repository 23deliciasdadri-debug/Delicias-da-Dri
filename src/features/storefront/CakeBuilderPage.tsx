import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import CakeBuilderWizard, { type CakeChoices } from '../../components/cake-builder/CakeBuilderWizard';
import { generateCakeImage, calculateCakePrice, saveCakeCreation } from '../../services/aiService';
import { useCart } from '../../providers/CartProvider';
import { useAuth } from '../../providers/AuthProvider';
import { toast } from 'sonner';

type BuilderState = 'wizard' | 'generating' | 'result';

/**
 * Página principal do Cake Builder.
 * Permite ao usuário criar um bolo personalizado passo a passo.
 */
const CakeBuilderPage: React.FC = () => {
    const { addItem } = useCart();
    const { clientProfile } = useAuth();

    const [state, setState] = useState<BuilderState>('wizard');
    const [choices, setChoices] = useState<CakeChoices | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [estimatedPrice, setEstimatedPrice] = useState(0);

    const handleWizardComplete = async (wizardChoices: CakeChoices) => {
        setChoices(wizardChoices);
        setState('generating');

        // Calcular preço
        const price = calculateCakePrice(wizardChoices);
        setEstimatedPrice(price);

        // Gerar imagem
        const result = await generateCakeImage(wizardChoices);

        if (result.error || !result.imageUrl) {
            toast.error('Erro ao gerar imagem do bolo. Tente novamente.');
            setState('wizard');
            return;
        }

        setGeneratedImage(result.imageUrl);
        setState('result');

        // Salvar criação (se logado)
        if (clientProfile?.id) {
            await saveCakeCreation({
                clientId: clientProfile.id,
                choices: wizardChoices,
                imageUrl: result.imageUrl,
                estimatedPrice: price,
            });
        }
    };

    const handleRegenerate = async () => {
        if (!choices) return;

        setState('generating');
        const result = await generateCakeImage(choices);

        if (result.error || !result.imageUrl) {
            toast.error('Erro ao gerar nova versão.');
            setState('result');
            return;
        }

        setGeneratedImage(result.imageUrl);
        setState('result');
        toast.success('Nova versão gerada!');
    };

    const handleAddToCart = () => {
        if (!choices || !generatedImage) return;

        addItem({
            productName: `Bolo Personalizado - ${choices.theme || 'Customizado'}`,
            price: estimatedPrice,
            quantity: 1,
            isCustomCake: true,
            cakeChoices: choices,
            generatedImageUrl: generatedImage,
        });

        toast.success('Bolo adicionado ao carrinho!');
    };

    const handleStartOver = () => {
        setChoices(null);
        setGeneratedImage(null);
        setState('wizard');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-storefront-cream to-white pt-24 pb-16">
            <div className="container mx-auto px-4">
                {/* Header */}
                {state === 'wizard' && (
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-storefront-chocolate/70 hover:text-storefront-primary mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>
                )}

                <div className="text-center mb-8">
                    <h1
                        className="text-3xl md:text-4xl font-semibold text-storefront-primary mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        {state === 'result' ? 'Seu Bolo Personalizado' : 'Faça o Seu Bolo'}
                    </h1>
                    <p className="text-storefront-chocolate/60">
                        {state === 'result'
                            ? 'Confira como ficou o seu bolo!'
                            : 'Escolha cada detalhe e deixe a mágica acontecer'}
                    </p>
                </div>

                {/* Wizard */}
                {state === 'wizard' && (
                    <CakeBuilderWizard
                        onComplete={handleWizardComplete}
                        isGenerating={false}
                    />
                )}

                {/* Generating */}
                {state === 'generating' && (
                    <div className="max-w-md mx-auto text-center py-16">
                        <div className="w-24 h-24 rounded-full bg-storefront-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Sparkles className="w-12 h-12 text-storefront-primary animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                        <h2 className="text-xl font-semibold text-storefront-chocolate mb-2">
                            Criando seu bolo...
                        </h2>
                        <p className="text-storefront-chocolate/60">
                            Nossa IA está preparando uma prévia exclusiva do seu bolo. Isso pode levar alguns segundos.
                        </p>
                    </div>
                )}

                {/* Result */}
                {state === 'result' && generatedImage && choices && (
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Image */}
                            <div className="relative">
                                <div className="aspect-square rounded-3xl overflow-hidden shadow-xl bg-white">
                                    <img
                                        src={generatedImage}
                                        alt="Seu bolo personalizado"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    onClick={handleRegenerate}
                                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-storefront-chocolate hover:bg-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2 transition-all"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Gerar outra versão
                                </button>
                            </div>

                            {/* Details */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl p-6 shadow-sm">
                                    <h3 className="font-semibold text-storefront-chocolate mb-4">
                                        Detalhes do seu bolo
                                    </h3>

                                    <dl className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <dt className="text-storefront-chocolate/60">Formato:</dt>
                                            <dd className="font-medium text-storefront-chocolate capitalize">{choices.format}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-storefront-chocolate/60">Tamanho:</dt>
                                            <dd className="font-medium text-storefront-chocolate uppercase">{choices.size}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-storefront-chocolate/60">Massa:</dt>
                                            <dd className="font-medium text-storefront-chocolate capitalize">{choices.flavor}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-storefront-chocolate/60">Recheios:</dt>
                                            <dd className="font-medium text-storefront-chocolate capitalize">
                                                {choices.fillings.join(', ')}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-storefront-chocolate/60">Cobertura:</dt>
                                            <dd className="font-medium text-storefront-chocolate capitalize">{choices.covering}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-storefront-chocolate/60">Tema:</dt>
                                            <dd className="font-medium text-storefront-chocolate">{choices.theme}</dd>
                                        </div>
                                        {choices.message && (
                                            <div className="flex justify-between">
                                                <dt className="text-storefront-chocolate/60">Mensagem:</dt>
                                                <dd className="font-medium text-storefront-chocolate">"{choices.message}"</dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Price */}
                                <div className="bg-storefront-primary/5 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-storefront-chocolate">Valor estimado:</span>
                                        <span className="text-2xl font-bold text-storefront-primary">
                                            {new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            }).format(estimatedPrice)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-storefront-chocolate/50 mb-4">
                                        * Valor sujeito a confirmação após análise do pedido
                                    </p>

                                    <Button
                                        onClick={handleAddToCart}
                                        className="w-full bg-storefront-primary hover:bg-storefront-primary/90 text-white h-14 rounded-full text-lg"
                                    >
                                        <ShoppingBag className="w-5 h-5 mr-2" />
                                        Quero esse bolo!
                                    </Button>
                                </div>

                                {/* Start Over */}
                                <Button
                                    variant="ghost"
                                    onClick={handleStartOver}
                                    className="w-full text-storefront-chocolate/60 hover:text-storefront-primary"
                                >
                                    Criar outro bolo
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CakeBuilderPage;
