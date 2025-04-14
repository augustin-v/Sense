import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DreamyBackground from './components/background/DreamyBackground';
import Header from './components/layout/Header';
import DreamModal from './components/dream/DreamModal';
import DreamResult from './components/dream/DreamResult';
import { DreamProvider, useDream } from './context/DreamContext';
import './index.css';

// Main App Component
function App() {
  return (
    <DreamProvider>
      <AppContent />
    </DreamProvider>
  );
}

// Connected Component with Dream Context
function AppContent() {
  const {
    currentDream,
    isLoading,
    error,
    svg,
    isContinuous,
    createNewDream,
    startContinuousDreaming,
    stopContinuousDreaming,
    mintNft
  } = useDream();
  
  const [isDreamModalOpen, setIsDreamModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'single' | 'continuous'>('single');
  const [nftData, setNftData] = useState<{ipfs_cid: string, transaction_hash: string} | null>(null);
  
  const handleOpenSingleDreamModal = () => {
    setModalMode('single');
    setIsDreamModalOpen(true);
  };
  
  const handleOpenContinuousDreamModal = () => {
    setModalMode('continuous');
    setIsDreamModalOpen(true);
  };
  
  const handleMintNft = async () => {
    if (!currentDream) return;
    try {
      const result = await mintNft();
      if (result) {
        setNftData(result);
      }
    } catch (error) {
      console.error("Failed to mint NFT:", error);
    }
  };
  
  return (
    <div className="App">
      <DreamyBackground />
      <Header />
      
      {/* Only show hero section if no dream is being displayed */}
      {!currentDream && !isLoading && (
        <HeroSection 
          onStartDreaming={handleOpenSingleDreamModal}
          onContinuousDreaming={handleOpenContinuousDreamModal}
        />
      )}
      
      {/* Show dream result if there is a dream or loading */}
      {(currentDream || isLoading) && (
        <DreamResult 
          dream={currentDream}
          svg={svg}
          isLoading={isLoading}
          onMintNft={handleMintNft}
          isContinuous={isContinuous}
          onStopContinuous={stopContinuousDreaming}
          nftResult={nftData}
        />
      )}
      
      {/* Error display */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          maxWidth: '90%',
          zIndex: 50
        }}>
          {error}
        </div>
      )}
      
      {/* Dream modal */}
      <DreamModal 
        isOpen={isDreamModalOpen}
        onClose={() => setIsDreamModalOpen(false)}
        onStartDreaming={createNewDream}
        onContinuousDreaming={startContinuousDreaming}
        mode={modalMode}
      />
    </div>
  );
}

// Complete HeroSection component
function HeroSection({ 
  onStartDreaming, 
  onContinuousDreaming 
}: { 
  onStartDreaming: () => void; 
  onContinuousDreaming: () => void;
}) {
  return (
    <div style={{ 
      position: 'relative', 
      minHeight: 'calc(100vh - 5rem)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      textAlign: 'center',
      padding: '3rem 1.5rem',
      overflow: 'hidden'
    }}>
      {/* Floating elements */}
      <motion.div
        style={{
          position: 'absolute',
          width: '16rem',
          height: '16rem',
          borderRadius: '50%',
          background: 'rgba(109, 40, 217, 0.1)',
          filter: 'blur(3rem)',
          top: '20%',
          left: '30%'
        }}
        animate={{
          x: ["-50%", "50%"],
          y: ["-10%", "10%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        style={{
          position: 'absolute',
          width: '24rem',
          height: '24rem',
          borderRadius: '50%',
          background: 'rgba(30, 64, 175, 0.1)',
          filter: 'blur(3rem)',
          bottom: '10%',
          right: '20%'
        }}
        animate={{
          x: ["30%", "-30%"],
          y: ["5%", "-5%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
      
      {/* Content */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '56rem',
          margin: '0 auto'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.h1 
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 5rem)',
            fontWeight: 800,
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #ffffff, #e9d5ff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Visualize AI Chain of Thought as Dreams
        </motion.h1>
        
        <motion.p 
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
            color: '#D1D5DB',
            marginBottom: '2.5rem',
            maxWidth: '48rem',
            margin: '0 auto 2.5rem'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Sense transforms complex reasoning into beautiful SVG visualizations, anchored on Metis blockchain as NFTs.
        </motion.p>
        
        <motion.div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
          className="button-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <motion.button 
            style={{
              background: 'linear-gradient(to right, #8B5CF6, #6366F1)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              minWidth: '12rem'
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartDreaming}
          >
            Start Dreaming
          </motion.button>
          
          <motion.button 
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid #8B5CF6',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              minWidth: '12rem'
            }}
            whileHover={{ 
              backgroundColor: 'rgba(139, 92, 246, 0.1)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onContinuousDreaming}
          >
            Continuous Dreams
          </motion.button>
        </motion.div>
      </motion.div>
      
      {/* Floating dream illustration */}
      <motion.div 
        style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
        animate={{ 
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
          <circle cx="60" cy="60" r="45" stroke="url(#paint0_linear)" strokeWidth="2" />
          <path d="M38 60C38 48.954 46.954 40 58 40H62C73.046 40 82 48.954 82 60V60C82 71.046 73.046 80 62 80H58C46.954 80 38 71.046 38 60V60Z" fill="url(#paint1_radial)" fillOpacity="0.3" />
          <circle cx="60" cy="60" r="20" stroke="url(#paint2_linear)" strokeWidth="2" />
          <defs>
            <linearGradient id="paint0_linear" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#6366F1" />
            </linearGradient>
            <radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(20)">
              <stop stopColor="white" />
              <stop offset="1" stopColor="#C4B5FD" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="paint2_linear" x1="40" y1="40" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D8B4FE" />
              <stop offset="1" stopColor="#818CF8" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
}

export default App;
