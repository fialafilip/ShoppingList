import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PropTypes from 'prop-types';
import { ItemCard } from './ItemCard';
import { EditItemForm } from './EditItemForm';

function DraggableItem({
  item,
  index,
  editingItem,
  onEditSubmit,
  onEditCancel,
  onEdit,
  onDelete,
  onToggleComplete,
  sortBy,
  currentUserId,
}) {
  return (
    <Draggable
      draggableId={item._id}
      index={index}
      isDragDisabled={sortBy !== 'custom' || item.completed}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            position: 'relative',
            left: 'auto',
            top: 'auto',
            transform: provided.draggableProps.style?.transform,
          }}
        >
          {editingItem?._id === item._id ? (
            <EditItemForm
              item={editingItem}
              onSave={onEditSubmit}
              onCancel={onEditCancel}
              provided={provided}
            />
          ) : (
            <ItemCard
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
              isDraggable={sortBy === 'custom' && !item.completed}
              provided={provided}
              snapshot={snapshot}
              currentUserId={currentUserId}
            />
          )}
        </div>
      )}
    </Draggable>
  );
}

DraggableItem.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
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
  sortBy: PropTypes.oneOf(['custom', 'name', 'date', 'completed']).isRequired,
  currentUserId: PropTypes.string.isRequired,
};

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
  currentUserId,
}) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="items">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              space-y-3 min-h-[50px] rounded-xl
              ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}
            `}
          >
            {items.map((item, index) => (
              <DraggableItem
                key={item._id}
                item={item}
                index={index}
                editingItem={editingItem}
                onEditSubmit={onEditSubmit}
                onEditCancel={onEditCancel}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
                sortBy={sortBy}
                currentUserId={currentUserId}
              />
            ))}
            {provided.placeholder}
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
  currentUserId: PropTypes.string.isRequired,
};
