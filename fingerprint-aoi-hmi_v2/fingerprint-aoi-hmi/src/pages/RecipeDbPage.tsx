import { RecipeDbRow } from "../types";

type RecipeDbPageProps = {
  rows: RecipeDbRow[];
  selectedRowIndex: number;
  onSelectRow: (index: number) => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onSaveAll: () => void;
  onLoadToEditor: () => void;
  onCellChange: (rowIndex: number, key: keyof RecipeDbRow, value: string) => void;
};

const columns: { key: keyof RecipeDbRow; label: string }[] = [
  { key: "model", label: "型号" },
  { key: "flag_ramp", label: "是否斜检" },
  { key: "row_n", label: "行数" },
  { key: "col_n", label: "列数" },
  { key: "dz_check", label: "高度差" },
  { key: "plane_p1", label: "平面检P1" },
  { key: "plane_p2", label: "平面检P2" },
  { key: "plane_p3", label: "平面检P3" },
  { key: "ng_p1", label: "NG_P1" },
  { key: "ng_p2", label: "NG_P2" },
  { key: "ng_p3", label: "NG_P3" },
  { key: "ok_p1", label: "OK_P1" },
  { key: "ok_p2", label: "OK_P2" },
  { key: "ok_p3", label: "OK_P3" },
  { key: "ramp_p1", label: "RAMP_P1" },
  { key: "ramp_p2", label: "RAMP_P2" },
  { key: "ramp_p3", label: "RAMP_P3" },
];

export function RecipeDbPage({
  rows,
  selectedRowIndex,
  onSelectRow,
  onAddRow,
  onDeleteRow,
  onSaveAll,
  onLoadToEditor,
  onCellChange,
}: RecipeDbPageProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          onClick={onAddRow}
        >
          新增型号
        </button>
        <button
          className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          onClick={onSaveAll}
        >
          保存当前修改
        </button>
        <button
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
          onClick={onLoadToEditor}
        >
          加载到编辑页
        </button>
        <button
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          onClick={onDeleteRow}
        >
          删除当前行
        </button>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">配方数据库总表</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[2200px] border-collapse text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="border bg-gray-100 px-3 py-2 text-left font-semibold whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={selectedRowIndex === rowIndex ? "bg-blue-50" : ""}
                  onClick={() => onSelectRow(rowIndex)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="border px-2 py-2 align-top">
                      <input
                        className="w-full min-w-[120px] rounded border px-2 py-1 outline-none"
                        value={row[col.key]}
                        onChange={(e) =>
                          onCellChange(rowIndex, col.key, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}