import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Global Modal Component using Portals to bypass stacking context issues.
 * @param {boolean} isOpen - Controls if the modal is visible
 * @param {Function} onClose - Callback when clicking backdrop or closing
 * @param {React.ReactNode} children - Modal content
 * @param {string} maxWidth - Tailwind max-width class (default: max-w-md)
 * @param {boolean} blurBackdrop - Whether to use backdrop-blur (default: true)
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = 'max-w-md', 
  blurBackdrop = true,
  zIndex = 'z-[100]' 
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && [
        // Backdrop (Independent sibling to avoid Safari backdrop-filter parent bugs)
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`fixed inset-0 ${zIndex} bg-slate-950/80 ${blurBackdrop ? 'backdrop-blur-sm' : ''} pointer-events-auto`}
        />,
        // Modal Container Wrapper
        <motion.div
          key="modal-content"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`fixed inset-0 ${zIndex} pointer-events-none flex items-center justify-center p-4`}
        >
          <div
            className={`pointer-events-auto relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl w-[95%] md:w-full ${maxWidth} shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar`}
          >
            {children}
          </div>
        </motion.div>
      ]}
    </AnimatePresence>,
    modalRoot
  );
};

export default Modal;
