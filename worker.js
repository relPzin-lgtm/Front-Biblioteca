
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Encaminha as chamadas da API ao backend existente
    if (url.pathname.startsWith("/api/")) {
      const backendUrl = new URL(
        url.pathname + url.search,
        "https://aula-deploy.agenilsonsales392019.workers.dev"
      );

      return fetch(
        new Request(backendUrl, request)
      );
    }

    // Entrega os arquivos estáticos do site
    return env.ASSETS.fetch(request);
  }
};
