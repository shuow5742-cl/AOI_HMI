import { RecipeForm } from "../types";

export function buildRecipeStartMessage(recipeName: string) {
  return JSON.stringify({
    cmd: "recipe_start",
    recipe_name: recipeName || "未选择",
  });
}

export function buildRecipeAckMessage() {
  return JSON.stringify({
    ack: "recipe_start",
    status: "ok",
  });
}

export function buildRecipeSummary(recipeForm: RecipeForm) {
  return {
    row_count: recipeForm.row_count,
    col_count: recipeForm.col_count,
    flag_ramp: recipeForm.flag_ramp,
  };
}