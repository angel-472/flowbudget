export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  const date = createLocalDate(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}