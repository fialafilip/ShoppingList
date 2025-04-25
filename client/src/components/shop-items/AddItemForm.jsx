import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { UNITS } from '../../constants/units';
import PropTypes from 'prop-types';

export function AddItemForm({ onAdd }) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('ks');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newItemName.trim()) {
      onAdd({
        name: newItemName,
        quantity: newItemQuantity,
        unit: newItemUnit,
      });
      setNewItemName('');
      setNewItemQuantity(1);
      setNewItemUnit('ks');
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Nová položka..."
          className="flex-1 min-w-0 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(Number(e.target.value))}
            min="0.1"
            step="0.1"
            className="w-20 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
          />
          <select
            value={newItemUnit}
            onChange={(e) => setNewItemUnit(e.target.value)}
            className="w-20 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
          >
            {UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Přidat</span>
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}

AddItemForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};
