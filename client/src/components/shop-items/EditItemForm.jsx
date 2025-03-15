import { Check, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { UNITS } from '../../constants/units';

export function EditItemForm({ item, onSave, onCancel }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (item.name.trim()) {
      onSave(item);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        type="text"
        value={item.name}
        onChange={(e) => onSave({ ...item, name: e.target.value })}
        className="flex-1 min-w-[200px] p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <input
        type="number"
        value={item.quantity}
        onChange={(e) => onSave({ ...item, quantity: Number(e.target.value) })}
        min="0.1"
        step="0.1"
        className="w-20 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={item.unit}
        onChange={(e) => onSave({ ...item, unit: e.target.value })}
        className="w-24 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        {UNITS.map((unit) => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
      >
        <Check size={20} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <X size={20} />
      </button>
    </form>
  );
}

EditItemForm.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
