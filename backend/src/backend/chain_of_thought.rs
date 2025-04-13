use alith::{Agent, Completion};
use anyhow::Ok;
use std::collections::VecDeque;

pub struct ChainOfThought<M: Completion> {
    agent: Agent<M>,
    reasoning_steps: VecDeque<ReasoningStep>,
    current_step: usize,
}

#[derive(Debug, Clone, Default)]
pub struct ReasoningStep {
    step_id: usize,
    desc: String,
    reasoning: String,
    conclusion: Option<String>,
    tx_hash: Option<String>,
}

impl ReasoningStep {
    pub fn new(step_id: usize, desc: String) -> Self {
        Self {
            step_id,
            desc,
            reasoning: String::new(),
            conclusion: None,
            tx_hash: None,
        }
    }
}

impl<M: Completion> ChainOfThought<M> {
    fn new(agent: Agent<M>) -> Self {
        Self {
            reasoning_steps: VecDeque::new(),
            agent,
            current_step: 0,
        }
    }

    fn add_step(&mut self, desc: String) -> usize {
        let step_id = self.current_step;
        self.reasoning_steps
            .push_back(ReasoningStep::new(step_id, desc));
        self.current_step += 1;
        step_id
    }

    pub async fn process_step(
        &mut self,
        step_id: usize,
        prompt: &str,
    ) -> Result<String, anyhow::Error> {
        let cot_prompt = format!(
            "Please think through this step-by-step:\n\nStep: {}\nInstructions: {}\n\nFirst, break down the problem. Then analyze each part thoroughly. Finally, proide a conclusion.",
            self.reasoning_steps
                .iter()
                .find(|s| s.step_id == step_id)
                .map(|s| &s.desc)
                .unwrap_or(&String::from("Unknown")),
            prompt
        );

        let response = self.agent.prompt(&cot_prompt).await?;

        if let Some(step) = self
            .reasoning_steps
            .iter_mut()
            .find(|s| s.step_id == step_id)
        {
            step.reasoning = response.clone();

            if let Some(conclusion_idx) = response.to_lowercase().find("conclusion: ") {
                let conclusion = response[conclusion_idx..].trim().to_string();
                step.conclusion = Some(conclusion);
            }
        }
        Ok(response)
    }

    pub async fn process_boolean_step(
        &mut self,
        step_id: usize,
        prompt: &str,
    ) -> Result<bool, anyhow::Error> {
        let boolean_prompt = format!(
            "Please reason step-by-step to determine if the following statement is TRUE or FALSE: \n\n{}\n\nAfter your reasoning, conclude with ONLY the word 'TRUE' or 'FALSE'.",
            prompt
        );

        let response = self.agent.prompt(&boolean_prompt).await?;

        let result = response.trim().to_uppercase().ends_with("TRUE");

        Ok(result)
    }
}
