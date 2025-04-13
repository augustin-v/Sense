use crate::backend::chain_of_thought::{ChainOfThought, ReasoningStep};
use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};
use alith::{Agent, LLM};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, atomic::AtomicBool};
use tokio::sync::mpsc;
use tokio::time::{Duration, sleep};
use uuid::Uuid;

// Request/Response Models
#[derive(Deserialize)]
pub struct NewDreamRequest {
    theme: String,
}

#[derive(Deserialize)]
pub struct CompleteDreamRequest {
    theme: String,
    reasoning_steps: Option<Vec<String>>,
    auto_mint: Option<bool>,
}

#[derive(Deserialize)]
pub struct StopDreamingRequest {
    id: String,
}

#[derive(Deserialize)]
pub struct StepRequest {
    description: String,
    prompt: String,
}

#[derive(Deserialize)]
pub struct BooleanStepRequest {
    description: String,
    prompt: String,
}

#[derive(Deserialize)]
pub struct ChoiceStepRequest {
    description: String,
    prompt: String,
    options: Vec<String>,
}

#[derive(Deserialize)]
pub struct NumericStepRequest {
    description: String,
    prompt: String,
    min: i32,
    max: i32,
}

#[derive(Serialize)]
pub struct DreamResponse {
    id: String,
    title: Option<String>,
    theme: Option<String>,
    steps: Vec<ReasoningStep>,
}

#[derive(Serialize)]
pub struct StepResponse {
    step_id: usize,
    description: String,
    reasoning: String,
    conclusion: Option<String>,
}

#[derive(Serialize)]
pub struct SvgResponse {
    svg: String,
}

#[derive(Serialize)]
pub struct NftResponse {
    ipfs_cid: String,
    transaction_hash: String,
}

#[derive(Debug)]
enum DreamMessage {
    StartContinuous { dream_id: String, theme: String },
    StopContinuous { dream_id: String },
}

pub struct Backend {
    is_active: Arc<AtomicBool>,
    dreams: Arc<Mutex<HashMap<String, Arc<Mutex<ChainOfThought<LLM>>>>>>,
    model_name: String,
    continuous_dreams: Arc<Mutex<HashMap<String, bool>>>,
    dream_tx: mpsc::Sender<DreamMessage>,
}

impl Backend {
    pub fn new() -> Result<Self, anyhow::Error> {
        // Create channel for dream messages
        let (dream_tx, dream_rx) = mpsc::channel::<DreamMessage>(100);

        let continuous_dreams = Arc::new(Mutex::new(HashMap::new()));
        let continuous_dreams_clone = continuous_dreams.clone();

        let backend = Backend {
            is_active: Arc::new(AtomicBool::new(true)),
            dreams: Arc::new(Mutex::new(HashMap::new())),
            model_name: "gpt-4o-mini".to_string(),
            continuous_dreams,
            dream_tx,
        };

        // Start the dream processor in background
        tokio::spawn(async move {
            Backend::dream_processor(dream_rx, continuous_dreams_clone).await;
        });

        Ok(backend)
    }

    async fn dream_processor(
        mut dream_rx: mpsc::Receiver<DreamMessage>,
        continuous_dreams: Arc<Mutex<HashMap<String, bool>>>,
    ) {
        while let Some(msg) = dream_rx.recv().await {
            match msg {
                DreamMessage::StartContinuous { dream_id, theme } => {
                    // Mark this dream as continuous
                    {
                        let mut dreams = continuous_dreams.lock().unwrap();
                        dreams.insert(dream_id.clone(), true);
                    }

                    // Clone for the task
                    let continuous_dreams_clone = continuous_dreams.clone();

                    // Process in a separate task
                    tokio::spawn(async move {
                        let mut current_dream_id = dream_id;

                        // Continue creating dreams until stopped
                        loop {
                            // Check if still active
                            {
                                let dreams = continuous_dreams_clone.lock().unwrap();
                                if !dreams.contains_key(&current_dream_id) {
                                    break;
                                }
                            }

                            // Wait between dreams
                            sleep(Duration::from_secs(30)).await;

                            // Create a new dream ID for next iteration
                            let next_dream_id = Uuid::new_v4().to_string();

                            // Update continuous dreams record
                            {
                                let mut dreams = continuous_dreams_clone.lock().unwrap();
                                dreams.remove(&current_dream_id);
                                dreams.insert(next_dream_id.clone(), true);
                            }

                            // Update for next iteration
                            current_dream_id = next_dream_id;
                        }
                    });
                }
                DreamMessage::StopContinuous { dream_id } => {
                    let mut dreams = continuous_dreams.lock().unwrap();
                    dreams.remove(&dream_id);
                }
            }
        }
    }

