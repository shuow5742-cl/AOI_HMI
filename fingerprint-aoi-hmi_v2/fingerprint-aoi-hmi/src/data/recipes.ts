import { RecipeForm, RecipeKey } from "../types";

export const recipeDataMap: Record<RecipeKey, RecipeForm> = {
  Recipe_A: {
    row_count: "6",
    col_count: "8",
    dz_check: "1.2",
    flag_ramp: "0",
  },
  Recipe_B: {
    row_count: "5",
    col_count: "10",
    dz_check: "0.8",
    flag_ramp: "1",
  },
  Recipe_C: {
    row_count: "7",
    col_count: "7",
    dz_check: "1.5",
    flag_ramp: "0",
  },
};