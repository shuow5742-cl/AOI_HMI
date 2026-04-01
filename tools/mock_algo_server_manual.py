import json
import socket

HOST = "0.0.0.0"
PORT = 30000

def main() -> None:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((HOST, PORT))
        server.listen(1)
        print(f"[LISTEN] {HOST}:{PORT}")
        print("[INFO] 等待机械臂连接...")

        conn, addr = server.accept()
        with conn:
            print(f"[CONNECTED] {addr}")
            print("[INFO] 机械臂已连接，现在开始手动回复。")
            print('[INFO] 例子：{"distance":125.6}  或  {"quality":"pass"}  或  {"result":"OK"}')
            print("[INFO] 直接按回车 = 本次不回复")
            print("[INFO] 输入 quit = 退出程序")

            while True:
                data = conn.recv(4096)
                if not data:
                    print("[DISCONNECTED] 机械臂已断开连接")
                    break

                text = data.decode("utf-8", errors="replace")
                print("\n" + "=" * 60)
                print(f"[RECV RAW] {text}")

                try:
                    obj = json.loads(text)
                    print(f"[RECV JSON] {obj}")
                except Exception as e:
                    print(f"[JSON ERROR] {e}")
                    continue

                cmd = obj.get("arm")
                print(f"[CMD] {cmd}")

                reply = input("[INPUT REPLY] 请输入要返回给机械臂的JSON：").strip()

                if reply.lower() == "quit":
                    print("[EXIT] 程序退出")
                    break

                if reply == "":
                    print("[SKIP] 本次不回复机械臂")
                    continue

                try:
                    parsed = json.loads(reply)
                    send_text = json.dumps(parsed, ensure_ascii=False)
                except Exception as e:
                    print(f"[INPUT ERROR] 不是合法JSON，未发送。错误：{e}")
                    continue

                conn.sendall(send_text.encode("utf-8"))
                print(f"[SEND] {send_text}")

if __name__ == "__main__":
    main()