    pub async fn create_dream(&self, theme: &str) -> Result<String, anyhow::Error> {
        let dream_id = Uuid::new_v4().to_string();

        // Create a new LLM instance for this dream
        let model = LLM::from_model_name(&self.model_name)?;

        let agent = Agent::new("DreamWeaver", model)
            .preamble("You are an AI with exceptional chain of thought reasoning capabilities. You carefully analyze problems step by step and visualize your thinking process as abstract dream-like images.");

        let mut cot = ChainOfThought::new(agent);
        cot.set_dream_context(theme).await?;

        let cot_arc = Arc::new(Mutex::new(cot));

        let mut dreams = self.dreams.lock().unwrap();
        dreams.insert(dream_id.clone(), cot_arc);

        Ok(dream_id)
    }

    pub fn get_dream(&self, dream_id: &str) -> Option<Arc<Mutex<ChainOfThought<LLM>>>> {
        let dreams = self.dreams.lock().unwrap();
        dreams.get(dream_id).cloned()
    }

    pub async fn serve(self) -> std::io::Result<()> {
        let backend = Arc::new(self);

        HttpServer::new(move || {
            let backend = backend.clone();

            App::new()
                .wrap(
                    Cors::default()
                        .allow_any_origin()
                        .allow_any_method()
                        .allow_any_header(),
                )
                .app_data(web::Data::new(backend.clone()))
                // Dream management endpoints
                .route("/api/dreams", web::post().to(create_dream))
                .route("/api/dreams/{id}", web::get().to(get_dream))
                // Step management endpoints
                .route("/api/dreams/{id}/steps", web::post().to(add_step))
                .route(
                    "/api/dreams/{id}/steps/{step_id}/process",
                    web::post().to(process_step),
                )
                .route(
                    "/api/dreams/{id}/steps/{step_id}/boolean",
                    web::post().to(process_boolean_step),
                )
                .route(
                    "/api/dreams/{id}/steps/{step_id}/choice",
                    web::post().to(process_choice_step),
                )
                .route(
                    "/api/dreams/{id}/steps/{step_id}/numeric",
                    web::post().to(process_numeric_step),
                )
                // Blockchain anchoring
                .route(
                    "/api/dreams/{id}/steps/{step_id}/anchor",
                    web::post().to(anchor_step),
                )
                // SVG and NFT endpoints
                .route("/api/dreams/{id}/svg", web::get().to(get_svg))
                .route("/api/dreams/{id}/nft", web::post().to(mint_nft))
                // One-click and continuous dreaming endpoints
                .route(
                    "/api/dreams/create-complete",
                    web::post().to(create_complete_dream),
                )
                .route(
                    "/api/dreams/continuous/start",
                    web::post().to(start_continuous_dreaming),
                )
                .route(
                    "/api/dreams/continuous/stop",
                    web::get().to(stop_continuous_dreaming),
                )
        })
        .bind("127.0.0.1:8080")?
        .run()
        .await
    }
}

