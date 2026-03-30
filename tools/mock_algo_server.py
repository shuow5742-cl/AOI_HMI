import json
import socket
from typing import Optional

HOST = "0.0.0.0"
PORT = 30000

def build_reply(cmd: str) -> Optional[str]:
    if cmd == "get_distance":
        return json.dumps({"distance": 125.6})
    if cmd in ("top_ready", "top_arrived", "retake_top"):
        return json.dumps({"quality": "pass"})
    if cmd in ("bottom_ready", "down_arrived", "retake_down"):
        return json.dumps({"quality": "pass"})
    if cmd == "get_result":
        return json.dumps({"result": "OK"})
    return None

def main() -> None:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server:
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((HOST, PORT))
        server.listen(1)
        print(f"[LISTEN] {HOST}:{PORT}")

        conn, addr = server.accept()
        with conn:
            print(f"[CONNECTED] {addr}")
            while True:
                data = conn.recv(4096)
                if not data:
                    print("[DISCONNECTED]")
                    break

                text = data.decode("utf-8", errors="replace")
                print(f"[RECV RAW] {text}")

                try:
                    obj = json.loads(text)
                    print(f"[RECV JSON] {obj}")
                except Exception as e:
                    print(f"[JSON ERROR] {e}")
                    continue

                cmd = obj.get("arm")
                print(f"[CMD] {cmd}")

                reply = build_reply(cmd)
                if reply is not None:
                    conn.sendall(reply.encode("utf-8"))
                    print(f"[SEND] {reply}")
                else:
                    print("[SEND] no reply for this command")

if __name__ == "__main__":
    main()
