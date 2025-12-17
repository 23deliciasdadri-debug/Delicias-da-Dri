/**
 * Funções de validação e sanitização centralizadas
 * Extração de helpers espalhados nos services para reutilização
 */

/**
 * Regex para validar formato de data YYYY-MM-DD
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Remove todos os caracteres não-numéricos de um telefone
 * @example sanitizePhone('(11) 99999-9999') => "11999999999"
 */
export const sanitizePhone = (phone?: string | null): string => {
    return phone?.replace(/\D/g, '') ?? '';
};

/**
 * Normaliza uma string de data para formato YYYY-MM-DD
 * Retorna null se o formato for inválido
 * @example normalizeDateString('2024-01-15') => "2024-01-15"
 * @example normalizeDateString('15/01/2024') => null
 */
export const normalizeDateString = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }
    return DATE_REGEX.test(value) ? value : null;
};

/**
 * Valida se uma string é um email válido
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valida se uma string é um telefone brasileiro válido (10 ou 11 dígitos)
 */
export const isValidPhone = (phone: string): boolean => {
    const digits = sanitizePhone(phone);
    return digits.length === 10 || digits.length === 11;
};

/**
 * Remove espaços em branco extras de uma string
 */
export const trimAll = (value: string): string => {
    return value.replace(/\s+/g, ' ').trim();
};

/**
 * Sanitiza input de preço (remove R$, espaços e converte vírgula para ponto)
 * @example sanitizePriceInput('R$ 100,50') => 100.5
 */
export const sanitizePriceInput = (value: string): number => {
    const cleaned = value
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};
