export function mapRobotStatusToChinese(rawMessage: string): string {
  if (!rawMessage || rawMessage.trim() === "") {
    return "无";
  }

  try {
    const parsed = JSON.parse(rawMessage);
    const code = parsed?.robot;

    switch (code) {
      case "no_material":
        return "缺料报警";
      case "take_ok_pallet":
        return "请取走 OK 盘";
      case "take_ng_pallet":
        return "请取走 NG 盘";
      case "distance_error":
        return "测距值异常";
      case "door_open":
        return "安全门未关";
      case "param_not_saved":
        return "上位机参数未保存";
      case "alg_connect_fail":
        return "算法通信连接失败";
      case "param_recv_error":
        return "参数接收异常";
      default:
        return `未识别状态：${rawMessage}`;
    }
  } catch {
    return rawMessage;
  }
}