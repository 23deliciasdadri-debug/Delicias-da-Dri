import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Step {
    id: string;
    label: string;
    shortLabel?: string;
}

interface StepIndicatorProps {
    steps: Step[];
    currentStep: number;
    onStepClick?: (index: number) => void;
}

/**
 * Indicador de progresso do wizard.
 * Mostra todas as etapas e destaca a atual.
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({
    steps,
    currentStep,
    onStepClick,
}) => {
    return (
        <div className="w-full">
            {/* Mobile - numbers only */}
            <div className="flex items-center justify-between md:hidden px-2">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <React.Fragment key={step.id}>
                            <button
                                onClick={() => onStepClick?.(index)}
                                disabled={index > currentStep}
                                className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                                    isCompleted && 'bg-storefront-primary text-white',
                                    isCurrent && 'bg-storefront-primary/20 text-storefront-primary ring-2 ring-storefront-primary',
                                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500',
                                    index <= currentStep && 'cursor-pointer',
                                    index > currentStep && 'cursor-not-allowed'
                                )}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                            </button>

                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        'flex-1 h-0.5 mx-1',
                                        index < currentStep ? 'bg-storefront-primary' : 'bg-gray-200'
                                    )}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Desktop - with labels */}
            <div className="hidden md:flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={() => onStepClick?.(index)}
                                    disabled={index > currentStep}
                                    className={cn(
                                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all mb-2',
                                        isCompleted && 'bg-storefront-primary text-white',
                                        isCurrent && 'bg-storefront-primary/20 text-storefront-primary ring-2 ring-storefront-primary',
                                        !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500',
                                        index <= currentStep && 'cursor-pointer hover:scale-105',
                                        index > currentStep && 'cursor-not-allowed'
                                    )}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                                </button>
                                <span
                                    className={cn(
                                        'text-xs text-center max-w-[80px]',
                                        isCurrent && 'font-medium text-storefront-primary',
                                        isCompleted && 'text-storefront-primary',
                                        !isCompleted && !isCurrent && 'text-gray-500'
                                    )}
                                >
                                    {step.shortLabel || step.label}
                                </span>
                            </div>

                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        'flex-1 h-0.5 mx-2 mb-6',
                                        index < currentStep ? 'bg-storefront-primary' : 'bg-gray-200'
                                    )}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;
