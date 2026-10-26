
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const target = new URL(
        url.pathname + url.search,
        "https://aula-deploy.agenilsonsales392019.workers.dev"
      );

      const headers = new Headers(request.headers);
      headers.delete("host");

      return fetch(new Request(target.toString(), {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method)
          ? undefined
          : request.body,
        redirect: "follow"
      }));
    }

    return env.ASSETS.fetch(request);
  }
};
