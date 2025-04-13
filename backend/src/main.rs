use backend::backend::api::Backend;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("🚀 Starting AI Dreamcatcher API Server");

    // Initialize the backend
    let backend = match Backend::new() {
        Ok(backend) => {
            println!("✅ Backend initialized successfully");
            backend
        }
        Err(e) => {
            eprintln!("❌ Failed to initialize backend: {}", e);
            return Ok(());
        }
    };

    println!("🌐 API server starting on http://127.0.0.1:8080");
    println!("📝 Available endpoints:");
    println!("   POST /api/dreams - Create a new dream");
    println!("   GET /api/dreams/{{id}} - Get dream details");
    println!("   POST /api/dreams/{{id}}/steps - Add a reasoning step");
    println!("   POST /api/dreams/{{id}}/steps/{{step_id}}/process - Process open-ended reasoning");
    println!("   POST /api/dreams/{{id}}/steps/{{step_id}}/boolean - Process boolean reasoning");
    println!(
        "   POST /api/dreams/{{id}}/steps/{{step_id}}/choice - Process multiple choice reasoning"
    );
    println!("   POST /api/dreams/{{id}}/steps/{{step_id}}/numeric - Process numeric reasoning");
    println!(
        "   POST /api/dreams/{{id}}/steps/{{step_id}}/anchor - Anchor reasoning to blockchain"
    );
    println!("   GET /api/dreams/{{id}}/svg - Get SVG visualization");
    println!("   POST /api/dreams/{{id}}/nft - Mint dream as NFT");

    // Start the server
    backend.serve().await
}
