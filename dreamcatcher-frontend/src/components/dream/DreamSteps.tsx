import React from 'react';
import { motion } from 'framer-motion';
import { DreamStep } from '../../services/api';

interface DreamStepsProps {
  steps: DreamStep[];
  isLoading: boolean;
}

const DreamSteps: React.FC<DreamStepsProps> = ({ steps, isLoading }) => {
  if (isLoading) {
    return <StepSkeleton />;
  }

  if (!steps || steps.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#D1D5DB',
        backgroundColor: 'rgba(15, 15, 15, 0.7)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        No steps available for this dream.
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'rgba(15, 15, 15, 0.7)',
      borderRadius: '0.5rem',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      overflow: 'hidden'
    }}>
      <ul>
        {steps.map((step, index) => (
          <StepItem 
            key={step.step_id} 
            step={step} 
            index={index} 
            isLast={index === steps.length - 1} 
          />
        ))}
      </ul>
    </div>
  );
};

interface StepItemProps {
  step: DreamStep;
  index: number;
  isLast: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ step, index, isLast }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{
        borderBottom: isLast ? 'none' : '1px solid rgba(75, 85, 99, 0.3)',
        padding: '1.25rem'
      }}
    >
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D8B4FE',
            fontWeight: 600
          }}>
            {index + 1}
          </div>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'white'
          }}>
            {step.desc}
          </h3>
        </div>
        
        {step.anchored && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '9999px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            color: '#D8B4FE',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '12rem',
            gap: '0.25rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 12h7a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7v10Z" />
              <path d="M13 12V2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h9Z" />
              <path d="M13 12v10h7a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-7Z" />
              <path d="M13 22V12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h9Z" />
            </svg>
            <span>Anchored on-chain</span>
          </div>
        )}
        
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            color: '#D1D5DB',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px dashed rgba(75, 85, 99, 0.3)'
          }}
        >
          <div style={{
            backgroundColor: 'rgba(30, 30, 30, 0.5)',
            borderRadius: '0.375rem',
            padding: '1rem',
            color: '#D1D5DB',
            whiteSpace: 'pre-wrap'
          }}>
            {step.reasoning}
          </div>
          
          {step.conclusion && (
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                marginRight: '0.5rem',
                color: '#10B981',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                Conclusion:
              </div>
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#D1FAE5',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
              }}>
                {step.conclusion}
              </div>
            </div>
          )}
          
          {step.tx_hash && (
            <div style={{
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: '#9CA3AF'
            }}>
              TX: {step.tx_hash.substring(0, 10)}...{step.tx_hash.substring(step.tx_hash.length - 10)}
            </div>
          )}
        </motion.div>
      )}
    </motion.li>
  );
};

const StepSkeleton: React.FC = () => {
  return (
    <div style={{
      backgroundColor: 'rgba(15, 15, 15, 0.7)',
      borderRadius: '0.5rem',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      overflow: 'hidden',
      padding: '1.25rem'
    }}>
      {[1, 2, 3, 4].map((index) => (
        <div 
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(75, 85, 99, 0.2)',
          }} />
          <div style={{
            width: '80%',
            height: '1.5rem',
            backgroundColor: 'rgba(75, 85, 99, 0.2)',
            borderRadius: '0.25rem'
          }} />
        </div>
      ))}
    </div>
  );
};

export default DreamSteps;