// Helper function to process all steps with appropriate reasoning
async fn process_all_steps(
    cot: &mut ChainOfThought<LLM>,
    step_ids: &[usize],
) -> Result<(), anyhow::Error> {
    // Process steps with different reasoning types
    if step_ids.len() > 0 {
        cot.process_step(
            step_ids[0],
            "What is the current state of Metis L2 technology in terms of scalability, security, and adoption?"
        ).await?;
    }

    if step_ids.len() > 1 {
        cot.process_boolean_step(
            step_ids[1],
            "Is AI enhancement essential for the future growth of Metis L2 solutions?",
        )
        .await?;
    }

    if step_ids.len() > 2 {
        cot.process_string_choice_step(
            step_ids[2],
            "Which area of integration offers the most immediate value for Metis L2?",
            &[
                "Transaction optimization",
                "Smart contract enhancement",
                "Oracle improvements",
                "User experience",
            ],
        )
        .await?;
    }

    if step_ids.len() > 3 {
        cot.process_numeric_step(
            step_ids[3],
            "In how many years will AI-enhanced blockchain solutions become mainstream on Metis?",
            1,
            10,
        )
        .await?;
    }

    Ok(())
}

// API Handler functions

async fn create_dream(
    backend: web::Data<Arc<Backend>>,
    req: web::Json<NewDreamRequest>,
) -> impl Responder {
    match backend.create_dream(&req.theme).await {
        Ok(dream_id) => HttpResponse::Created().json(serde_json::json!({ "id": dream_id })),
        Err(e) => {
            HttpResponse::InternalServerError().json(serde_json::json!({ "error": e.to_string() }))
        }
    }
}

async fn get_dream(backend: web::Data<Arc<Backend>>, path: web::Path<String>) -> impl Responder {
    let dream_id = path.into_inner();

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let cot = cot_arc.lock().unwrap();

        let response = DreamResponse {
            id: dream_id,
            title: cot.dream_title.clone(),
            theme: cot.dream_theme.clone(),
            steps: cot.get_steps(),
        };

        HttpResponse::Ok().json(response)
    } else {
        HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream not found" }))
    }
}

async fn add_step(
    backend: web::Data<Arc<Backend>>,
    path: web::Path<String>,
    req: web::Json<StepRequest>,
) -> impl Responder {
    let dream_id = path.into_inner();

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        let step_id = cot.add_step(req.description.clone());

        HttpResponse::Created().json(serde_json::json!({ "step_id": step_id }))
    } else {
        HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream not found" }))
    }
}

async fn process_step(
    backend: web::Data<Arc<Backend>>,
    path: web::Path<(String, usize)>,
    req: web::Json<StepRequest>,
) -> impl Responder {
    let (dream_id, step_id) = path.into_inner();

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        match cot.process_step(step_id, &req.prompt).await {
            Ok(reasoning) => {
                let steps = cot.get_steps();
                let step = steps.iter().find(|s| s.step_id == step_id);

                if let Some(step) = step {
                    let response = StepResponse {
                        step_id,
                        description: step.desc.clone(),
                        reasoning: step.reasoning.clone(),
                        conclusion: step.conclusion.clone(),
                    };

                    HttpResponse::Ok().json(response)
                } else {
                    HttpResponse::InternalServerError()
                        .json(serde_json::json!({ "error": "Step not found after processing" }))
                }
            }
            Err(e) => HttpResponse::InternalServerError()
                .json(serde_json::json!({ "error": e.to_string() })),
        }
    } else {
        HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream not found" }))
    }
}

async fn process_boolean_step(
    backend: web::Data<Arc<Backend>>,
    path: web::Path<(String, usize)>,
    req: web::Json<BooleanStepRequest>,
) -> impl Responder {
    let (dream_id, step_id) = path.into_inner();

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        match cot.process_boolean_step(step_id, &req.prompt).await {
            Ok(result) => HttpResponse::Ok().json(serde_json::json!({ "result": result })),
            Err(e) => HttpResponse::InternalServerError()
                .json(serde_json::json!({ "error": e.to_string() })),
        }
    } else {
        HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream not found" }))
    }
}

