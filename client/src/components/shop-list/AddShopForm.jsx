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
          className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Přidat</span>
        </button>
      </div>
    </form>
  );
}

AddShopForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};
