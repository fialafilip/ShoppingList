import { SortAsc } from 'lucide-react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

export function SortingControl({ sortBy, onSortChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 mb-4"
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white/50 rounded-md border border-gray-100">
        <SortAsc className="w-3.5 h-3.5 text-indigo-500" />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
        >
          <option value="custom">Vlastní pořadí</option>
          <option value="name">Podle názvu</option>
          <option value="date">Podle data</option>
          <option value="completed">Podle stavu</option>
        </select>
      </div>
    </motion.div>
  );
}

SortingControl.propTypes = {
  sortBy: PropTypes.oneOf(['custom', 'name', 'date', 'completed']).isRequired,
  onSortChange: PropTypes.func.isRequired,
};
