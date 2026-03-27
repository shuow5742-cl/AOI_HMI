import { RecipeDbRow } from "../types";

const AXES = ["x", "y", "z", "rx", "ry", "rz"] as const;

function buildCommandMessage(cmd: string, recipeName?: string) {
  if (recipeName !== undefined) {
    return JSON.stringify({
      cmd,
      recipe_name: recipeName,
    });
  }

  return JSON.stringify({ cmd });
}

function buildKeyValueMessage(key: string, value: string) {
  return JSON.stringify({
    key,
    value,
  });
}

function parsePoseText(poseText: string): string[] {
  const raw = poseText
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const result = [...raw];
  while (result.length < 6) {
    result.push("");
  }

  return result.slice(0, 6);
}

function appendPoseMessages(queue: string[], pointName: string, poseText: string) {
  const poseValues = parsePoseText(poseText);

  AXES.forEach((axis, index) => {
    queue.push(buildKeyValueMessage(`${pointName}_${axis}`, poseValues[index] || ""));
  });
}

export function buildRecipeMessageQueue(recipe: RecipeDbRow): string[] {
  const queue: string[] = [];

  queue.push(buildCommandMessage("recipe_start", recipe.model || ""));

  queue.push(buildKeyValueMessage("flag_ramp", recipe.flag_ramp || "0"));
  queue.push(buildKeyValueMessage("row_n", recipe.row_n || ""));
  queue.push(buildKeyValueMessage("col_n", recipe.col_n || ""));
  queue.push(buildKeyValueMessage("dz_check", recipe.dz_check || ""));

  appendPoseMessages(queue, "plane_p1", recipe.plane_p1 || "");
  appendPoseMessages(queue, "plane_p2", recipe.plane_p2 || "");
  appendPoseMessages(queue, "plane_p3", recipe.plane_p3 || "");

  appendPoseMessages(queue, "ng_p1", recipe.ng_p1 || "");
  appendPoseMessages(queue, "ng_p2", recipe.ng_p2 || "");
  appendPoseMessages(queue, "ng_p3", recipe.ng_p3 || "");

  appendPoseMessages(queue, "ok_p1", recipe.ok_p1 || "");
  appendPoseMessages(queue, "ok_p2", recipe.ok_p2 || "");
  appendPoseMessages(queue, "ok_p3", recipe.ok_p3 || "");

  if (recipe.flag_ramp === "1") {
    appendPoseMessages(queue, "ramp_p1", recipe.ramp_p1 || "");
    appendPoseMessages(queue, "ramp_p2", recipe.ramp_p2 || "");
    appendPoseMessages(queue, "ramp_p3", recipe.ramp_p3 || "");
  }

  queue.push(buildCommandMessage("recipe_end"));

  return queue;
}

function isNonEmpty(value: string) {
  return value.trim().length > 0;
}

function isNumberLike(value: string) {
  return value.trim() !== "" && !Number.isNaN(Number(value));
}

function isPositiveIntegerLike(value: string) {
  if (!isNumberLike(value)) return false;
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

function validatePoseText(label: string, poseText: string): string[] {
  const errors: string[] = [];
  const parts = poseText.split(",").map((item) => item.trim());

  if (!isNonEmpty(poseText)) {
    errors.push(`${label} 不能为空`);
    return errors;
  }

  if (parts.length !== 6) {
    errors.push(`${label} 必须为 X,Y,Z,Rx,Ry,Rz 共 6 个值`);
    return errors;
  }

  const emptyIndex = parts.findIndex((item) => item === "");
  if (emptyIndex !== -1) {
    errors.push(`${label} 第 ${emptyIndex + 1} 个值为空`);
    return errors;
  }

  const invalidIndex = parts.findIndex((item) => Number.isNaN(Number(item)));
  if (invalidIndex !== -1) {
    errors.push(`${label} 第 ${invalidIndex + 1} 个值不是数字`);
  }

  return errors;
}

export function validateRecipeForSend(recipe: RecipeDbRow): string[] {
  const errors: string[] = [];

  if (!isNonEmpty(recipe.model)) {
    errors.push("型号不能为空");
  }

  if (!isNonEmpty(recipe.flag_ramp)) {
    errors.push("flag_ramp 不能为空");
  } else if (recipe.flag_ramp !== "0" && recipe.flag_ramp !== "1") {
    errors.push("flag_ramp 只能为 0 或 1");
  }

  if (!isPositiveIntegerLike(recipe.row_n)) {
    errors.push("row_n 必须为正整数");
  }

  if (!isPositiveIntegerLike(recipe.col_n)) {
    errors.push("col_n 必须为正整数");
  }

  if (!isNumberLike(recipe.dz_check)) {
    errors.push("dz_check 必须为数字");
  }

  errors.push(...validatePoseText("plane_p1", recipe.plane_p1));
  errors.push(...validatePoseText("plane_p2", recipe.plane_p2));
  errors.push(...validatePoseText("plane_p3", recipe.plane_p3));

  errors.push(...validatePoseText("ng_p1", recipe.ng_p1));
  errors.push(...validatePoseText("ng_p2", recipe.ng_p2));
  errors.push(...validatePoseText("ng_p3", recipe.ng_p3));

  errors.push(...validatePoseText("ok_p1", recipe.ok_p1));
  errors.push(...validatePoseText("ok_p2", recipe.ok_p2));
  errors.push(...validatePoseText("ok_p3", recipe.ok_p3));

  if (recipe.flag_ramp === "1") {
    errors.push(...validatePoseText("ramp_p1", recipe.ramp_p1));
    errors.push(...validatePoseText("ramp_p2", recipe.ramp_p2));
    errors.push(...validatePoseText("ramp_p3", recipe.ramp_p3));
  }

  return errors;
}