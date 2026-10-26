// O frontend chama /api no mesmo domínio. A função em functions/api/[[path]].js
// encaminha as requisições para o Cloudflare Worker do backend.
const API_URL = "/api/livros";

const elements = {
  status: document.getElementById("connection-status"),
  totalBooks: document.getElementById("total-books"),
  totalAuthors: document.getElementById("total-authors"),
  recentBooks: document.getElementById("recent-books"),
  grid: document.getElementById("books-grid"),
  loading: document.getElementById("loading-state"),
  empty: document.getElementById("empty-state"),
  count: document.getElementById("results-count"),
  search: document.getElementById("search-input"),
  alert: document.getElementById("alert-area"),
  modal: document.getElementById("book-modal"),
  form: document.getElementById("book-form"),
  modalTitle: document.getElementById("modal-title"),
  id: document.getElementById("book-id"),
  title: document.getElementById("book-title"),
  author: document.getElementById("book-author"),
  year: document.getElementById("book-year"),
  formError: document.getElementById("form-error"),
  save: document.getElementById("save-book-btn"),
  toast: document.getElementById("toast")
};

let books = [];
let toastTimer;

function setConnection(connected) {
  elements.status.classList.toggle("error", !connected);
  elements.status.innerHTML = `<span class="status-dot"></span>${connected ? "API conectada" : "Sem conexão com API"}`;
}
function showAlert(message, type = "error") {
  elements.alert.innerHTML = `<div class="alert ${type}">${escapeHTML(message)}</div>`;
}
function clearAlert() { elements.alert.innerHTML = ""; }
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.add("hidden"), 3200);
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
async function apiRequest(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) }
    });
  } catch (error) {
    throw new Error("Não foi possível conectar à API. Verifique se o frontend está publicado no Cloudflare Pages e se a função de encaminhamento foi enviada junto.");
  }
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) {
    const message = data && typeof data === "object" && (data.erro || data.error || data.message);
    throw new Error(message || `A API respondeu com erro HTTP ${response.status}.`);
  }
  return data;
}
function normalizeBooks(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.livros)) return data.livros;
  throw new Error("A API respondeu, mas o formato da lista de livros não é o esperado.");
}
async function loadBooks() {
  elements.loading.classList.remove("hidden");
  elements.grid.innerHTML = "";
  elements.empty.classList.add("hidden");
  clearAlert();
  try {
    const data = await apiRequest(API_URL);
    books = normalizeBooks(data);
    setConnection(true);
    renderBooks();
    updateStats();
  } catch (error) {
    setConnection(false);
    elements.count.textContent = "Falha ao carregar";
    showAlert(error.message);
    elements.empty.classList.add("hidden");
  } finally {
    elements.loading.classList.add("hidden");
  }
}
function updateStats() {
  elements.totalBooks.textContent = books.length;
  elements.totalAuthors.textContent = new Set(books.map(book => String(book.autor || "").trim().toLocaleLowerCase()).filter(Boolean)).size;
  elements.recentBooks.textContent = books.filter(book => Number(book.ano) >= 2020).length;
}
function renderBooks() {
  const query = elements.search.value.trim().toLocaleLowerCase("pt-BR");
  const filtered = books.filter(book =>
    String(book.titulo || "").toLocaleLowerCase("pt-BR").includes(query) ||
    String(book.autor || "").toLocaleLowerCase("pt-BR").includes(query)
  );
  elements.grid.innerHTML = filtered.map(book => {
    const id = escapeHTML(book.id);
    const title = escapeHTML(book.titulo || "Sem título");
    const author = escapeHTML(book.autor || "Autor não informado");
    const year = book.ano ? escapeHTML(book.ano) : "Ano não informado";
    const initials = escapeHTML((String(book.titulo || "L").trim()[0] || "L").toLocaleUpperCase("pt-BR"));
    return `<article class="book-card">
      <div class="book-card-top"><div class="book-cover">${initials}</div><span class="book-year">${year}</span></div>
      <h3>${title}</h3><p class="book-author">por ${author}</p>
      <div class="book-actions">
        <button class="mini-btn" data-action="edit" data-id="${id}">Editar</button>
        <button class="mini-btn delete" data-action="delete" data-id="${id}">Excluir</button>
      </div>
    </article>`;
  }).join("");
  elements.count.textContent = `${filtered.length} ${filtered.length === 1 ? "livro" : "livros"}`;
  elements.empty.classList.toggle("hidden", filtered.length !== 0);
}
function openModal(book = null) {
  elements.form.reset();
  elements.formError.classList.add("hidden");
  elements.formError.textContent = "";
  elements.id.value = book?.id ?? "";
  elements.title.value = book?.titulo ?? "";
  elements.author.value = book?.autor ?? "";
  elements.year.value = book?.ano ?? "";
  elements.modalTitle.textContent = book ? "Editar livro" : "Adicionar livro";
  elements.save.textContent = book ? "Salvar alterações" : "Salvar livro";
  elements.modal.classList.remove("hidden");
  setTimeout(() => elements.title.focus(), 50);
}
function closeModal() {
  elements.modal.classList.add("hidden");
  elements.formError.classList.add("hidden");
}
async function saveBook(event) {
  event.preventDefault();
  const titulo = elements.title.value.trim();
  const autor = elements.author.value.trim();
  const ano = elements.year.value.trim();
  if (!titulo || !autor) {
    elements.formError.textContent = "Preencha o título e o autor.";
    elements.formError.classList.remove("hidden");
    return;
  }
  const id = elements.id.value;
  const payload = { titulo, autor, ano: ano ? Number(ano) : null };
  elements.save.disabled = true;
  elements.save.textContent = "Salvando...";
  elements.formError.classList.add("hidden");
  try {
    await apiRequest(id ? `${API_URL}/${encodeURIComponent(id)}` : API_URL, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeModal();
    showToast(id ? "Livro atualizado com sucesso!" : "Livro cadastrado com sucesso!");
    await loadBooks();
  } catch (error) {
    elements.formError.textContent = error.message;
    elements.formError.classList.remove("hidden");
  } finally {
    elements.save.disabled = false;
    elements.save.textContent = id ? "Salvar alterações" : "Salvar livro";
  }
}
async function deleteBook(id) {
  const book = books.find(item => String(item.id) === String(id));
  if (!book || !confirm(`Deseja excluir o livro "${book.titulo}"? Esta ação não pode ser desfeita.`)) return;
  try {
    await apiRequest(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE" });
    showToast("Livro excluído com sucesso.");
    await loadBooks();
  } catch (error) {
    showAlert(error.message);
  }
}

document.getElementById("open-add-modal").addEventListener("click", () => openModal());
document.getElementById("empty-add-btn").addEventListener("click", () => openModal());
document.getElementById("close-modal").addEventListener("click", closeModal);
document.getElementById("cancel-modal").addEventListener("click", closeModal);
document.getElementById("refresh-books").addEventListener("click", loadBooks);
elements.search.addEventListener("input", renderBooks);
elements.form.addEventListener("submit", saveBook);
elements.grid.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === "edit") {
    const book = books.find(item => String(item.id) === String(id));
    if (book) openModal(book);
  } else if (button.dataset.action === "delete") {
    deleteBook(id);
  }
});
elements.modal.addEventListener("click", event => {
  if (event.target === elements.modal) closeModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

loadBooks();
