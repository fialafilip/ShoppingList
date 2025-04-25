import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Check } from 'lucide-react';
import PropTypes from 'prop-types';
import axios from 'axios';

function FamilySwitcher({ currentFamilyId }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: families } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:5000/api/family', {
        withCredentials: true,
      });
      return data;
    },
  });

  const switchFamily = useMutation({
    mutationFn: async (familyId) => {
      await axios.post(
        `http://localhost:5000/api/family/${familyId}/switch`,
        {},
        { withCredentials: true }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      queryClient.invalidateQueries(['shops']);
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Error switching family:', error);
      alert(
        'Nepodařilo se přepnout rodinu. ' +
          (error.response?.data?.message || 'Zkuste to prosím později.')
      );
    },
  });

  // Get the current family ID, handling both string and object cases
  const currentFamilyIdString =
    typeof currentFamilyId === 'object' ? currentFamilyId?._id : currentFamilyId;
  const currentFamily = families?.find((f) => f._id === currentFamilyIdString);

  // Don't render anything if there are no families
  if (!families?.length) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
      >
        <span className="font-medium">{currentFamily?.name || 'Vybrat rodinu'}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1">
          {families?.map((family) => (
            <button
              key={family._id}
              onClick={() => switchFamily.mutate(family._id)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
            >
              <span>{family.name}</span>
              {family._id === currentFamilyIdString && <Check className="w-4 h-4 text-green-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

FamilySwitcher.propTypes = {
  currentFamilyId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ]),
};

export default FamilySwitcher;
