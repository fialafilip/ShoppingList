import { useState } from 'react';
import { Plus } from 'lucide-react';
import PropTypes from 'prop-types';

export function AddShopForm({ onAdd }) {
  const [newShopName, setNewShopName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newShopName.trim()) {
      onAdd({
        name: newShopName,
        icon: '🏪',
      });
      setNewShopName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2">
        <input
          type="text"
          value={newShopName}
          onChange={(e) => setNewShopName(e.target.value)}
          placeholder="Název nového obchodu..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all duration-200"
        />
        <button
          type="submit"
          className="bg-red-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-1.5"
        >
          <Plus size={16} />
          <span>Přidat</span>
        </button>
      </div>
    </form>
  );
}

AddShopForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};
