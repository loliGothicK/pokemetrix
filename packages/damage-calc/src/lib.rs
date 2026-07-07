use wasm_bindgen::prelude::*;

mod types;
mod calc;

pub use calc::*;

/// WebAssembly entry point — re-exported for JS consumers.
#[wasm_bindgen(start)]
pub fn init() {
    // Optional: set panic hook for better error messages in debug builds.
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
