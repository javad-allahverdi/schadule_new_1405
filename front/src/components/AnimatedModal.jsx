// AnimatedModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function AnimatedModal({ isVisible, children, onClose }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal (کلیک روی پس‌زمینه هم موجب بسته شدن می‌شود) */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          >
            <div
              className="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="بستن"
                  className="absolute top-3 left-3 text-text_secondary_color hover:text-text_primary_color hover:bg-gray-100 rounded-full p-1 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
