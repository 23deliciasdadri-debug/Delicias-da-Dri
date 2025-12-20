import React, { useState } from 'react';
import { Circle, Square, Heart, Hash, Cake } from 'lucide-react';
import StepIndicator from './StepIndicator';
import StepNavigation from './StepNavigation';
import SelectionCard from './SelectionCard';

/**
 * Estado das escolhas do bolo personalizado
 */
export interface CakeChoices {
    format: string;
    size: string;
    flavor: string;
    fillings: string[];
    covering: string;
    theme: string;
    color: string;
    message: string;
    referenceImageUrl?: string;
}

const INITIAL_CHOICES: CakeChoices = {
    format: '',
    size: '',
    flavor: '',
    fillings: [],
    covering: '',
    theme: '',
    color: '',
    message: '',
};

/**
 * Etapas do wizard
 */
const STEPS = [
    { id: 'format', label: 'Formato', shortLabel: 'Formato' },
    { id: 'size', label: 'Tamanho', shortLabel: 'Tamanho' },
    { id: 'flavor', label: 'Massa', shortLabel: 'Massa' },
    { id: 'filling', label: 'Recheios', shortLabel: 'Recheios' },
    { id: 'covering', label: 'Cobertura', shortLabel: 'Cobertura' },
    { id: 'decoration', label: 'Decoração', shortLabel: 'Decoração' },
];

/**
 * Opções de formato
 */
const FORMAT_OPTIONS = [
    { id: 'redondo', label: 'Redondo', description: 'Formato clássico circular', icon: <Circle className="w-6 h-6" /> },
    { id: 'quadrado', label: 'Quadrado', description: 'Formato elegante quadrado', icon: <Square className="w-6 h-6" /> },
    { id: 'coracao', label: 'Coração', description: 'Perfeito para ocasiões românticas', icon: <Heart className="w-6 h-6" /> },
    { id: 'numero', label: 'Número ou Letra', description: 'Formato de número ou letra', icon: <Hash className="w-6 h-6" /> },
];

/**
 * Opções de tamanho
 */
const SIZE_OPTIONS = [
    { id: 'individual', label: 'Individual', description: '1 pessoa', price: 25 },
    { id: 'p', label: 'Pequeno (P)', description: '8 a 10 fatias', price: 80 },
    { id: 'm', label: 'Médio (M)', description: '15 a 20 fatias', price: 120 },
    { id: 'g', label: 'Grande (G)', description: '25 a 30 fatias', price: 180 },
    { id: 'gg', label: 'Extra Grande (GG)', description: '35 a 45 fatias', price: 250 },
];

/**
 * Opções de massa
 */
const FLAVOR_OPTIONS = [
    { id: 'baunilha', label: 'Baunilha', description: 'Massa clássica e suave' },
    { id: 'chocolate', label: 'Chocolate', description: 'Massa rica de chocolate' },
    { id: 'red-velvet', label: 'Red Velvet', description: 'Massa vermelha aveludada' },
    { id: 'cenoura', label: 'Cenoura', description: 'Massa de cenoura tradicional' },
    { id: 'laranja', label: 'Laranja', description: 'Massa cítrica de laranja' },
    { id: 'limao', label: 'Limão', description: 'Massa refrescante de limão' },
];

/**
 * Opções de recheio
 */
const FILLING_OPTIONS = [
    { id: 'brigadeiro', label: 'Brigadeiro', description: 'Tradicional brasileiro', price: 15 },
    { id: 'ninho', label: 'Leite Ninho', description: 'Cremoso de leite ninho', price: 15 },
    { id: 'morango', label: 'Morango', description: 'Com pedaços de morango', price: 20 },
    { id: 'nutella', label: 'Nutella', description: 'Creme de avelã', price: 25 },
    { id: 'doce-de-leite', label: 'Doce de Leite', description: 'Caseiro cremoso', price: 15 },
    { id: 'maracuja', label: 'Maracujá', description: 'Mousse de maracujá', price: 18 },
    { id: 'limao', label: 'Limão', description: 'Mousse de limão', price: 18 },
    { id: 'coco', label: 'Coco', description: 'Recheio cremoso de coco', price: 15 },
];

/**
 * Opções de cobertura
 */
const COVERING_OPTIONS = [
    { id: 'chantilly', label: 'Chantilly', description: 'Clássico e leve' },
    { id: 'buttercream', label: 'Buttercream', description: 'Cremoso e macio' },
    { id: 'ganache', label: 'Ganache', description: 'Chocolate intenso' },
    { id: 'pasta-americana', label: 'Pasta Americana', description: 'Para decorações detalhadas' },
    { id: 'naked', label: 'Naked Cake', description: 'Sem cobertura externa' },
    { id: 'glacê', label: 'Glacê', description: 'Cobertura de açúcar brilhante' },
];

/**
 * Opções de cores
 */
const COLOR_OPTIONS = [
    { id: 'branco', label: 'Branco', color: '#FFFFFF' },
    { id: 'rosa', label: 'Rosa', color: '#F472B6' },
    { id: 'azul', label: 'Azul', color: '#60A5FA' },
    { id: 'verde', label: 'Verde', color: '#4ADE80' },
    { id: 'amarelo', label: 'Amarelo', color: '#FACC15' },
    { id: 'laranja', label: 'Laranja', color: '#FB923C' },
    { id: 'roxo', label: 'Roxo', color: '#A78BFA' },
    { id: 'vermelho', label: 'Vermelho', color: '#EF4444' },
    { id: 'chocolate', label: 'Chocolate', color: '#78350F' },
];

interface CakeBuilderWizardProps {
    onComplete: (choices: CakeChoices) => void;
    isGenerating?: boolean;
}

