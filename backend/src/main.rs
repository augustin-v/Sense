use alith::{Agent, LLM};
use backend::backend::api::Backend;

#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    let _backend = Backend::new();
    let model = LLM::from_model_name("gpt-4o-mini")?;
    let agent = Agent::new("BG", model).preamble("You are a beau gosse just like me");

    let response = agent.prompt("Am i a beaugosse?").await?;

    println!("{}", response);

    Ok(())
}
