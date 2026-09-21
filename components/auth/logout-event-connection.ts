type Options = { accessToken: string; issuer: string };

export function connectLogoutEvents({ accessToken, issuer }: Options) {
  let active = true;
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let attempts = 0;

  const connect = () => {
    const url = new URL("connect/logout-events", issuer);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("access_token", accessToken);
    socket = new WebSocket(url);
    socket.onopen = () => {
      attempts = 0;
    };
    socket.onmessage = (event) => {
      if (event.data === '{"type":"logout"}')
        window.location.replace("/api/logout/local");
    };
    socket.onclose = () => {
      if (!active) return;
      retry = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 30_000));
    };
  };

  connect();
  return () => {
    active = false;
    if (retry) clearTimeout(retry);
    socket?.close();
  };
}