async fn process_choice_step(
    backend: web::Data<Arc<Backend>>,
    path: web::Path<(String, usize)>,
    req: web::Json<ChoiceStepRequest>,
) -> impl Responder {
    let (dream_id, step_id) = path.into_inner();

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        // Convert Vec<String> to Vec<&str> for the function call
        let options: Vec<&str> = req.options.iter().map(AsRef::as_ref).collect();

        match cot
            .process_string_choice_step(step_id, &req.prompt, &options)
            .await
        {
            Ok(result) => HttpResponse::Ok().json(serde_json::json!({ "result": result })),
            Err(e) => HttpResponse::InternalServerError()
                .json(serde_json::json!({ "error": e.to_string() })),
        }
    } else {
        HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream not found" }))
    }
}

async fn process_numeric_step(
    backend: web::Data<Arc<Backend>>,
    path: web::Path<(String, usize)>,
    req: web::Json<NumericStepRequest>,
) -> impl Responder {
    let (dream_id, step_id) = path.into_inner();

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        match cot
            .process_numeric_step(step_id, &req.prompt, req.min, req.max)
            .await
        {
            Ok(result) => HttpResponse::Ok().json(serde_json::json!({ "result": result })),
            Err(e) => HttpResponse::InternalServerError()
                .json(serde_json::json!({ "error": e.to_string() })),
        }
    } else {
        HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream not found" }))
    }
}

async fn anchor_step(
    backend: web::Data<Arc<Backend>>,
    path: web::Path<(String, usize)>,
) -> impl Responder {
    let (dream_id, step_id) = path.into_inner();

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        match cot.anchor_to_chain(step_id).await {
            Ok(tx_hash) => HttpResponse::Ok().json(serde_json::json!({ "tx_hash": tx_hash })),
            Err(e) => HttpResponse::InternalServerError()
                .json(serde_json::json!({ "error": e.to_string() })),
        }
    } else {
        HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream not found" }))
    }
}

async fn get_svg(backend: web::Data<Arc<Backend>>, path: web::Path<String>) -> impl Responder {
    let dream_id = path.into_inner();

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        match cot.generate_svg_dream().await {
            Ok(svg) => HttpResponse::Ok().content_type("image/svg+xml").body(svg),
            Err(e) => HttpResponse::InternalServerError()
                .json(serde_json::json!({ "error": e.to_string() })),
        }
    } else {
        HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream not found" }))
    }
}

async fn mint_nft(backend: web::Data<Arc<Backend>>, path: web::Path<String>) -> impl Responder {
    let dream_id = path.into_inner();

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        match cot.generate_dream_nft().await {
            Ok((ipfs_cid, tx_hash)) => HttpResponse::Ok().json(NftResponse {
                ipfs_cid,
                transaction_hash: tx_hash,
            }),
            Err(e) => HttpResponse::InternalServerError()
                .json(serde_json::json!({ "error": e.to_string() })),
        }
    } else {
        HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream not found" }))
    }
}

// New endpoints for user-friendly interaction

