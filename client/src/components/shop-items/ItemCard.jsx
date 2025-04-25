import { Edit2, Trash2, Lock, GripVertical } from 'lucide-react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

export const ItemCard = forwardRef(function ItemCard({
  item,
  onEdit,
  onDelete,
  onToggleComplete,
  isDraggable,
  provided,
  snapshot,
  currentUserId,
}) {
  // Convert IDs to strings for comparison and check lock status
  const isLockedByOther = item.lockedBy && item.lockedBy.toString() !== currentUserId.toString();
  const lockExpired = item.lockedAt && new Date() - new Date(item.lockedAt) > 5 * 60 * 1000;
  const isLocked = isLockedByOther && !lockExpired;

  return (
    <div
      className={`
        group bg-white rounded-xl border
        ${snapshot?.isDragging ? 'shadow-lg border-indigo-200 z-50' : 'shadow-sm hover:shadow-md border-gray-100'}
        ${isLocked ? 'bg-gray-50' : ''}
      `}
    >
      <div className="flex items-center gap-2 p-2">
        {isDraggable && (
          <div
            {...provided?.dragHandleProps}
            className="flex items-center justify-center shrink-0 w-6 text-gray-400 hover:text-indigo-500 cursor-grab active:cursor-grabbing"
            title="Přetáhněte pro změnu pořadí"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="shrink-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onToggleComplete(item)}
              className={`
                relative w-[18px] h-[18px] min-w-[18px] min-h-[18px] p-0 rounded-[4px] border transition-all duration-200 flex items-center justify-center
                ${
                  item.completed
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 border-transparent'
                    : 'border-gray-300 hover:border-indigo-500'
                }
                ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={isLocked}
            >
              {item.completed && (
                <motion.svg
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-[12px] h-[12px] text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              )}
            </motion.button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`
                  text-sm font-medium truncate transition-all duration-200
                  ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}
                `}
              >
                {item.name}
              </span>
              {isLocked && (
                <span className="text-xs text-orange-600 inline-flex items-center gap-1 bg-orange-50 px-1.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  <span className="truncate">{item.lockedByName || 'Someone'}</span>
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {item.quantity} {item.unit}
            </div>
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(item)}
            className={`
              p-1.5 rounded-md transition-colors
              ${
                isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'
              }
            `}
            disabled={isLocked}
            title={
              isLocked ? `Položku upravuje ${item.lockedByName || 'někdo'}` : 'Upravit položku'
            }
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(item._id)}
            className={`
              p-1.5 rounded-md transition-colors
              ${isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}
            `}
            disabled={isLocked}
            title={isLocked ? `Položku upravuje ${item.lockedByName || 'někdo'}` : 'Smazat položku'}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
});

ItemCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
    lockedBy: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    lockedAt: PropTypes.string,
    lockedByName: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  isDraggable: PropTypes.bool.isRequired,
  provided: PropTypes.object.isRequired,
  snapshot: PropTypes.object,
  currentUserId: PropTypes.string.isRequired,
};
