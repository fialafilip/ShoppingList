import { SortAsc } from 'lucide-react';
import PropTypes from 'prop-types';

export function SortingControl({ sortBy, onSortChange }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <SortAsc size={20} className="text-gray-400" />
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      >
        <option value="custom">Vlastní pořadí</option>
        <option value="name">Podle názvu</option>
        <option value="date">Podle data</option>
        <option value="completed">Podle stavu</option>
      </select>
    </div>
  );
}

SortingControl.propTypes = {
  sortBy: PropTypes.oneOf(['custom', 'name', 'date', 'completed']).isRequired,
  onSortChange: PropTypes.func.isRequired,
};
