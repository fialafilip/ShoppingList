import { Store } from 'lucide-react';
import PropTypes from 'prop-types';
import { AddShopForm } from './AddShopForm';
import { ShopCard } from './ShopCard';
import { EditShopForm } from './EditShopForm';

export function ShopSidebar({
  shops,
  selectedShop,
  editingShop,
  onShopSelect,
  onShopAdd,
  onShopEdit,
  onShopEditSubmit,
  onShopEditCancel,
  onShopDelete,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <AddShopForm onAdd={onShopAdd} />

      <div className="space-y-3">
        {shops?.map((shop) => (
          <div key={shop._id}>
            {editingShop?._id === shop._id ? (
              <EditShopForm
                shop={editingShop}
                onSave={onShopEditSubmit}
                onCancel={onShopEditCancel}
              />
            ) : (
              <ShopCard
                shop={shop}
                isSelected={selectedShop?._id === shop._id}
                onSelect={onShopSelect}
                onEdit={onShopEdit}
                onDelete={onShopDelete}
              />
            )}
          </div>
        ))}
        {shops?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Store className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Zatím nemáte žádné obchody</p>
          </div>
        )}
      </div>
    </div>
  );
}

ShopSidebar.propTypes = {
  shops: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
    })
  ),
  selectedShop: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }),
  editingShop: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  }),
  onShopSelect: PropTypes.func.isRequired,
  onShopAdd: PropTypes.func.isRequired,
  onShopEdit: PropTypes.func.isRequired,
  onShopEditSubmit: PropTypes.func.isRequired,
  onShopEditCancel: PropTypes.func.isRequired,
  onShopDelete: PropTypes.func.isRequired,
};
