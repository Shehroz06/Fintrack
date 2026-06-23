export function exportTransactionsToCSV(transactions) {
  if (!transactions.length) return;

  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
  const rows = transactions.map(t => [
    t.transaction_date,
    t.type,
    t.category,
    `"${String(t.description || '').replace(/"/g, '""')}"`,
    Number(t.amount).toFixed(2)
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `fintrack_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
