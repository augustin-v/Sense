import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDreaming: (theme: string) => Promise<void>;
  onContinuousDreaming: (theme: string) => Promise<void>;
  mode: 'single' | 'continuous';
}

const DreamModal: React.FC<DreamModalProps> = ({ 
  isOpen, 
  onClose, 
  onStartDreaming, 
  onContinuousDreaming,
  mode 
}) => {
  const [theme, setTheme] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;
    
    setIsLoading(true);
    try {
      if (mode === 'single') {
        await onStartDreaming(theme);
      } else {
        await onContinuousDreaming(theme);
      }
      onClose();
    } catch (error) {
      console.error('Failed to start dreaming', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            style={{
              width: '100%',
              maxWidth: '32rem',
              backgroundColor: '#0f0f0f',
              borderRadius: '0.75rem',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              backdropFilter: 'blur(16px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '1.5rem',
              textAlign: 'center',
              background: 'linear-gradient(to right, #ffffff, #e9d5ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {mode === 'single' ? 'Start Dreaming' : 'Begin Continuous Dreams'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label 
                  htmlFor="theme" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.875rem',
                    color: '#D1D5DB'
                  }}
                >
                  Dream Theme
                </label>
                <input
                  id="theme"
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., The future of AI and blockchain on Metis"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #4B5563',
                    backgroundColor: 'rgba(30, 30, 30, 0.8)',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '2rem'
              }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #4B5563',
                    backgroundColor: 'transparent',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    background: 'linear-gradient(to right, #8B5CF6, #6366F1)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: isLoading ? 'wait' : 'pointer',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? (
                    'Dreaming...'
                  ) : mode === 'single' ? (
                    'Start Dreaming'
                  ) : (
                    'Begin Continuous Dreams'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DreamModal;