async fn create_complete_dream(
    backend: web::Data<Arc<Backend>>,
    req: web::Json<CompleteDreamRequest>,
) -> impl Responder {
    // 1. Create a new dream
    let dream_id = match backend.create_dream(&req.theme).await {
        Ok(id) => id,
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to create dream: {}", e)
            }));
        }
    };

    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        // 2. Define reasoning steps (default or custom)
        let reasoning_steps = req.reasoning_steps.clone().unwrap_or_else(|| {
            vec![
                "Current state analysis".to_string(),
                "Future possibilities".to_string(),
                "Integration potential".to_string(),
                "Vision synthesis".to_string(),
            ]
        });

        let mut step_ids = Vec::new();
        for step_desc in reasoning_steps {
            step_ids.push(cot.add_step(step_desc));
        }

        // 3. Process all steps with appropriate reasoning types
        if let Err(e) = process_all_steps(&mut cot, &step_ids).await {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Error processing steps: {}", e)
            }));
        }

        // 4. Anchor all steps to blockchain
        for step_id in &step_ids {
            let _ = cot.anchor_to_chain(*step_id).await; // Ignore errors for demo
        }

        // 5. Generate SVG visualization
        let svg = match cot.generate_svg_dream().await {
            Ok(svg) => svg,
            Err(e) => {
                return HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("Failed to generate SVG: {}", e)
                }));
            }
        };

        // 6. Mint NFT if requested (default to true)
        let nft_result = if req.auto_mint.unwrap_or(true) {
            match cot.generate_dream_nft().await {
                Ok((ipfs_cid, tx_hash)) => Some((ipfs_cid, tx_hash)),
                Err(_) => None,
            }
        } else {
            None
        };

        // 7. Return complete result
        return HttpResponse::Ok().json(serde_json::json!({
            "dream_id": dream_id,
            "title": cot.dream_title,
            "theme": cot.dream_theme,
            "steps": cot.get_steps(),
            "svg_url": format!("/api/dreams/{}/svg", dream_id),
            "nft": nft_result.map(|(cid, tx)| {
                serde_json::json!({
                    "ipfs_cid": cid,
                    "transaction_hash": tx
                })
            }),
        }));
    }

    HttpResponse::NotFound().json(serde_json::json!({ "error": "Dream processing failed" }))
}

async fn start_continuous_dreaming(
    backend: web::Data<Arc<Backend>>,
    req: web::Json<CompleteDreamRequest>,
) -> impl Responder {
    // Create initial dream
    let dream_id = match backend.create_dream(&req.theme).await {
        Ok(id) => id,
        Err(e) => {
            return HttpResponse::InternalServerError().json(serde_json::json!({
                "error": format!("Failed to create dream: {}", e)
            }));
        }
    };

    // Process the first dream completely
    if let Some(cot_arc) = backend.get_dream(&dream_id) {
        let mut cot = cot_arc.lock().unwrap();

        // Add default steps
        let mut step_ids = Vec::new();
        for step_desc in ["Analysis", "Possibilities", "Integration", "Vision"].iter() {
            step_ids.push(cot.add_step(step_desc.to_string()));
        }

        // Process all steps
        let _ = process_all_steps(&mut cot, &step_ids).await;

        // Anchor steps to blockchain
        for step_id in &step_ids {
            let _ = cot.anchor_to_chain(*step_id).await;
        }

        // Generate SVG and mint NFT
        if let Ok(svg) = cot.generate_svg_dream().await {
            let _ = cot.generate_dream_nft().await;
        }
    }

    // Send message to start continuous dreaming
    let theme = req.theme.clone();
    let dream_id_clone = dream_id.clone();

    if let Err(_) = backend
        .dream_tx
        .send(DreamMessage::StartContinuous {
            dream_id: dream_id_clone,
            theme,
        })
        .await
    {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "error": "Failed to start continuous dreaming"
        }));
    }

    HttpResponse::Ok().json(serde_json::json!({
        "status": "Continuous dreaming started",
        "initial_dream_id": dream_id,
        "control_url": format!("/api/dreams/continuous/stop?id={}", dream_id)
    }))
}

async fn stop_continuous_dreaming(
    backend: web::Data<Arc<Backend>>,
    query: web::Query<StopDreamingRequest>,
) -> impl Responder {
    if let Err(_) = backend
        .dream_tx
        .send(DreamMessage::StopContinuous {
            dream_id: query.id.clone(),
        })
        .await
    {
        return HttpResponse::InternalServerError().json(serde_json::json!({
            "error": "Failed to stop continuous dreaming"
        }));
    }

    HttpResponse::Ok().json(serde_json::json!({
        "status": "Continuous dreaming stopped",
        "dream_id": query.id
    }))
}
