import { Edit2, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

export function ItemCard({
  item,
  onEdit,
  onDelete,
  onToggleComplete,
  isDraggable,
  provided,
  snapshot,
}) {
  return (
    <motion.div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        bg-white rounded-xl border p-4 transition-shadow
        ${snapshot?.isDragging ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {isDraggable && <div className="text-gray-400 px-1">⋮⋮</div>}
        <input
          type="checkbox"
          checked={item.completed}
          onChange={() => onToggleComplete(item)}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span
          className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
        >
          {item.name}
        </span>
        <span className="text-gray-500">
          {item.quantity} {item.unit}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => {
              if (confirm('Opravdu chcete smazat tuto položku?')) {
                onDelete(item._id);
              }
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

ItemCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  isDraggable: PropTypes.bool.isRequired,
  provided: PropTypes.object,
  snapshot: PropTypes.object,
};
