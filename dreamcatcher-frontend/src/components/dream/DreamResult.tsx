import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dream } from '../../services/api';
import DreamSteps from './DreamSteps'; 
import DreamVisualization from './DreamVisualisation';

interface DreamResultProps {
  dream: Dream | null;
  svg: string | null;
  isLoading: boolean;
  onMintNft: () => Promise<void>;
  isContinuous: boolean;
  onStopContinuous: () => Promise<void>;
  nftResult: {ipfs_cid: string, transaction_hash: string} | null;
}

const DreamResult: React.FC<DreamResultProps> = ({ 
  dream, 
  svg, 
  isLoading, 
  onMintNft,
  isContinuous,
  onStopContinuous,
  nftResult
}) => {
  // Change the default tab to 'steps' to debug the issue
  const [activeTab, setActiveTab] = useState<'visualization' | 'steps'>('steps');
  const [isNftMinting, setIsNftMinting] = useState(false);

  // Add logging when props change
  useEffect(() => {
    console.log("DreamResult received props:", { 
      dreamReceived: !!dream,
      dreamId: dream?.id,
      stepsCount: dream?.steps?.length || 0,
      svgSize: svg?.length || 0,
      isLoading,
      isContinuous
    });
    
    // Log detailed information about steps
    if (dream?.steps) {
      console.log("Dream steps details:", dream.steps.map(step => ({
        id: step.step_id,
        desc: step.desc,
        hasReasoning: !!step.reasoning,
        reasoningStart: step.reasoning?.substring(0, 30) + "...",
        hasConclusion: !!step.conclusion,
        hasTxHash: !!step.tx_hash
      })));
    } else {
      console.warn("No steps found in dream object");
    }
  }, [dream, svg, isLoading]);

  // Log when tab changes
  useEffect(() => {
    console.log(`Active tab changed to: ${activeTab}`);
  }, [activeTab]);

  const handleMintNft = async () => {
    setIsNftMinting(true);
    try {
      await onMintNft();
    } finally {
      setIsNftMinting(false);
    }
  };

  if (!dream && !isLoading) {
    console.log("DreamResult rendering 'No dream data available' message");
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#D1D5DB',
        backgroundColor: 'rgba(15, 15, 15, 0.7)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        No dream data available. Start a new dream to visualize AI reasoning.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '100%',
        maxWidth: '64rem',
        margin: '0 auto',
        padding: '1.5rem'
      }}
    >
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            fontWeight: 700,
            background: 'linear-gradient(to right, #ffffff, #e9d5ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.75rem'
          }}
        >
          {dream?.title || 'AI Dream Visualization'}
        </motion.h2>
        
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            color: '#D1D5DB',
            maxWidth: '36rem',
            margin: '0 auto',
            fontSize: 'clamp(1rem, 1.5vw, 1.125rem)'
          }}
        >
          {dream?.theme || 'Exploring the intersection of AI and blockchain on Metis'}
        </motion.p>
        
        {isContinuous && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '9999px',
              color: '#D8B4FE',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
            onClick={onStopContinuous}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                backgroundColor: '#D8B4FE',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} />
              <span>Continuous Dreaming Active - Click to Stop</span>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => {
            console.log("Switching to visualization tab");
            setActiveTab('visualization');
          }}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: activeTab === 'visualization' ? '#D8B4FE' : '#9CA3AF',
            borderBottom: activeTab === 'visualization' ? '2px solid #8B5CF6' : 'none',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Visualization
        </button>
        <button
          onClick={() => {
            console.log("Switching to steps tab");
            setActiveTab('steps');
          }}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: activeTab === 'steps' ? '#D8B4FE' : '#9CA3AF',
            borderBottom: activeTab === 'steps' ? '2px solid #8B5CF6' : 'none',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Reasoning Steps
        </button>
      </div>
      
      {/* Tab Content */}
      <div style={{ marginBottom: '2rem' }}>
        {activeTab === 'visualization' ? (
          <React.Fragment>
            {console.log("Rendering visualization tab")}
            <DreamVisualization svg={svg} isLoading={isLoading} />
          </React.Fragment>
        ) : (
          <React.Fragment>
            {console.log("Rendering steps tab with:", {
              stepsProvided: !!(dream?.steps),
              stepsCount: dream?.steps?.length || 0
            })}
            <DreamSteps 
              steps={dream?.steps || []} 
              isLoading={isLoading} 
            />
          </React.Fragment>
        )}
      </div>
      
      {/* Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '2rem'
      }}>
        <button
          onClick={() => {
            console.log("Mint NFT button clicked");
            handleMintNft();
          }}
          disabled={isLoading || isNftMinting || !dream}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: isNftMinting ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 1)',
            color: 'white',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: isLoading || isNftMinting ? 'wait' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isNftMinting ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Minting NFT...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.888 13.5C21.164 18.311 17.013 22 12 22 6.477 22 2 17.523 2 12S6.477 2 12 2c4.1 0 7.625 2.468 9.168 6" />
                <path d="M17 8h4.4a.6.6 0 0 0 .6-.6V3" />
              </svg>
              Mint as NFT
            </>
          )}
        </button>
      </div>
      
      {/* NFT Result */}
      {nftResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'rgba(15, 15, 15, 0.7)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}
        >
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'white',
            marginBottom: '0.75rem'
          }}>
            NFT Created Successfully
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>IPFS CID:</div>
              <div style={{ color: '#D1D5DB', fontSize: '0.875rem' }}>{nftResult.ipfs_cid}</div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Transaction:</div>
              <div style={{ color: '#D1D5DB', fontSize: '0.875rem' }}>
                {nftResult.transaction_hash.substring(0, 10)}...{nftResult.transaction_hash.substring(nftResult.transaction_hash.length - 10)}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DreamResult;
