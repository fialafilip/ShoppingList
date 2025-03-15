import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

export function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
      <div className="text-gray-400 mb-3">
        <ShoppingBag size={48} className="mx-auto" />
      </div>
      <p className="text-gray-500">Zatím nemáte žádné položky</p>
    </motion.div>
  );
}
