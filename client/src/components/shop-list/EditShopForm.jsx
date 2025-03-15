import { Check, X } from 'lucide-react';
import PropTypes from 'prop-types';

const SHOP_ICONS = ['🏪', '🛒', '💊', '🔨', '📚', '🥖', '🏥', '🎮', '👕', '🐱', '🌺', '🍷'];

export function EditShopForm({ shop, onSave, onCancel }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (shop.name.trim()) {
      onSave(shop);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={shop.name}
          onChange={(e) => onSave({ ...shop, name: e.target.value })}
          className="flex-1 p-2 border rounded-lg"
          autoFocus
        />
        <div className="flex gap-1">
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
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {SHOP_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onSave({ ...shop, icon })}
            className={`p-3 rounded-lg hover:bg-blue-100 transition-colors ${
              shop.icon === icon ? 'bg-blue-200' : 'bg-blue-50'
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