/**
 * Wizard de criação de bolo personalizado.
 * Guia o usuário através das etapas de customização.
 */
const CakeBuilderWizard: React.FC<CakeBuilderWizardProps> = ({
    onComplete,
    isGenerating = false,
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [choices, setChoices] = useState<CakeChoices>(INITIAL_CHOICES);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            onComplete(choices);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleStepClick = (index: number) => {
        if (index <= currentStep) {
            setCurrentStep(index);
        }
    };

    const updateChoice = <K extends keyof CakeChoices>(key: K, value: CakeChoices[K]) => {
        setChoices((prev) => ({ ...prev, [key]: value }));
    };

    const toggleFilling = (id: string) => {
        setChoices((prev) => {
            const fillings = prev.fillings.includes(id)
                ? prev.fillings.filter((f) => f !== id)
                : [...prev.fillings, id].slice(0, 3); // Max 3 recheios
            return { ...prev, fillings };
        });
    };

    const canGoNext = () => {
        switch (STEPS[currentStep].id) {
            case 'format':
                return !!choices.format;
            case 'size':
                return !!choices.size;
            case 'flavor':
                return !!choices.flavor;
            case 'filling':
                return choices.fillings.length > 0;
            case 'covering':
                return !!choices.covering;
            case 'decoration':
                return !!choices.theme && !!choices.color;
            default:
                return true;
        }
    };

    const renderStep = () => {
        switch (STEPS[currentStep].id) {
            case 'format':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-storefront-chocolate text-center">
                            Qual formato você prefere?
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {FORMAT_OPTIONS.map((opt) => (
                                <SelectionCard
                                    key={opt.id}
                                    id={opt.id}
                                    label={opt.label}
                                    description={opt.description}
                                    icon={opt.icon}
                                    isSelected={choices.format === opt.id}
                                    onSelect={(id) => updateChoice('format', id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'size':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-storefront-chocolate text-center">
                            Qual tamanho?
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SIZE_OPTIONS.map((opt) => (
                                <SelectionCard
                                    key={opt.id}
                                    id={opt.id}
                                    label={opt.label}
                                    description={opt.description}
                                    price={opt.price}
                                    icon={<Cake className="w-6 h-6" />}
                                    isSelected={choices.size === opt.id}
                                    onSelect={(id) => updateChoice('size', id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'flavor':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-storefront-chocolate text-center">
                            Qual sabor de massa?
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {FLAVOR_OPTIONS.map((opt) => (
                                <SelectionCard
                                    key={opt.id}
                                    id={opt.id}
                                    label={opt.label}
                                    description={opt.description}
                                    isSelected={choices.flavor === opt.id}
                                    onSelect={(id) => updateChoice('flavor', id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'filling':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-storefront-chocolate text-center">
                            Escolha até 3 recheios
                        </h2>
                        <p className="text-sm text-center text-storefront-chocolate/60">
                            Selecionados: {choices.fillings.length}/3
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {FILLING_OPTIONS.map((opt) => (
                                <SelectionCard
                                    key={opt.id}
                                    id={opt.id}
                                    label={opt.label}
                                    description={opt.description}
                                    price={opt.price}
                                    isSelected={choices.fillings.includes(opt.id)}
                                    onSelect={toggleFilling}
                                    disabled={!choices.fillings.includes(opt.id) && choices.fillings.length >= 3}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'covering':
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-storefront-chocolate text-center">
                            Qual cobertura?
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {COVERING_OPTIONS.map((opt) => (
                                <SelectionCard
                                    key={opt.id}
                                    id={opt.id}
                                    label={opt.label}
                                    description={opt.description}
                                    isSelected={choices.covering === opt.id}
                                    onSelect={(id) => updateChoice('covering', id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'decoration':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-storefront-chocolate text-center">
                            Decoração do bolo
                        </h2>

                        {/* Tema */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-storefront-chocolate">
                                Descreva o tema ou ocasião
                            </label>
                            <textarea
                                value={choices.theme}
                                onChange={(e) => updateChoice('theme', e.target.value)}
                                placeholder="Ex: Aniversário infantil com tema Frozen, Casamento elegante, Chá de bebê menino..."
                                className="w-full p-3 rounded-xl border border-gray-200 focus:border-storefront-primary focus:ring-1 focus:ring-storefront-primary resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Cor */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-storefront-chocolate">
                                Cor principal
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_OPTIONS.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => updateChoice('color', c.id)}
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${choices.color === c.id
                                                ? 'border-storefront-primary ring-2 ring-storefront-primary ring-offset-2'
                                                : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                        style={{ backgroundColor: c.color }}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Mensagem */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-storefront-chocolate">
                                Mensagem no bolo (opcional)
                            </label>
                            <input
                                type="text"
                                value={choices.message}
                                onChange={(e) => updateChoice('message', e.target.value)}
                                placeholder="Ex: Feliz Aniversário Maria!"
                                className="w-full p-3 rounded-xl border border-gray-200 focus:border-storefront-primary focus:ring-1 focus:ring-storefront-primary"
                                maxLength={50}
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-8">
                <StepIndicator
                    steps={STEPS}
                    currentStep={currentStep}
                    onStepClick={handleStepClick}
                />
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                {renderStep()}
            </div>

            {/* Navigation */}
            <StepNavigation
                currentStep={currentStep}
                totalSteps={STEPS.length}
                onBack={handleBack}
                onNext={handleNext}
                canGoNext={canGoNext()}
                isLastStep={currentStep === STEPS.length - 1}
                isGenerating={isGenerating}
            />
        </div>
    );
};

export default CakeBuilderWizard;
