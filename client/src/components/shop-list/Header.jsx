import { Users, LogOut } from 'lucide-react';
import PropTypes from 'prop-types';

export function Header({ onFamilyClick, onLogout }) {
  return (
    <header className="mb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Nákupní seznamy</h1>
        <div className="flex gap-3">
          <button
            onClick={onFamilyClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 text-sm"
          >
            <Users size={16} />
            <span>Rodina</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm"
          >
            <LogOut size={16} />
            <span>Odhlásit</span>
          </button>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  onFamilyClick: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};
