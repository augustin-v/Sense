use std::sync::{Arc, atomic::AtomicBool};

pub struct Backend {
    is_active: Arc<AtomicBool>,
}

impl Backend {
    pub fn new() -> Self {
        Backend {
            is_active: Arc::new(AtomicBool::new(true)),
        }
    }
}
