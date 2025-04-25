import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, switchLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => switchLanguage('cs')}
        className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
          language === 'cs' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        CZ
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => switchLanguage('en')}
        className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
          language === 'en' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </motion.button>
    </div>
  );
}
