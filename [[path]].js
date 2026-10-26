// Cloudflare Pages Function: proxy same-origin para o backend existente.
// Não altera o backend. Todas as rotas /api/* são encaminhadas para o Worker.
const BACKEND_BASE_URL = "https://aula-deploy.agenilsonsales392019.workers.dev";

export async function onRequest(context) {
  const incomingUrl = new URL(context.request.url);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, BACKEND_BASE_URL);

  const headers = new Headers(context.request.headers);
  headers.delete("host");
  headers.delete("cf-connecting-ip");

  const requestInit = {
    method: context.request.method,
    headers,
    redirect: "follow"
  };

  if (!["GET", "HEAD"].includes(context.request.method)) {
    requestInit.body = context.request.body;
  }

  try {
    const upstream = await fetch(targetUrl.toString(), requestInit);
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return Response.json(
      { erro: "Não foi possível alcançar o backend da biblioteca." },
      { status: 502 }
    );
  }
}
