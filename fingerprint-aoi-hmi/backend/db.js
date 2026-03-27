const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "app.db");
const db = new Database(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL UNIQUE,
      flag_ramp TEXT DEFAULT '0',
      row_n TEXT DEFAULT '',
      col_n TEXT DEFAULT '',
      dz_check TEXT DEFAULT '',
      plane_p1 TEXT DEFAULT '',
      plane_p2 TEXT DEFAULT '',
      plane_p3 TEXT DEFAULT '',
      ng_p1 TEXT DEFAULT '',
      ng_p2 TEXT DEFAULT '',
      ng_p3 TEXT DEFAULT '',
      ok_p1 TEXT DEFAULT '',
      ok_p2 TEXT DEFAULT '',
      ok_p3 TEXT DEFAULT '',
      ramp_p1 TEXT DEFAULT '',
      ramp_p2 TEXT DEFAULT '',
      ramp_p3 TEXT DEFAULT '',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedIfEmpty() {
  const countRow = db.prepare("SELECT COUNT(*) AS count FROM recipes").get();
  if (countRow.count > 0) return;

  const insert = db.prepare(`
    INSERT INTO recipes (
      model, flag_ramp, row_n, col_n, dz_check,
      plane_p1, plane_p2, plane_p3,
      ng_p1, ng_p2, ng_p3,
      ok_p1, ok_p2, ok_p3,
      ramp_p1, ramp_p2, ramp_p3
    ) VALUES (
      @model, @flag_ramp, @row_n, @col_n, @dz_check,
      @plane_p1, @plane_p2, @plane_p3,
      @ng_p1, @ng_p2, @ng_p3,
      @ok_p1, @ok_p2, @ok_p3,
      @ramp_p1, @ramp_p2, @ramp_p3
    )
  `);

  insert.run({
    model: "503",
    flag_ramp: "1",
    row_n: "5",
    col_n: "12",
    dz_check: "0.8",
    plane_p1: "0,0,0,0,0,0",
    plane_p2: "0,0,0,0,0,0",
    plane_p3: "0,0,0,0,0,0",
    ng_p1: "0,0,0,0,0,0",
    ng_p2: "0,0,0,0,0,0",
    ng_p3: "0,0,0,0,0,0",
    ok_p1: "0,0,0,0,0,0",
    ok_p2: "0,0,0,0,0,0",
    ok_p3: "0,0,0,0,0,0",
    ramp_p1: "0,0,0,0,0,0",
    ramp_p2: "0,0,0,0,0,0",
    ramp_p3: "0,0,0,0,0,0",
  });
}

function getAllRecipes() {
  return db.prepare(`
    SELECT
      id, model, flag_ramp, row_n, col_n, dz_check,
      plane_p1, plane_p2, plane_p3,
      ng_p1, ng_p2, ng_p3,
      ok_p1, ok_p2, ok_p3,
      ramp_p1, ramp_p2, ramp_p3,
      updated_at
    FROM recipes
    ORDER BY id ASC
  `).all();
}

function replaceAllRecipes(rows) {
  const deleteAll = db.prepare("DELETE FROM recipes");

  const insert = db.prepare(`
    INSERT INTO recipes (
      model, flag_ramp, row_n, col_n, dz_check,
      plane_p1, plane_p2, plane_p3,
      ng_p1, ng_p2, ng_p3,
      ok_p1, ok_p2, ok_p3,
      ramp_p1, ramp_p2, ramp_p3,
      updated_at
    ) VALUES (
      @model, @flag_ramp, @row_n, @col_n, @dz_check,
      @plane_p1, @plane_p2, @plane_p3,
      @ng_p1, @ng_p2, @ng_p3,
      @ok_p1, @ok_p2, @ok_p3,
      @ramp_p1, @ramp_p2, @ramp_p3,
      CURRENT_TIMESTAMP
    )
  `);

  const transaction = db.transaction((items) => {
    deleteAll.run();
    for (const item of items) {
      insert.run({
        model: item.model || "",
        flag_ramp: item.flag_ramp || "0",
        row_n: item.row_n || "",
        col_n: item.col_n || "",
        dz_check: item.dz_check || "",
        plane_p1: item.plane_p1 || "",
        plane_p2: item.plane_p2 || "",
        plane_p3: item.plane_p3 || "",
        ng_p1: item.ng_p1 || "",
        ng_p2: item.ng_p2 || "",
        ng_p3: item.ng_p3 || "",
        ok_p1: item.ok_p1 || "",
        ok_p2: item.ok_p2 || "",
        ok_p3: item.ok_p3 || "",
        ramp_p1: item.ramp_p1 || "",
        ramp_p2: item.ramp_p2 || "",
        ramp_p3: item.ramp_p3 || "",
      });
    }
  });

  transaction(rows);
}

initDb();
seedIfEmpty();

module.exports = {
  db,
  getAllRecipes,
  replaceAllRecipes,
  dbPath,
};