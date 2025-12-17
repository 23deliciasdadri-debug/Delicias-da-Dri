/**
 * Funções de formatação centralizadas
 * Extração de helpers espalhados nos services para reutilização
 */

/**
 * Formatador de moeda BRL padrão
 */
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

/**
 * Formata um valor numérico como moeda BRL
 * @example formatCurrency(100) => "R$ 100,00"
 */
export const formatCurrency = (value: number): string => {
    return currencyFormatter.format(Number(value ?? 0));
};

/**
 * Formata uma data para o padrão brasileiro DD/MM/YYYY
 * @example formatDateBR('2024-01-15') => "15/01/2024"
 */
export const formatDateBR = (date: string | Date | null | undefined): string => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('pt-BR');
};

/**
 * Formata uma data para exibição com hora
 * @example formatDateTimeBR('2024-01-15T10:30:00') => "15/01/2024 10:30"
 */
export const formatDateTimeBR = (date: string | Date | null | undefined): string => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Formata um número de telefone para exibição (XX) XXXXX-XXXX
 * @example formatPhone('11999999999') => "(11) 99999-9999"
 */
export const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
};

/**
 * Converte uma string em slug (URL-friendly)
 * Remove acentos, caracteres especiais e espaços
 * @example slugify('João da Silva') => "joao-da-silva"
 */
export const slugify = (value: string): string => {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
};

/**
 * Formata um ID de quote/order para exibição
 * @example formatShortId('a1b2c3d4-e5f6-7890') => "#a1b2c3d4"
 */
export const formatShortId = (id: string): string => {
    return `#${id.slice(0, 8)}`;
};
