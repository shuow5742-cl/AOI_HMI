export type PageKey =
  | "main"
  | "recipe_db"
  | "recipe_edit"
  | "comm"
  | "runtime";

export type RecipeKey = "Recipe_A" | "Recipe_B" | "Recipe_C";

export type RecipeForm = {
  row_count: string;
  col_count: string;
  dz_check: string;
  flag_ramp: string;
};

export type RuntimeInfo = {
  currentRecipe: string;
  sendStatus: string;
  robotStatus: string;
  lastRobotMessage: string;
  currentAlarm: string;
  lastAction: string;
};

export type CommInfo = {
  connectionStatus: string;
  lastSentMessage: string;
  lastReceivedMessage: string;
};

export type RecipeDbRow = {
  model: string;
  flag_ramp: string;
  row_n: string;
  col_n: string;
  dz_check: string;
  plane_p1: string;
  plane_p2: string;
  plane_p3: string;
  ng_p1: string;
  ng_p2: string;
  ng_p3: string;
  ok_p1: string;
  ok_p2: string;
  ok_p3: string;
  ramp_p1: string;
  ramp_p2: string;
  ramp_p3: string;
};