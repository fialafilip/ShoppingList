import { Edit2, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';

export function ShopCard({ shop, isSelected, onSelect, onEdit, onDelete }) {
  return (
    <div
      className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-300 shadow-md'
          : 'bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md'
      }`}
      onClick={() => onSelect(shop)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{shop.icon}</span>
          <span className="font-medium text-gray-800">{shop.name}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(shop);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Opravdu chcete smazat obchod "${shop.name}"?`)) {
                onDelete(shop._id);
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

ShopCard.propTypes = {
  shop: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
