use wasm_bindgen::prelude::*;

pub mod calc;
pub mod data;
pub mod resolve;
pub mod types;

pub use calc::*;

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn calculate_from_context(
    ctx: tsify::Ts<resolve::ResolveContext>,
) -> Result<tsify::Ts<types::DamageOutput>, wasm_bindgen::JsError> {
    let ctx = ctx.to_rust()?;
    let input = resolve::resolve_damage_input(&ctx)
        .ok_or_else(|| wasm_bindgen::JsError::new("Failed to resolve damage input"))?;

    let output = calculate_input(&input);

    Ok(tsify::Ts::from_rust(&output)?)
}
