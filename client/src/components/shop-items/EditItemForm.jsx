import { useState, useEffect, forwardRef } from 'react';
import { Check, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { UNITS } from '../../constants/units';

export const EditItemForm = forwardRef(function EditItemForm({ item, onSave, onCancel, provided }) {
  const [formState, setFormState] = useState({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
  });

  useEffect(() => {
    setFormState({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    });
  }, [item]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formState.name.trim()) {
      onSave({ ...item, ...formState });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-2 bg-white rounded-xl border p-2 shadow-sm"
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      <input
        type="text"
        value={formState.name}
        onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
        className="flex-1 min-w-[200px] p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        autoFocus
      />
      <input
        type="number"
        value={formState.quantity}
        onChange={(e) => setFormState((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
        min="0.1"
        step="0.1"
        className="w-20 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <select
        value={formState.unit}
        onChange={(e) => setFormState((prev) => ({ ...prev, unit: e.target.value }))}
        className="w-24 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {UNITS.map((unit) => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
          </option>
        ))}
      </select>
      <motion.button
        type="submit"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
      >
        <Check className="w-5 h-5" />
      </motion.button>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCancel}
        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <X className="w-5 h-5" />
      </motion.button>
    </form>
  );
});

EditItemForm.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  provided: PropTypes.object.isRequired,
};
