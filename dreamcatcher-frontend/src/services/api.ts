const API_BASE_URL = 'http://127.0.0.1:8080/api';

// Dream step types
export type StepType = 'open' | 'boolean' | 'choice' | 'numeric';

// Interface for dream data
export interface DreamStep {
  step_id: number;
  desc: string;
  reasoning: string;
  conclusion?: string;
  anchored?: boolean;
  tx_hash?: string;
}

export interface Dream {
  id: string;
  title?: string;
  theme?: string;
  steps: DreamStep[];
}

export interface CompleteCreateDreamResponse {
  dream_id: string;
  title: string;
  theme: string;
  steps: DreamStep[];
  svg_url: string;
  nft?: {
    ipfs_cid: string;
    transaction_hash: string;
  };
}

export interface ContinuousDreamResponse {
  status: string;
  initial_dream_id: string;
  control_url: string;
}

// API service for dream operations
export const dreamService = {
  // Create a new dream
  createDream: async (theme: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/dreams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create dream');
    }
    
    const data = await response.json();
    return data.id;
  },
  
  // Create a complete dream in one API call (recommended approach)
  createCompleteDream: async (theme: string, customSteps?: string[], autoMint: boolean = true): Promise<CompleteCreateDreamResponse> => {
    const response = await fetch(`${API_BASE_URL}/dreams/create-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        theme,
        reasoning_steps: customSteps,
        auto_mint: autoMint
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create complete dream');
    }
    
    return response.json();
  },
  
  // Start continuous dreaming
  startContinuousDreaming: async (theme: string, customSteps?: string[]): Promise<ContinuousDreamResponse> => {
    const response = await fetch(`${API_BASE_URL}/dreams/continuous/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        theme,
        reasoning_steps: customSteps
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to start continuous dreaming');
    }
    
    return response.json();
  },
  
  // Stop continuous dreaming
  stopContinuousDreaming: async (dreamId: string): Promise<{status: string, dream_id: string}> => {
    const response = await fetch(`${API_BASE_URL}/dreams/continuous/stop?id=${dreamId}`);
    
    if (!response.ok) {
      throw new Error('Failed to stop continuous dreaming');
    }
    
    return response.json();
  },
  
  // Get dream details
  getDream: async (id: string): Promise<Dream> => {
    const response = await fetch(`${API_BASE_URL}/dreams/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch dream');
    }
    
    return response.json();
  },
  
  // Add a reasoning step
  addStep: async (dreamId: string, description: string): Promise<number> => {
    const response = await fetch(`${API_BASE_URL}/dreams/${dreamId}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        description, 
        prompt: description 
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to add step');
    }
    
    const data = await response.json();
    return data.step_id;
  },
  
  // Process a step with open-ended reasoning
  processStep: async (dreamId: string, stepId: number, prompt: string): Promise<DreamStep> => {
    console.log(`[API] Processing step ${stepId} for dream ${dreamId}`);
    
    const response = await fetch(`${API_BASE_URL}/dreams/${dreamId}/steps/${stepId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        description: prompt,
        prompt: prompt 
      })
    });
    
    console.log(`[API] Step ${stepId} response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error processing step ${stepId}: ${errorText}`);
      throw new Error(`Failed to process step: ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log(`[API] Step ${stepId} processed successfully:`, responseData);
    
    return responseData;
  },

  
  // Process a step with boolean reasoning
  processBooleanStep: async (dreamId: string, stepId: number, prompt: string): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/dreams/${dreamId}/steps/${stepId}/boolean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        description: prompt,
        prompt: prompt 
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process boolean step: ${await response.text()}`);
    }
    
    const data = await response.json();
    return data.result;
  },
  
  // Process a step with multiple choice reasoning
  processChoiceStep: async (dreamId: string, stepId: number, prompt: string, options: string[]): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/dreams/${dreamId}/steps/${stepId}/choice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        description: prompt,
        prompt: prompt,
        options: options
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process choice step: ${await response.text()}`);
    }
    
    const data = await response.json();
    return data.result;
  },

  // Process a step with numeric reasoning
  processNumericStep: async (dreamId: string, stepId: number, prompt: string, min: number, max: number): Promise<number> => {
    const response = await fetch(`${API_BASE_URL}/dreams/${dreamId}/steps/${stepId}/numeric`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        description: prompt,
        prompt: prompt,
        min: min,
        max: max
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process numeric step: ${await response.text()}`);
    }
    
    const data = await response.json();
    return data.result;
  },
  
  // Anchor a step to the blockchain
  anchorStep: async (dreamId: string, stepId: number): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/dreams/${dreamId}/steps/${stepId}/anchor`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to anchor step');
    }
    
    const data = await response.json();
    return data.tx_hash;
  },
  
  // Get SVG visualization
  getDreamSvg: async (dreamId: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/dreams/${dreamId}/svg`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch SVG');
    }
    
    return response.text();
  },
  
  // Mint dream as NFT
  mintDreamNft: async (dreamId: string): Promise<{ipfs_cid: string, transaction_hash: string}> => {
    const response = await fetch(`${API_BASE_URL}/dreams/${dreamId}/nft`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to mint NFT');
    }
    
    return response.json();
  },
  
  // Helper function to properly process all steps for a dream in sequence
  processAllSteps: async (dreamId: string): Promise<Dream> => {
    try {
      // First, get the dream to see what steps already exist
      const dream = await dreamService.getDream(dreamId);
      
      // If no steps exist, create default ones
      if (!dream.steps || dream.steps.length === 0) {
        const step1Id = await dreamService.addStep(dreamId, "Analyze the current state");
        const step2Id = await dreamService.addStep(dreamId, "Explore future possibilities");
        const step3Id = await dreamService.addStep(dreamId, "Consider integration options");
        const step4Id = await dreamService.addStep(dreamId, "Evaluate timeline");
        
        // Process steps with different reasoning types
        await dreamService.processStep(dreamId, step1Id, "What is the current state of Metis L2 technology in terms of scalability, security, and adoption?");
        await dreamService.processBooleanStep(dreamId, step2Id, "Is AI enhancement essential for the future growth of Metis L2 solutions?");
        await dreamService.processChoiceStep(dreamId, step3Id, "Which area of integration offers the most immediate value for Metis L2?", ["Transaction optimization", "Smart contract enhancement", "Oracle improvements", "User experience"]);
        await dreamService.processNumericStep(dreamId, step4Id, "In how many years will AI-enhanced blockchain solutions become mainstream on Metis?", 1, 10);
        
        // Anchor all steps
        for (const stepId of [step1Id, step2Id, step3Id, step4Id]) {
          await dreamService.anchorStep(dreamId, stepId);
        }
      } else {
        // If steps exist but need processing (check for empty reasoning)
        for (const step of dream.steps) {
          if (!step.reasoning) {
            if (step.step_id === 0) {
              await dreamService.processStep(dreamId, step.step_id, "What is the current state of Metis L2 technology in terms of scalability, security, and adoption?");
            } else if (step.step_id === 1) {
              await dreamService.processBooleanStep(dreamId, step.step_id, "Is AI enhancement essential for the future growth of Metis L2 solutions?");
            } else if (step.step_id === 2) {
              await dreamService.processChoiceStep(dreamId, step.step_id, "Which area of integration offers the most immediate value for Metis L2?", ["Transaction optimization", "Smart contract enhancement", "Oracle improvements", "User experience"]);
            } else if (step.step_id === 3) {
              await dreamService.processNumericStep(dreamId, step.step_id, "In how many years will AI-enhanced blockchain solutions become mainstream on Metis?", 1, 10);
            }
            
            // Anchor the step
            await dreamService.anchorStep(dreamId, step.step_id);
          }
        }
      }
      
      // Return the updated dream
      return await dreamService.getDream(dreamId);
      
    } catch (error) {
      console.error("Error processing all steps:", error);
      throw error;
    }
  }
};
