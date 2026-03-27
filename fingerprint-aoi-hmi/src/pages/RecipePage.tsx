import { RecipeDbRow } from "../types";

type RecipePageProps = {
  editRow: RecipeDbRow | null;
  onFieldChange: (key: keyof RecipeDbRow, value: string) => void;
  onSaveToDb: () => void;
  onSendRecipe: () => void;
  onCapturePose: (key: keyof RecipeDbRow) => void;
};

const pointFields: { key: keyof RecipeDbRow; label: string }[] = [
  { key: "plane_p1", label: "平面检 P1" },
  { key: "plane_p2", label: "平面检 P2" },
  { key: "plane_p3", label: "平面检 P3" },
  { key: "ng_p1", label: "NG 交换位 P1" },
  { key: "ng_p2", label: "NG 交换位 P2" },
  { key: "ng_p3", label: "NG 交换位 P3" },
  { key: "ok_p1", label: "OK 交换位 P1" },
  { key: "ok_p2", label: "OK 交换位 P2" },
  { key: "ok_p3", label: "OK 交换位 P3" },
  { key: "ramp_p1", label: "斜面检 P1" },
  { key: "ramp_p2", label: "斜面检 P2" },
  { key: "ramp_p3", label: "斜面检 P3" },
];

export function RecipePage({
  editRow,
  onFieldChange,
  onSaveToDb,
  onSendRecipe,
  onCapturePose,
}: RecipePageProps) {
  if (!editRow) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h3 className="text-lg font-semibold">配方编辑 / 标定</h3>
        <p className="mt-3 text-sm text-gray-600">
          请先到“配方数据库”页选中一行，再点击“加载到编辑页”。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          onClick={onSaveToDb}
        >
          保存到数据库
        </button>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          onClick={onSendRecipe}
        >
          下发当前型号
        </button>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold">基础参数</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600">型号</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none"
              value={editRow.model}
              onChange={(e) => onFieldChange("model", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-600">是否斜检 flag_ramp</label>
            <select
              className="w-full rounded-lg border px-3 py-2 outline-none"
              value={editRow.flag_ramp}
              onChange={(e) => onFieldChange("flag_ramp", e.target.value)}
            >
              <option value="0">0</option>
              <option value="1">1</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-600">行数 row_n</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none"
              value={editRow.row_n}
              onChange={(e) => onFieldChange("row_n", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-600">列数 col_n</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none"
              value={editRow.col_n}
              onChange={(e) => onFieldChange("col_n", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-600">高度差 dz_check</label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none"
              value={editRow.dz_check}
              onChange={(e) => onFieldChange("dz_check", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold">点位信息</h3>
        <p className="mb-4 text-sm text-gray-500">
          坐标格式：X,Y,Z,Rx,Ry,Rz。可手动输入，后面再接“读取机械臂当前位置”真实功能。
        </p>

        <div className="space-y-3">
          {pointFields.map((field) => (
            <div
              key={field.key}
              className="grid grid-cols-[180px_1fr_140px] items-center gap-3"
            >
              <div className="text-sm font-medium text-gray-700">{field.label}</div>

              <input
                className="w-full rounded-lg border px-3 py-2 outline-none"
                value={editRow[field.key]}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                placeholder="X,Y,Z,Rx,Ry,Rz"
              />

              <button
                className="rounded-lg bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-800"
                onClick={() => onCapturePose(field.key)}
              >
                读取当前位置
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}