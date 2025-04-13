use alith::{Agent, Completion};
use anyhow::Ok;
use std::{collections::VecDeque, option};

pub struct ChainOfThought<M: Completion> {
    agent: Agent<M>,
    reasoning_steps: VecDeque<ReasoningStep>,
    current_step: usize,
    dream_title: Option<String>,
    dream_theme: Option<String>,
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
            dream_theme: None,
            dream_title: None,
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

        if let Some(step) = self.reasoning_steps.iter_mut().find(|s| s.step_id == step_id) {
            step.reasoning = response;
            step.conclusion = Some(if result { "TRUE" } else { "FALSE" }.to_string());
        }

        Ok(result)
    }

    pub async fn process_string_choice_step(
        &mut self,
        step_id: usize,
        prompt: &str,
        options: &[&str],
    ) -> Result<String, anyhow::Error> {
        let option_str = options.join(", ");

        let choice_prompt = format!(
            "Please reason step-by-step to select the BEST option from the following choices: {}\n\nQuestion: {}\n\nAfter your reasoning, conclude with ONLY one of the listed options.",
            option_str, prompt
        );
        let response = self.agent.prompt(&choice_prompt).await?;

        let selected_option = options
            .iter()
            .find(|&&opt| response.contains(opt))
            .map(|&opt| opt.to_string())
            .unwrap_or_else(|| "No clear selection".to_string());

        if let Some(step) = self.reasoning_steps.iter_mut().find(|s| s.step_id == step_id) {
            step.reasoning = response;
            step.conclusion = Some(selected_option.clone());

        }
        
        Ok(selected_option)
    }

    pub async fn process_numeric_step(&mut self, step_id: usize, prompt: &str, min: i32, max: i32) -> Result<i32, anyhow::Error> {
        let numeric_prompt = format!("Please reason step-by-step to determine a numeric value between {} and {} (inclusive):\n\n{}\n\nAfter your reasoning, conclude with ONLY the final number.", min, max, prompt);

        let response = self.agent.prompt(&numeric_prompt).await?;

        let number_str = response
            .lines()
            .last()
            .unwrap_or("")
            .trim()
            .chars()
            .filter(|c| c.is_digit(10) || *c == '-')
            .collect::<String>();

        let result = number_str.parse::<i32>().unwrap_or(0);
        let bounded_result = result.max(min).min(max);

        if let Some(step) = self.reasoning_steps.iter_mut().find(|s| s.step_id == step_id) {
            step.reasoning = response;
            step.conclusion = Some(bounded_result.to_string());
        }
        
        Ok(bounded_result)
    }

    pub async fn anchor_to_chain() {
        
    }
}
