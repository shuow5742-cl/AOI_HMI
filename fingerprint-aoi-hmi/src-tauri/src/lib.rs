// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet_from_rust(name: &str) -> String {
    format!("你好，{}。这条消息来自 Rust。", name)
}

#[derive(serde::Serialize, serde::Deserialize)]
struct RecipeForm {
    row_count: String,
    col_count: String,
    dz_check: String,
    flag_ramp: String,
}

#[tauri::command]
fn get_recipe(recipe_name: &str) -> RecipeForm {
    match recipe_name {
        "Recipe_A" => RecipeForm {
            row_count: "6".to_string(),
            col_count: "8".to_string(),
            dz_check: "1.2".to_string(),
            flag_ramp: "0".to_string(),
        },
        "Recipe_B" => RecipeForm {
            row_count: "5".to_string(),
            col_count: "10".to_string(),
            dz_check: "0.8".to_string(),
            flag_ramp: "1".to_string(),
        },
        "Recipe_C" => RecipeForm {
            row_count: "7".to_string(),
            col_count: "7".to_string(),
            dz_check: "1.5".to_string(),
            flag_ramp: "0".to_string(),
        },
        _ => RecipeForm {
            row_count: "".to_string(),
            col_count: "".to_string(),
            dz_check: "".to_string(),
            flag_ramp: "0".to_string(),
        },
    }
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet_from_rust, get_recipe])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
