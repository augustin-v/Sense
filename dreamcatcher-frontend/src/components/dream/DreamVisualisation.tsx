import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface DreamVisualizationProps {
  svg: string | null;
  isLoading: boolean;
}

const DreamVisualization: React.FC<DreamVisualizationProps> = ({ svg, isLoading }) => {
  // Add logging to check SVG content
  useEffect(() => {
    console.log("DreamVisualization received SVG:", {
      svgReceived: !!svg,
      svgLength: svg?.length || 0,
      svgPreview: svg?.substring(0, 100) + "..." || "No SVG content"
    });
    
    if (svg && !svg.trim().toLowerCase().startsWith("<svg")) {
      console.warn("SVG content doesn't start with <svg> tag:", svg.substring(0, 100));
    }
  }, [svg]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        width: '100%',
        backgroundColor: 'rgba(15, 15, 15, 0.7)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              border: '4px solid rgba(139, 92, 246, 0.1)',
              borderTop: '4px solid rgba(139, 92, 246, 0.8)'
            }}
          />
          <p style={{ color: '#D1D5DB' }}>Generating dream visualization...</p>
        </div>
      </div>
    );
  }

  if (!svg) {
    console.warn("No SVG content provided to DreamVisualization");
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        width: '100%',
        backgroundColor: 'rgba(15, 15, 15, 0.7)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <p style={{ color: '#D1D5DB' }}>No dream visualization available</p>
      </div>
    );
  }

  // If we have SVG content, render it using dangerouslySetInnerHTML
  try {
    return (
      <div style={{
        width: '100%',
        backgroundColor: 'rgba(15, 15, 15, 0.7)',
        borderRadius: '0.5rem',
        padding: '1rem',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div
          style={{ 
            width: '100%', 
            maxHeight: '70vh', 
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    );
  } catch (error) {
    console.error("Error rendering SVG:", error);
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        width: '100%',
        backgroundColor: 'rgba(15, 15, 15, 0.7)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        padding: '1rem'
      }}>
        <p style={{ color: '#D1D5DB', marginBottom: '1rem' }}>Error displaying visualization</p>
        <details style={{ color: '#9CA3AF', fontSize: '0.875rem', maxWidth: '100%', overflow: 'auto' }}>
          <summary>View SVG Content</summary>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {svg}
          </pre>
        </details>
      </div>
    );
  }
};

export default DreamVisualization;
