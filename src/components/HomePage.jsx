import SummaryCards from './SummaryCards.jsx'
import PeriodFilter from './PeriodFilter.jsx'
import TransactionList from './TransactionList.jsx'

export default function HomePage({
  periodItems,
  income,
  expense,
  onExportMonth,
  onExportYear,
  exporting,
  onEdit,
  onDelete,
}) {
  return (
    <div className="space-y-4">
      <SummaryCards income={income} expense={expense} />

      <PeriodFilter
        onExportMonth={onExportMonth}
        onExportYear={onExportYear}
        exporting={exporting}
      />

      <TransactionList items={periodItems} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}
