use alith::{Agent, LLM};
use backend::backend::api::Backend;
use backend::backend::chain_of_thought::ChainOfThought;
use std::fs;
use std::sync::{Arc, Mutex};

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let model = LLM::from_model_name("gpt-4o-mini")?;
    let agent = Agent::new("DreamWeaver", model)
        .preamble("You are an AI with exceptional chain of thought reasoning capabilities. You carefully analyze problems step by step and visualize your thinking process as abstract dream-like images.");

    let cot = ChainOfThought::new(agent);

    let cot = Arc::new(Mutex::new(cot));

    let mut cot_guard = cot.lock().unwrap();

    cot_guard
        .set_dream_context("The synergy between AI and Metis L2 blockchain technology")
        .await?;

    let step1 = cot_guard.add_step("Blockchain fundamentals and current limitations".to_string());
    let step2 = cot_guard.add_step("AI capabilities and integration points".to_string());
    let step3 = cot_guard.add_step("Potential synergies and new capabilities".to_string());
    let step4 = cot_guard.add_step("Future vision of AI-enhanced blockchain".to_string());

    println!("📝 Processing reasoning step 1...");
    cot_guard.process_step(
        step1,
        "What are the fundamental properties of blockchain technology and what limitations currently exist that AI could help address?"
    ).await?;

    println!("📝 Processing reasoning step 2...");
    let improves_scalability = cot_guard.process_boolean_step(
        step2,
        "Can AI significantly improve blockchain scalability without compromising decentralization or security?"
    ).await?;

    println!(
        "AI believes it can improve scalability: {}",
        improves_scalability
    );

    println!("📝 Processing reasoning step 3...");
    let best_integration = cot_guard
        .process_string_choice_step(
            step3,
            "Which integration point offers the most immediate value for blockchain networks?",
            &[
                "Smart contract optimization",
                "Transaction routing",
                "Consensus mechanisms",
                "Oracle systems",
            ],
        )
        .await?;

    println!("Best integration point: {}", best_integration);

    println!("📝 Processing reasoning step 4...");
    let adoption_timeline = cot_guard.process_numeric_step(
        step4,
        "In how many years will AI-enhanced blockchain solutions become mainstream (3-15 years)?",
        3, 15
    ).await?;

    println!("Projected mainstream adoption: {} years", adoption_timeline);

    println!("\n🔗 Anchoring reasoning to blockchain...");
    for step_id in 0..cot_guard.get_steps().len() {
        let tx_hash = cot_guard.anchor_to_chain(step_id).await?;
        println!("Step {} anchored with tx: {}", step_id + 1, tx_hash);
    }

    println!("\n🎨 Generating dream visualization...");
    let svg = cot_guard.generate_svg_dream().await?;

    fs::write("ai_dream.svg", &svg)?;
    println!("Dream visualization saved to ai_dream.svg");

    println!("\n🖼️ Minting dream as NFT...");
    let (ipfs_cid, nft_tx) = cot_guard.generate_dream_nft().await?;
    println!("Dream NFT created!");
    println!("IPFS CID: {}", ipfs_cid);
    println!("NFT Transaction: {}", nft_tx);

    println!("\n🧠 AI Dreamcatcher Reasoning Process:");
    for step in cot_guard.get_steps() {
        println!("Step {}: {}", step.step_id + 1, step.desc);
        println!(
            "Reasoning excerpt: {}",
            if step.reasoning.len() > 100 {
                format!("{}...", &step.reasoning[0..100])
            } else {
                step.reasoning.clone()
            }
        );
        if let Some(conclusion) = &step.conclusion {
            println!("Conclusion: {}", conclusion);
        }
        if let Some(tx) = &step.tx_hash {
            println!("Blockchain record: {}", tx);
        }
        println!("---");
    }

    Ok(())
}
