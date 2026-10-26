
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const destino = new URL(
        url.pathname + url.search,
        "https://aula-deploy.agenilsonsales392019.workers.dev"
      );

      return fetch(new Request(destino, request));
    }

    return env.ASSETS.fetch(request);
  }
};
