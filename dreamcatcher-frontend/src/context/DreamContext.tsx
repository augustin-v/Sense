import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dream, dreamService } from '../services/api';

const API_BASE_URL = 'http://127.0.0.1:8080/api';

interface DreamContextType {
  currentDream: Dream | null;
  isLoading: boolean;
  error: string | null;
  svg: string | null;
  isContinuous: boolean;
  createNewDream: (theme: string) => Promise<void>;
  startContinuousDreaming: (theme: string) => Promise<void>;
  stopContinuousDreaming: () => Promise<void>;
  loadDreamById: (id: string) => Promise<void>;
  generateSvg: () => Promise<void>;
  mintNft: () => Promise<{ipfs_cid: string, transaction_hash: string} | null>;
}

const DreamContext = createContext<DreamContextType | undefined>(undefined);

export const DreamProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentDream, setCurrentDream] = useState<Dream | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [isContinuous, setIsContinuous] = useState<boolean>(false);
  const [continuousDreamInterval, setContinuousDreamInterval] = useState<number | null>(null);
  const [continuousDreamId, setContinuousDreamId] = useState<string | null>(null);

  // Clear any existing interval when component unmounts
  React.useEffect(() => {
    return () => {
      if (continuousDreamInterval) {
        clearInterval(continuousDreamInterval);
      }
    };
  }, [continuousDreamInterval]);

// Create a new dream with the given theme
const createNewDream = async (theme: string) => {
    try {
      console.log(`[DreamContext] Creating new dream with theme: "${theme}"`);
      setIsLoading(true);
      setError(null);
      
      // Log request details
      console.log(`[DreamContext] Sending request to ${API_BASE_URL}/dreams/create-complete`);
      
      const response = await fetch(`${API_BASE_URL}/dreams/create-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          theme,
          auto_mint: false
        })
      });
      
      console.log(`[DreamContext] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DreamContext] Error creating dream: ${errorText}`);
        throw new Error(`Failed to create dream: ${errorText}`);
      }
      
      const completeDreamData = await response.json();
      console.log("Full dream response:", JSON.stringify(completeDreamData, null, 2));
      console.log(`[DreamContext] Dream created successfully:`, {
        id: completeDreamData.dream_id,
        title: completeDreamData.title,
        stepsCount: completeDreamData.steps?.length || 0
      });
      
      // Update state with the complete response
      setCurrentDream({
        id: completeDreamData.dream_id,
        title: completeDreamData.title,
        theme: completeDreamData.theme,
        steps: completeDreamData.steps || []
      });
      
      // Fix: Properly resolve the SVG URL with the API base URL
      const svgUrl = completeDreamData.svg_url;
      console.log(`[DreamContext] Original SVG URL: ${svgUrl}`);
      
      // Extract the dream ID from the URL or use it directly
      const dreamId = completeDreamData.dream_id;
      
      // Construct a fully qualified URL by combining API_BASE_URL with the endpoint
      const resolvedSvgUrl = `${API_BASE_URL}/dreams/${dreamId}/svg`;
      console.log(`[DreamContext] Resolved SVG URL: ${resolvedSvgUrl}`);
      
      // Fetch SVG from the fully resolved URL
      console.log(`[DreamContext] Fetching SVG from: ${resolvedSvgUrl}`);
      const svgResponse = await fetch(resolvedSvgUrl);
      console.log(`[DreamContext] SVG response status: ${svgResponse.status}`);
      
      if (svgResponse.ok) {
        const svgData = await svgResponse.text();
        console.log(`[DreamContext] SVG fetched successfully (${svgData.length} bytes)`);
        
        // Add validation to check if content is actually SVG
        if (svgData.trim().startsWith('<svg') || svgData.includes('<svg')) {
          console.log(`[DreamContext] Valid SVG content confirmed`);
        } else {
          console.warn(`[DreamContext] Response doesn't look like SVG. First 100 chars: ${svgData.substring(0, 100)}`);
        }
        
        setSvg(svgData);
      } else {
        console.error(`[DreamContext] Failed to fetch SVG: ${svgResponse.status}`);
        const errorText = await svgResponse.text();
        console.error(`[DreamContext] SVG fetch error details: ${errorText.substring(0, 200)}`);
        // Don't throw error here, just log it to avoid breaking the dream creation flow
      }
      
    } catch (err) {
      console.error(`[DreamContext] Error in createNewDream:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      console.log(`[DreamContext] Dream creation process completed`);
      setIsLoading(false);
    }
  };
  
  // Start continuous dreaming
  const startContinuousDreaming = async (theme: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the backend's continuous dreaming endpoint
      const response = await fetch(`${API_BASE_URL}/dreams/continuous/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start continuous dreaming');
      }
      
      const data = await response.json();
      setIsContinuous(true);
      
      // Load the initial dream
      await loadDreamById(data.initial_dream_id);
      
      // Store the control URL or dream ID for stopping later
      setContinuousDreamId(data.initial_dream_id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsContinuous(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Stop continuous dreaming
  const stopContinuousDreaming = async () => {
    if (!continuousDreamId) return;
    
    try {
      setIsLoading(true);
      
      // Use the backend's stop continuous dreaming endpoint
      const response = await fetch(`${API_BASE_URL}/dreams/continuous/stop?id=${continuousDreamId}`);
      
      if (!response.ok) {
        throw new Error('Failed to stop continuous dreaming');
      }
      
      setIsContinuous(false);
      setContinuousDreamId(null);
      
      // You no longer need to clear intervals since the backend handles it
      if (continuousDreamInterval) {
        clearInterval(continuousDreamInterval);
        setContinuousDreamInterval(null);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  // Load dream by ID
  const loadDreamById = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const dreamData = await dreamService.getDream(id);
      setCurrentDream(dreamData);
      
      // Also load SVG
      const svgData = await dreamService.getDreamSvg(id);
      setSvg(svgData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate SVG for current dream
  const generateSvg = async () => {
    if (!currentDream) {
      console.warn(`[DreamContext] Cannot generate SVG: no current dream`);
      return;
    }
    
    try {
      console.log(`[DreamContext] Generating SVG for dream: ${currentDream.id}`);
      setIsLoading(true);
      setError(null);
      
      const svgData = await dreamService.getDreamSvg(currentDream.id);
      console.log(`[DreamContext] SVG fetched successfully (${svgData.length} bytes)`);
      
      // Check if SVG is valid
      if (svgData.startsWith('<svg') || svgData.includes('<svg')) {
        console.log(`[DreamContext] SVG appears to be valid XML`);
      } else {
        console.warn(`[DreamContext] SVG may not be valid XML:`, svgData.substring(0, 100) + '...');
      }
      
      setSvg(svgData);
    } catch (err) {
      console.error(`[DreamContext] Error in generateSvg:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      console.log(`[DreamContext] SVG generation process completed`);
      setIsLoading(false);
    }
  };
  

  // Mint NFT for current dream
  const mintNft = async () => {
    if (!currentDream) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const nftData = await dreamService.mintDreamNft(currentDream.id);
      return nftData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DreamContext.Provider
      value={{
        currentDream,
        isLoading,
        error,
        svg,
        isContinuous,
        createNewDream,
        startContinuousDreaming,
        stopContinuousDreaming,
        loadDreamById,
        generateSvg,
        mintNft
      }}
    >
      {children}
    </DreamContext.Provider>
  );
};

export const useDream = (): DreamContextType => {
  const context = useContext(DreamContext);
  if (context === undefined) {
    throw new Error('useDream must be used within a DreamProvider');
  }
  return context;
};
