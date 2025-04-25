// src/components/FamilyManager.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UserPlus, Plus, Settings, Edit2, Trash2, Check } from 'lucide-react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

function FamilyManager({ onClose }) {
  const [familyName, setFamilyName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [editingFamily, setEditingFamily] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:5000/auth/user', {
        withCredentials: true,
      });
      return data;
    },
  });

  const { data: families, isLoading } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:5000/api/family', {
        withCredentials: true,
      });
      return data;
    },
  });

  // Helper function to check if current user is admin of a family
  const isAdmin = (family) => {
    const currentUserMember = family.members.find((member) => member.userId._id === user?._id);
    return currentUserMember?.role === 'admin';
  };

  const createFamily = useMutation({
    mutationFn: async (name) => {
      // Create the family
      const { data } = await axios.post(
        'http://localhost:5000/api/family',
        { name },
        { withCredentials: true }
      );

      // If this is the first family (user has pendingSetup), set it as current and complete setup
      const user = queryClient.getQueryData(['user']);
      if (user?.pendingSetup) {
        // Set as current family
        await axios.post(
          `http://localhost:5000/api/family/${data._id}/switch`,
          {},
          { withCredentials: true }
        );

        // Complete the setup
        await axios.post(
          'http://localhost:5000/auth/complete-setup',
          {},
          { withCredentials: true }
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['families']);
      queryClient.invalidateQueries(['user']);
      setFamilyName('');
    },
  });

  const updateFamily = useMutation({
    mutationFn: async ({ familyId, name }) => {
      const url = `http://localhost:5000/api/family/${encodeURIComponent(familyId)}`;
      const { data } = await axios.patch(url, { name }, { withCredentials: true });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['families']);
      setEditingFamily(null);
    },
    onError: (error) => {
      console.error('Error updating family:', error.response?.status, error.response?.data);
      alert(
        'Nepodařilo se upravit rodinu. ' +
          (error.response?.data?.message || 'Zkuste to prosím později.')
      );
    },
  });

  const deleteFamily = useMutation({
    mutationFn: async (familyId) => {
      const url = `http://localhost:5000/api/family/${encodeURIComponent(familyId)}`;
      await axios.delete(url, { withCredentials: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['families']);
      setSelectedFamily(null);
    },
    onError: (error) => {
      console.error('Error deleting family:', error.response?.status, error.response?.data);
      alert(
        'Nepodařilo se smazat rodinu. ' +
          (error.response?.data?.message || 'Zkuste to prosím později.')
      );
    },
  });

  const addMember = useMutation({
    mutationFn: async ({ familyId, email, role }) => {
      const { data } = await axios.post(
        `http://localhost:5000/api/family/${familyId}/members`,
        { email, role },
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['families']);
      setNewMemberEmail('');
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ familyId, userId, role }) => {
      const { data } = await axios.patch(
        `http://localhost:5000/api/family/${familyId}/members/${userId}/role`,
        { role },
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['families']);
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ familyId, userId }) => {
      await axios.delete(`http://localhost:5000/api/family/${familyId}/members/${userId}`, {
        withCredentials: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['families']);
    },
  });

  const handleCreateFamily = (e) => {
    e.preventDefault();
    if (familyName.trim()) {
      createFamily.mutate(familyName, {
        onSuccess: () => {
          const user = queryClient.getQueryData(['user']);
          if (user?.pendingSetup) {
            onClose();
          }
        },
      });
    }
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (newMemberEmail.trim() && selectedFamily) {
      addMember.mutate({
        familyId: selectedFamily._id,
        email: newMemberEmail,
        role: 'member',
      });
    }
  };

  const handleUpdateFamily = (e) => {
    e.preventDefault();
    if (editingFamily && editingFamily.name.trim()) {
      updateFamily.mutate({
        familyId: editingFamily._id,
        name: editingFamily.name,
      });
    }
  };

  const handleDeleteFamily = (family) => {
    if (window.confirm(`Opravdu chcete smazat rodinu "${family.name}"? Tato akce je nevratná.`)) {
      deleteFamily.mutate(family._id);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg">Načítám...</div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-[95%] max-w-md bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden my-4 md:my-20"
        >
          <div className="flex items-center justify-between p-2.5 border-b sticky top-0 bg-white z-10">
            <h2 className="text-base font-semibold text-gray-800">Správa rodin</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          </div>
          <div className="p-3">
            {/* Vytvoření nové rodiny */}
            <form onSubmit={handleCreateFamily} className="mb-4">
              <h3 className="font-medium mb-2 text-xs uppercase tracking-wider text-gray-500">
                Vytvořit novou rodinu
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Název rodiny..."
                  className="flex-1 px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-3 py-1.5 rounded-lg hover:from-indigo-600 hover:to-violet-600 flex items-center gap-1.5 text-sm shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vytvořit</span>
                </motion.button>
              </div>
            </form>

            {/* Seznam rodin */}
            <div className="space-y-3">
              {families?.map((family) => (
                <div key={family._id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-3">
                    {editingFamily?._id === family._id ? (
                      <form onSubmit={handleUpdateFamily} className="flex-1 flex gap-1.5">
                        <input
                          type="text"
                          value={editingFamily.name}
                          onChange={(e) =>
                            setEditingFamily({ ...editingFamily, name: e.target.value })
                          }
                          className="flex-1 px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                          autoFocus
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="submit"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => setEditingFamily(null)}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </form>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <h3 className="font-medium">{family.name}</h3>
                        <div className="flex gap-1">
                          {isAdmin(family) && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setEditingFamily(family)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                title="Upravit rodinu"
                              >
                                <Edit2 className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteFamily(family)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Smazat rodinu"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              setSelectedFamily(selectedFamily?._id === family._id ? null : family)
                            }
                            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"
                            title="Nastavení členů"
                          >
                            <Settings className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedFamily?._id === family._id && (
                    <div className="space-y-3">
                      {/* Formulář pro přidání člena - pouze pro adminy */}
                      {isAdmin(family) && (
                        <form onSubmit={handleAddMember} className="flex gap-2">
                          <input
                            type="email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            placeholder="Email nového člena..."
                            className="flex-1 px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="submit"
                            className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                          >
                            <UserPlus className="w-4 h-4" />
                          </motion.button>
                        </form>
                      )}

                      {/* Seznam členů */}
                      <div className="space-y-2">
                        {family.members.map((member) => (
                          <div
                            key={member.userId._id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                          >
                            <div>
                              <div className="font-medium">{member.userId.name}</div>
                              <div className="text-xs text-gray-500">{member.userId.email}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAdmin(family) ? (
                                <>
                                  <select
                                    value={member.role}
                                    onChange={(e) =>
                                      updateMemberRole.mutate({
                                        familyId: family._id,
                                        userId: member.userId._id,
                                        role: e.target.value,
                                      })
                                    }
                                    className="px-2 py-1 text-sm border rounded-lg"
                                  >
                                    <option value="member">Člen</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  {member.role !== 'admin' && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() =>
                                        removeMember.mutate({
                                          familyId: family._id,
                                          userId: member.userId._id,
                                        })
                                      }
                                      className="p-1 text-red-500 hover:text-red-700 rounded-lg"
                                      title="Odebrat člena"
                                    >
                                      <X className="w-4 h-4" />
                                    </motion.button>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  {member.role === 'admin' ? 'Admin' : 'Člen'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

FamilyManager.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default FamilyManager;
