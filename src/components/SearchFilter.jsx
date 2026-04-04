import './SearchFilter.css';

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export default function SearchFilter({
  searchTerm, onSearchChange,
  statusFilter, onStatusChange,
  statusOptions,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
}) {
  return (
    <div className="search-filter">
      <div className="search-filter-input-wrap">
        <span className="search-icon"><SearchIcon /></span>
        <input
          type="text"
          className="search-filter-input"
          placeholder="Search by client or number..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <select
        className="search-filter-select"
        value={statusFilter}
        onChange={e => onStatusChange(e.target.value)}
      >
        <option value="">All Statuses</option>
        {statusOptions.map(s => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>

      <div className="search-filter-dates">
        <input
          type="date"
          className="search-filter-date"
          value={dateFrom}
          onChange={e => onDateFromChange(e.target.value)}
          title="From date"
        />
        <span className="search-filter-date-sep">—</span>
        <input
          type="date"
          className="search-filter-date"
          value={dateTo}
          onChange={e => onDateToChange(e.target.value)}
          title="To date"
        />
      </div>
    </div>
  );
}
