export function MainPage() {
  const defectItems = Array.from({ length: 22 }, (_, i) => ({
    name: `缺陷${i + 1}`,
    result: "未检测",
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">检测画面</h3>
          <div className="flex h-[420px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500">
            图片显示区域
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">检测结果</h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-100 p-3">
              <p className="text-sm text-gray-500">总结果</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">未检测</p>
            </div>

            <div className="rounded-lg bg-gray-100 p-3">
              <p className="text-sm text-gray-500">当前型号</p>
              <p className="mt-1 text-base font-medium text-gray-900">未选择</p>
            </div>

            <div className="rounded-lg bg-gray-100 p-3">
              <p className="text-sm text-gray-500">当前产品</p>
              <p className="mt-1 text-base font-medium text-gray-900">无</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">22项缺陷结果</h3>
        <div className="grid grid-cols-4 gap-3">
          {defectItems.map((item) => (
            <div key={item.name} className="rounded-lg border bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700">{item.name}</p>
              <p className="mt-1 text-sm text-gray-500">{item.result}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}