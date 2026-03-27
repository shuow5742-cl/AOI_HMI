import { invoke } from "@tauri-apps/api/core";
import { RecipeForm } from "../types";

export async function greetFromRust(name: string) {
  return await invoke<string>("greet_from_rust", { name });
}

export async function getRecipeFromRust(recipeName: string) {
  return await invoke<RecipeForm>("get_recipe", { recipeName });
}