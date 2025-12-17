/**
 * Testes unitários para utils/formatters.ts
 */

import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatDateBR,
    formatPhone,
    slugify,
    formatShortId,
} from '../formatters';

describe('formatters', () => {
    describe('formatCurrency', () => {
        it('formata valores positivos corretamente', () => {
            expect(formatCurrency(100)).toBe('R$ 100,00');
            expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
            expect(formatCurrency(0.99)).toBe('R$ 0,99');
        });

        it('formata zero corretamente', () => {
            expect(formatCurrency(0)).toBe('R$ 0,00');
        });

        it('formata valores negativos', () => {
            expect(formatCurrency(-50)).toBe('-R$ 50,00');
        });
    });

    describe('formatDateBR', () => {
        it('formata datas ISO corretamente', () => {
            expect(formatDateBR('2024-01-15')).toBe('15/01/2024');
            expect(formatDateBR('2024-12-25')).toBe('25/12/2024');
        });

        it('retorna traço para valores nulos', () => {
            expect(formatDateBR(null)).toBe('—');
            expect(formatDateBR(undefined)).toBe('—');
        });

        it('formata objetos Date', () => {
            const date = new Date(2024, 0, 15); // Janeiro = 0
            expect(formatDateBR(date)).toBe('15/01/2024');
        });
    });

    describe('formatPhone', () => {
        it('formata telefones de 11 dígitos (celular)', () => {
            expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
        });

        it('formata telefones de 10 dígitos (fixo)', () => {
            expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
        });

        it('retorna vazio para valores nulos', () => {
            expect(formatPhone(null)).toBe('');
            expect(formatPhone(undefined)).toBe('');
        });

        it('retorna original se não corresponder ao padrão', () => {
            expect(formatPhone('123')).toBe('123');
        });
    });

    describe('slugify', () => {
        it('converte para minúsculas e remove acentos', () => {
            expect(slugify('João da Silva')).toBe('joao-da-silva');
            expect(slugify('AÇÚCAR')).toBe('acucar');
        });

        it('substitui espaços e caracteres especiais por hífens', () => {
            expect(slugify('Bolo de Cenoura!')).toBe('bolo-de-cenoura');
            expect(slugify('Produto (novo)')).toBe('produto-novo');
        });

        it('remove hífens duplicados', () => {
            expect(slugify('a - b - c')).toBe('a-b-c');
        });
    });

    describe('formatShortId', () => {
        it('formata ID com hash e 8 caracteres', () => {
            expect(formatShortId('a1b2c3d4-e5f6-7890-abcd-1234567890ab')).toBe('#a1b2c3d4');
        });
    });
});
