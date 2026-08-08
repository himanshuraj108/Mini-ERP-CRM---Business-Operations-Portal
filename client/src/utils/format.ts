export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateStr));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(num: number | string | null | undefined): string {
  const n = typeof num === 'string' ? parseInt(num, 10) : (num ?? 0);
  return new Intl.NumberFormat('en-IN').format(n);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function getApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    return axiosError.response?.data?.error || 'An unexpected error occurred';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
