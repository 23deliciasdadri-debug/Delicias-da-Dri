import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface StepNavigationProps {
    currentStep: number;
    totalSteps: number;
    onBack: () => void;
    onNext: () => void;
    canGoNext?: boolean;
    isLastStep?: boolean;
    isGenerating?: boolean;
}

/**
 * Navegação do wizard com botões Voltar e Próximo.
 */
const StepNavigation: React.FC<StepNavigationProps> = ({
    currentStep,
    totalSteps,
    onBack,
    onNext,
    canGoNext = true,
    isLastStep = false,
    isGenerating = false,
}) => {
    return (
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <Button
                variant="outline"
                onClick={onBack}
                disabled={currentStep === 0}
                className="rounded-full"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
            </Button>

            <span className="text-sm text-muted-foreground">
                {currentStep + 1} de {totalSteps}
            </span>

            <Button
                onClick={onNext}
                disabled={!canGoNext || isGenerating}
                className="bg-storefront-primary hover:bg-storefront-primary/90 text-white rounded-full"
            >
                {isGenerating ? (
                    <>
                        <span className="animate-spin mr-2">⏳</span>
                        Gerando...
                    </>
                ) : isLastStep ? (
                    <>
                        Gerar Bolo
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                ) : (
                    <>
                        Próximo
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                )}
            </Button>
        </div>
    );
};

export default StepNavigation;
