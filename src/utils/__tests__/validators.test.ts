/**
 * Testes unitários para utils/validators.ts
 */

import { describe, it, expect } from 'vitest';
import {
    sanitizePhone,
    normalizeDateString,
    isValidEmail,
    isValidPhone,
    trimAll,
    sanitizePriceInput,
} from '../validators';

describe('validators', () => {
    describe('sanitizePhone', () => {
        it('remove caracteres não numéricos', () => {
            expect(sanitizePhone('(11) 99999-9999')).toBe('11999999999');
            expect(sanitizePhone('+55 11 98765-4321')).toBe('5511987654321');
        });

        it('retorna string vazia para valores nulos', () => {
            expect(sanitizePhone(null)).toBe('');
            expect(sanitizePhone(undefined)).toBe('');
        });
    });

    describe('normalizeDateString', () => {
        it('retorna data válida no formato YYYY-MM-DD', () => {
            expect(normalizeDateString('2024-01-15')).toBe('2024-01-15');
            expect(normalizeDateString('2025-12-31')).toBe('2025-12-31');
        });

        it('retorna null para formatos inválidos', () => {
            expect(normalizeDateString('15/01/2024')).toBeNull();
            expect(normalizeDateString('2024-1-5')).toBeNull();
            expect(normalizeDateString('invalid')).toBeNull();
        });

        it('retorna null para valores vazios', () => {
            expect(normalizeDateString(null)).toBeNull();
            expect(normalizeDateString(undefined)).toBeNull();
            expect(normalizeDateString('')).toBeNull();
        });
    });

    describe('isValidEmail', () => {
        it('valida emails corretos', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('nome.sobrenome@empresa.com.br')).toBe(true);
        });

        it('rejeita emails inválidos', () => {
            expect(isValidEmail('invalid')).toBe(false);
            expect(isValidEmail('user@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('')).toBe(false);
        });
    });

    describe('isValidPhone', () => {
        it('valida telefones brasileiros', () => {
            expect(isValidPhone('11999999999')).toBe(true); // celular 11 dígitos
            expect(isValidPhone('1133334444')).toBe(true);  // fixo 10 dígitos
            expect(isValidPhone('(11) 99999-9999')).toBe(true);
        });

        it('rejeita telefones inválidos', () => {
            expect(isValidPhone('123')).toBe(false);
            expect(isValidPhone('123456789012')).toBe(false);
        });
    });

    describe('trimAll', () => {
        it('remove espaços extras', () => {
            expect(trimAll('  hello   world  ')).toBe('hello world');
            expect(trimAll('a   b   c')).toBe('a b c');
        });
    });

    describe('sanitizePriceInput', () => {
        it('converte formatos brasileiros', () => {
            expect(sanitizePriceInput('100,50')).toBe(100.5);
            expect(sanitizePriceInput('1.234,56')).toBe(1234.56);
        });

        it('converte valores com R$', () => {
            expect(sanitizePriceInput('R$ 100,00')).toBe(100);
        });

        it('retorna 0 para valores inválidos', () => {
            expect(sanitizePriceInput('')).toBe(0);
            expect(sanitizePriceInput('abc')).toBe(0);
        });
    });
});
