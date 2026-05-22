const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/** Data no formato YYYY-MM-DD (calendário do Brasil). */
export function getBrazilDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Exibe YYYY-MM-DD como dd/MM/yyyy (sem deslocar por UTC). */
export function formatBrazilDateString(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
