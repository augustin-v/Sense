use alith::{Agent, Completion};
use anyhow::{Error, Result};
use chrono::Utc;
use rand::Rng;
use serde::Serialize;
use std::{collections::VecDeque, fmt::Write};

pub struct ChainOfThought<M: Completion> {
    agent: Agent<M>,
    reasoning_steps: VecDeque<ReasoningStep>,
    current_step: usize,
    pub dream_title: Option<String>,
    pub dream_theme: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct ReasoningStep {
    pub step_id: usize,
    pub desc: String,
    pub reasoning: String,
    pub conclusion: Option<String>,
    pub tx_hash: Option<String>,
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
    pub fn new(agent: Agent<M>) -> Self {
        Self {
            reasoning_steps: VecDeque::new(),
            agent,
            current_step: 0,
            dream_title: None,
            dream_theme: None,
        }
    }

    pub fn add_step(&mut self, desc: String) -> usize {
        let step_id = self.current_step;
        self.reasoning_steps
            .push_back(ReasoningStep::new(step_id, desc));
        self.current_step += 1;
        step_id
    }

    pub async fn set_dream_context(&mut self, theme: &str) -> Result<(), Error> {
        // Generate a creative title for this dream based on the theme
        let title_prompt = format!(
            "Generate a poetic, creative title for an AI's dream visualization about: {}. Respond with ONLY the title, no explanation.",
            theme
        );

        let title = self.agent.prompt(&title_prompt).await?;
        self.dream_title = Some(title);
        self.dream_theme = Some(theme.to_string());

        Ok(())
    }

    pub async fn process_step(
        &mut self,
        step_id: usize,
        prompt: &str,
    ) -> Result<String, anyhow::Error> {
        let cot_prompt = format!(
            "Please think through this step-by-step:\n\nStep: {}\nInstructions: {}\n\nFirst, break down the problem. Then analyze each part thoroughly. Finally, provide a conclusion.",
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

            if let Some(conclusion_idx) = response.to_lowercase().find("conclusion:") {
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

        if let Some(step) = self
            .reasoning_steps
            .iter_mut()
            .find(|s| s.step_id == step_id)
        {
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

        if let Some(step) = self
            .reasoning_steps
            .iter_mut()
            .find(|s| s.step_id == step_id)
        {
            step.reasoning = response;
            step.conclusion = Some(selected_option.clone());
        }

        Ok(selected_option)
    }

    pub async fn process_numeric_step(
        &mut self,
        step_id: usize,
        prompt: &str,
        min: i32,
        max: i32,
    ) -> Result<i32, anyhow::Error> {
        let numeric_prompt = format!(
            "Please reason step-by-step to determine a numeric value between {} and {} (inclusive):\n\n{}\n\nAfter your reasoning, conclude with ONLY the final number.",
            min, max, prompt
        );

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

        if let Some(step) = self
            .reasoning_steps
            .iter_mut()
            .find(|s| s.step_id == step_id)
        {
            step.reasoning = response;
            step.conclusion = Some(bounded_result.to_string());
        }

        Ok(bounded_result)
    }

    pub async fn anchor_to_chain(&mut self, step_id: usize) -> Result<String, anyhow::Error> {
        // For now, simulate blockchain anchoring with a random hash
        // In a real implementation, this would use LazAI's data anchoring to Metis
        let tx_hash = format!("0x{:016x}", rand::random::<u64>());

        if let Some(step) = self
            .reasoning_steps
            .iter_mut()
            .find(|s| s.step_id == step_id)
        {
            step.tx_hash = Some(tx_hash.clone());
        }

        Ok(tx_hash)
    }

    pub fn get_steps(&self) -> Vec<ReasoningStep> {
        self.reasoning_steps.iter().cloned().collect()
    }

    // AI-generated SVG for a specific reasoning step
    pub async fn generate_svg_for_step(&self, step_id: usize) -> Result<String, anyhow::Error> {
        let step = self
            .reasoning_steps
            .iter()
            .find(|s| s.step_id == step_id)
            .ok_or_else(|| anyhow::anyhow!("Step not found"))?;

        // Create a prompt asking the AI to generate SVG for this reasoning step
        let svg_prompt = format!(
            "Based on the following reasoning step, create SVG code that visualizes this thinking process:\n\n\
            Topic: {}\n\
            Reasoning: {}\n\n\
            Generate valid SVG code that artistically represents this reasoning as a dream-like image. \
            Use colors, shapes, and patterns that reflect the thought process. \
            The SVG should be 300x300 pixels, creative, and abstract. \
            Respond ONLY with valid SVG code, starting with <svg and ending with </svg>.",
            step.desc, step.reasoning
        );

        // Get the AI to generate SVG
        let response = self.agent.prompt(&svg_prompt).await?;

        // Extract SVG code from response
        let svg_code = if let Some(start) = response.find("<svg") {
            if let Some(end) = response.rfind("</svg>") {
                response[start..=end + 5].to_string()
            } else {
                // If missing closing tag, attempt to fix
                format!("{}</svg>", &response[start..])
            }
        } else {
            // If AI didn't generate proper SVG, create a simple fallback
            format!(
                r##"<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#2a2a2a" />
                <text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle">Step {}: {}</text>
            </svg>"##,
                step.step_id + 1,
                step.desc
            )
        };

        Ok(svg_code)
    }

    // Generate the full dream SVG using AI-generated components
    pub async fn generate_svg_dream(&mut self) -> Result<String, anyhow::Error> {
        let mut svg = String::new();
        let width = 1000;
        let height = 1000;

        // SVG Header with a dark background
        writeln!(
            svg,
            r#"<svg width="{}" height="{}" xmlns="http://www.w3.org/2000/svg">"#,
            width, height
        )?;
        writeln!(
            svg,
            r##"<rect width="100%" height="100%" fill="#121212" />"##
        )?;

        // Title
        let title = self.dream_title.as_deref().unwrap_or("AI Dreamcatcher");
        writeln!(
            svg,
            r#"<text x="50%" y="50" font-family="Arial" font-size="24" fill="white" text-anchor="middle">{}</text>"#,
            title
        )?;

        // Generate AI-created SVG for each reasoning step and position them in a circle
        let center_x = width / 2;
        let center_y = height / 2;

        // Generate connections between steps
        if self.reasoning_steps.len() > 1 {
            for i in 0..self.reasoning_steps.len() - 1 {
                let angle1 =
                    2.0 * std::f64::consts::PI * (i as f64 / self.reasoning_steps.len() as f64);
                let angle2 = 2.0
                    * std::f64::consts::PI
                    * ((i + 1) as f64 / self.reasoning_steps.len() as f64);

                let radius = height as f64 * 0.35;

                let x1 = center_x as f64 + radius * angle1.cos();
                let y1 = center_y as f64 + radius * angle1.sin();
                let x2 = center_x as f64 + radius * angle2.cos();
                let y2 = center_y as f64 + radius * angle2.sin();

                // Draw line connecting thoughts
                writeln!(
                    svg,
                    r#"<line x1="{}" y1="{}" x2="{}" y2="{}" stroke="white" stroke-width="2" stroke-opacity="0.6" />"#,
                    x1, y1, x2, y2
                )?;
            }
        }

        // Add each AI-generated SVG for the steps
        for (i, step) in self.reasoning_steps.iter().enumerate() {
            // Generate SVG for this step
            let step_svg = self.generate_svg_for_step(step.step_id).await?;

            // Extract the inner content if possible (remove outer <svg> tags)
            let inner_content = if let Some(start_idx) = step_svg.find('>') {
                if let Some(end_idx) = step_svg.rfind("</svg>") {
                    &step_svg[start_idx + 1..end_idx]
                } else {
                    &step_svg
                }
            } else {
                &step_svg
            };

            // Position this SVG
            let angle = 2.0 * std::f64::consts::PI * (i as f64 / self.reasoning_steps.len() as f64);
            let radius = height as f64 * 0.35;

            let x = center_x as f64 + radius * angle.cos();
            let y = center_y as f64 + radius * angle.sin();

            // Add a group with the AI-generated SVG, properly positioned and scaled
            writeln!(
                svg,
                r#"<g transform="translate({}, {}) scale(0.5)">{}</g>"#,
                x - 150.0,
                y - 150.0,
                inner_content
            )?;

            // Add step number
            writeln!(
                svg,
                r#"<text x="{}" y="{}" font-family="Arial" font-size="12" fill="white" text-anchor="middle">{}</text>"#,
                x,
                y - 155.0,
                step.step_id + 1
            )?;
        }

        // Add a central node connecting all thoughts
        writeln!(
            svg,
            r#"<circle cx="{}" cy="{}" r="20" fill="white" fill-opacity="0.9" stroke="gold" stroke-width="2" />"#,
            center_x, center_y
        )?;

        // Add current timestamp as metadata
        let timestamp = Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
        writeln!(
            svg,
            r##"<text x="50%" y="{}" font-family="Arial" font-size="12" fill="#999999" text-anchor="middle">Generated: {}</text>"##,
            height - 20,
            timestamp
        )?;

        // Close SVG
        writeln!(svg, "</svg>")?;

        Ok(svg)
    }

    pub async fn generate_dream_nft(&mut self) -> Result<(String, String), anyhow::Error> {
        // 1. Generate SVG visualization using AI
        let svg = self.generate_svg_dream().await?;

        // 2. For demo purposes, simulate IPFS storage and NFT minting
        // In a real implementation, this would:
        // - Store SVG to IPFS through Metis
        // - Use returned CID to mint an NFT on Metis
        let mock_ipfs_cid = format!("Qm{}", hex::encode(rand::random::<[u8; 16]>()));
        let mock_nft_tx = format!("0x{}", hex::encode(rand::random::<[u8; 32]>()));

        println!(
            "Dream visualization stored on IPFS with CID: {}",
            mock_ipfs_cid
        );
        println!("NFT minted with transaction: {}", mock_nft_tx);

        // In a production implementation, here we would:
        // 1. Use the Metis-IPFS integration to store the SVG
        // 2. Call our NFT smart contract to mint with the IPFS CID

        Ok((mock_ipfs_cid, mock_nft_tx))
    }
}
