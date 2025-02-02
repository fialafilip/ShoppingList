// src/components/Login.jsx
import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ShoppingBag } from 'lucide-react';

function Login({ onLogin }) {
  const testLogin = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('http://localhost:5000/auth/test-login', {}, {
        withCredentials: true
      });
      return data;
    },
    onSuccess: (user) => {
      onLogin(user);
    }
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:5000/auth/user', {
        withCredentials: true
      });
      return data;
    }
  });

  useEffect(() => {
    if (user) {
      onLogin(user);
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-4">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Nákupní Seznam</h1>
            <p className="text-gray-500">Přihlaste se a spravujte své nákupy</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => window.location.href = 'http://localhost:5000/auth/google'}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg p-3 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5"
              />
              <span>Přihlásit se přes Google</span>
            </button>

            {process.env.NODE_ENV === 'development' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">nebo</span>
                  </div>
                </div>

                <button
                  onClick={() => testLogin.mutate()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Testovací přihlášení
                </button>
              </>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Přihlášením souhlasíte s podmínkami použití</p>
          </div>
        </div>

        {/* Footer s informacemi */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Nákupní Seznam. Všechna práva vyhrazena.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;