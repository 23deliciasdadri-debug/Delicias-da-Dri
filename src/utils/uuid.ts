/**
 * Gerador de UUID centralizado
 * Extração de helpers espalhados nos services para reutilização
 */

/**
 * Gera um UUID v4
 * Usa crypto.randomUUID() quando disponível, fallback para implementação manual
 */
export const generateUuid = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback para ambientes sem crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const rand = (Math.random() * 16) | 0;
        const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
        return value.toString(16);
    });
};

/**
 * Gera um ID curto para uso local (não persistente)
 * @example generateLocalId() => "abc123xyz"
 */
export const generateLocalId = (): string => {
    return Math.random().toString(36).substring(2, 11);
};
