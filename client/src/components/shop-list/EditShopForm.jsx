import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import PropTypes from 'prop-types';

const SHOP_ICONS = ['🏪', '🛒', '💊', '🔨', '📚', '🥖', '🏥', '🎮', '👕', '🐱', '🌺', '🍷'];

export function EditShopForm({ shop, onSave, onCancel }) {
  const [formState, setFormState] = useState({ ...shop });

  useEffect(() => {
    setFormState({ ...shop });
  }, [shop]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formState.name.trim()) {
      onSave(formState);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={formState.name}
          onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
          className="flex-1 px-3 py-1.5 text-sm border rounded-lg"
          autoFocus
        />
        <div className="flex gap-1">
          <button
            type="submit"
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {SHOP_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => setFormState((prev) => ({ ...prev, icon }))}
            className={`p-3 rounded-lg hover:bg-red-100 transition-colors ${
              formState.icon === icon ? 'bg-red-200' : 'bg-red-50'
            }`}
          >
            <span className="text-2xl">{icon}</span>
          </button>
        ))}
      </div>
    </form>
  );
}

EditShopForm.propTypes = {
  shop: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
