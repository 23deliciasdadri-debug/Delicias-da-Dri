/**
 * Hook para busca de endereço por CEP usando API ViaCEP
 * API gratuita: https://viacep.com.br/
 */

import { useState, useCallback } from 'react';

export interface ViaCepAddress {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string; // cidade
    uf: string;
    erro?: boolean;
}

export interface CepLookupState {
    isLoading: boolean;
    error: string | null;
    address: ViaCepAddress | null;
}

export function useCepLookup() {
    const [state, setState] = useState<CepLookupState>({
        isLoading: false,
        error: null,
        address: null,
    });

    const lookupCep = useCallback(async (cep: string): Promise<ViaCepAddress | null> => {
        // Remove caracteres não numéricos
        const cleanCep = cep.replace(/\D/g, '');

        // Valida formato (8 dígitos)
        if (cleanCep.length !== 8) {
            setState({ isLoading: false, error: 'CEP deve ter 8 dígitos', address: null });
            return null;
        }

        setState({ isLoading: true, error: null, address: null });

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

            if (!response.ok) {
                throw new Error('Erro ao consultar CEP');
            }

            const data: ViaCepAddress = await response.json();

            if (data.erro) {
                setState({ isLoading: false, error: 'CEP não encontrado', address: null });
                return null;
            }

            setState({ isLoading: false, error: null, address: data });
            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao buscar CEP';
            setState({ isLoading: false, error: message, address: null });
            return null;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ isLoading: false, error: null, address: null });
    }, []);

    return {
        ...state,
        lookupCep,
        reset,
    };
}

/**
 * Formata CEP com máscara (00000-000)
 */
export function formatCep(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Formata CPF com máscara (000.000.000-00)
 */
export function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Valida CPF (algoritmo oficial)
 */
export function isValidCpf(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false; // Todos iguais

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(digits[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(digits[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits[10])) return false;

    return true;
}
