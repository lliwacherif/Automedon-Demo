export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    // Uses fr-FR which is dd/mm/yyyy by default
    // We force 2-digit to ensure consistency (01/01/2024 instead of 1/1/2024 if browser defaults differ)
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit' // Requested format: dd/mm/yy
    }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}
