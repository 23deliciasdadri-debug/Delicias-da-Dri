/**
 * Utilitários para manipulação de datas sem problemas de timezone.
 * 
 * PROBLEMA: JavaScript interpreta datas no formato YYYY-MM-DD como UTC meia-noite.
 * No Brasil (UTC-3), isso causa a data aparecer como dia anterior.
 * 
 * SOLUÇÃO: Sempre adicionar T00:00:00 para forçar interpretação local.
 */

/**
 * Converte string de data (YYYY-MM-DD) para objeto Date no horário local.
 * Evita o problema de timezone que causa retroação de 1 dia.
 * 
 * @param dateStr - String no formato YYYY-MM-DD ou ISO 8601
 * @returns Date no horário local ou null se inválido
 */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;

    // Remove parte de hora se existir (pega só YYYY-MM-DD)
    const datePart = dateStr.split('T')[0];

    // Valida formato básico
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;

    // Parse manual para evitar timezone UTC
    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    // Verifica se a data é válida
    if (Number.isNaN(date.getTime())) return null;

    return date;
}

/**
 * Formata data para exibição no formato brasileiro (DD/MM/YYYY).
 * 
 * @param dateStr - String de data ou objeto Date
 * @param fallback - Valor padrão se data inválida (default: "—")
 * @returns Data formatada ou fallback
 */
export function formatLocalDate(
    dateStr: string | Date | null | undefined,
    fallback = '—'
): string {
    if (!dateStr) return fallback;

    const date = dateStr instanceof Date
        ? dateStr
        : parseLocalDate(dateStr);

    if (!date) return fallback;

    return date.toLocaleDateString('pt-BR');
}

/**
 * Formata data com hora para exibição (DD/MM/YYYY às HH:MM).
 */
export function formatLocalDateTime(
    dateStr: string | Date | null | undefined,
    fallback = '—'
): string {
    if (!dateStr) return fallback;

    let date: Date;

    if (dateStr instanceof Date) {
        date = dateStr;
    } else if (dateStr.includes('T')) {
        // ISO timestamp - parse normalmente
        date = new Date(dateStr);
    } else {
        // Data sem hora
        date = parseLocalDate(dateStr) || new Date(NaN);
    }

    if (Number.isNaN(date.getTime())) return fallback;

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formata data para exibição curta (DD/MMM).
 */
export function formatShortDate(
    dateStr: string | Date | null | undefined,
    fallback = 'Sem data'
): string {
    if (!dateStr) return fallback;

    const date = dateStr instanceof Date
        ? dateStr
        : parseLocalDate(dateStr);

    if (!date) return fallback;

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short'
    });
}

/**
 * Converte Date para string YYYY-MM-DD (para inputs HTML date).
 * Usa data local, não UTC.
 */
export function toDateInputValue(date: Date | null | undefined): string {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Extrai apenas a parte de data (YYYY-MM-DD) de uma string ISO.
 * Útil para evitar conversão timezone ao popular inputs.
 */
export function extractDatePart(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
}
