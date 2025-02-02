// src/components/FamilyManager.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Mail, X, UserPlus, Plus, Settings } from 'lucide-react';
import axios from 'axios';

function FamilyManager({ onClose }) {
  const [familyName, setFamilyName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [selectedFamily, setSelectedFamily] = useState(null);
  const queryClient = useQueryClient();

  const { data: families, isLoading } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:5000/api/family', {
        withCredentials: true,
      });
      return data;
    },
  });

  const createFamily = useMutation({
    mutationFn: async (name) => {
      const { data } = await axios.post(
        'http://localhost:5000/api/family',
        { name },
        { withCredentials: true }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['families']);
      setFamilyName('');
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
      createFamily.mutate(familyName);
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg">Načítám...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Správa rodin
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Vytvoření nové rodiny */}
          <form onSubmit={handleCreateFamily} className="mb-6">
            <h3 className="font-medium mb-2">Vytvořit novou rodinu</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Název rodiny..."
                className="flex-1 p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Vytvořit
              </button>
            </div>
          </form>

          {/* Seznam rodin */}
          <div className="space-y-6">
            {families?.map((family) => (
              <div key={family._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-lg">{family.name}</h3>
                  <button
                    onClick={() =>
                      setSelectedFamily(selectedFamily?._id === family._id ? null : family)
                    }
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>

                {selectedFamily?._id === family._id && (
                  <div className="space-y-4">
                    {/* Formulář pro přidání člena */}
                    <form onSubmit={handleAddMember} className="flex gap-2">
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Email nového člena..."
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    </form>

                    {/* Seznam členů */}
                    <div className="space-y-2">
                      {family.members.map((member) => (
                        <div
                          key={member.userId._id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <div className="font-medium">{member.userId.name}</div>
                            <div className="text-sm text-gray-500">{member.userId.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                updateMemberRole.mutate({
                                  familyId: family._id,
                                  userId: member.userId._id,
                                  role: e.target.value,
                                })
                              }
                              className="p-1 border rounded"
                            >
                              <option value="member">Člen</option>
                              <option value="admin">Admin</option>
                            </select>
                            {member.role !== 'admin' && (
                              <button
                                onClick={() =>
                                  removeMember.mutate({
                                    familyId: family._id,
                                    userId: member.userId._id,
                                  })
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
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
      </div>
    </div>
  );
}

export default FamilyManager;
