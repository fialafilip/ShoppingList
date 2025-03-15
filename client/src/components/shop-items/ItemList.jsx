import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { ItemCard } from './ItemCard';
import { EditItemForm } from './EditItemForm';

export function ItemList({
  items,
  editingItem,
  onEditSubmit,
  onEditCancel,
  onToggleComplete,
  onEdit,
  onDelete,
  onDragEnd,
  sortBy,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="items">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
            <AnimatePresence>
              {items.map((item, index) => (
                <Draggable
                  key={item._id}
                  draggableId={item._id}
                  index={index}
                  isDragDisabled={sortBy !== 'custom'}
                >
                  {(provided, snapshot) =>
                    editingItem?._id === item._id ? (
                      <EditItemForm
                        item={editingItem}
                        onSave={onEditSubmit}
                        onCancel={onEditCancel}
                      />
                    ) : (
                      <ItemCard
                        item={item}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleComplete={onToggleComplete}
                        isDraggable={sortBy === 'custom'}
                        provided={provided}
                        snapshot={snapshot}
                      />
                    )
                  }
                </Draggable>
              ))}
              {provided.placeholder}
            </AnimatePresence>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

ItemList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unit: PropTypes.string.isRequired,
      completed: PropTypes.bool.isRequired,
    })
  ).isRequired,
  editingItem: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired,
  }),
  onEditSubmit: PropTypes.func.isRequired,
  onEditCancel: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  sortBy: PropTypes.oneOf(['custom', 'name', 'date', 'completed']).isRequired,
};
