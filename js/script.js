/*
  =============================================================================
  Livraria Arcana - JavaScript (ATUALIZADO)
  =============================================================================
  Este arquivo é o “cérebro” da página: ele liga dados + interface + interações.

  O que este JS faz (visão geral):
  1) Mantém um catálogo (array BOOKS) como fonte de verdade (dados)
  2) Guarda estado de UI (filtro atual + texto de busca)
  3) Renderiza o catálogo no DOM como SLIDES do Swiper (carrossel)
  4) Filtra e busca livros (com normalização + aliases para evitar bugs)
  5) Controla o Modal do Bootstrap (abre e preenche com dados do livro)
  6) Inicializa bibliotecas:
     - AOS (animações ao rolar)
     - Swiper (carrossel da História + carrossel do Catálogo)
  7) Efeitos de UI:
     - Navbar “glass” ao rolar
     - Scrollspy (destaca link da seção atual na navbar)

  Observação:
  - Está tudo encapsulado numa IIFE para evitar “poluir” o escopo global.
  - Só o Scrollspy fica fora (porque você já separou como “bloco independente”).
*/

(() => {
  "use strict";
  /*
    "use strict"
    ------------
    Ativa modo estrito:
    - impede algumas “gambiarras” silenciosas do JS
    - ajuda a pegar erros cedo (ex.: variável não declarada)
  */

  /* ========================================================================
     1) DADOS DO CATÁLOGO (BOOKS)
     ======================================================================== */
  /*
    BOOKS = “banco de dados” local
    ------------------------------
    Cada objeto representa um livro.
    Campos usados na UI:
    - id: identificador único (usado para achar livro no clique)
    - title/author/year: exibidos no card e no modal
    - category: categoria “principal” (para label no modal)
    - price: string pronta (poderia virar number no futuro)
    - cover: caminho da imagem (usado como background-image)
    - tags: lista de palavras-chave (para filtro por tags e UI)
    - description: sinopse (card tem clamp; modal mostra completo)
    - link: destino do botão “Comprar / Ver detalhes”
  */
  const BOOKS = [
    {
      id: "yellowface",
      title: "Yellowface",
      author: "R. F. Kuang",
      year: 2023,
      category: "ficcao",
      price: "R$ 59,90",
      cover: "/img/impostora.jpg",
      tags: ["sátira", "mercado editorial", "tensão", "contemporâneo"],
      description:
        "Uma autora em ascensão vê a oportunidade perfeita ao alcance das mãos e decide atravessar uma linha perigosa. Entre fama, culpa e mentira, a história vira um espelho afiado sobre identidade, apropriação e o apetite do mercado por narrativas vendáveis.",
      link: "#"
    },
    {
      id: "outra-vida",
      title: "Em outra vida talvez?",
      author: "Taylor Jenkins Reid",
      year: 2015,
      category: "romance",
      price: "R$ 49,90",
      cover: "/img/emoutravida.jpg",
      tags: ["romance", "destino", "escolhas", "leve e emocional"],
      description:
        "Uma noite, duas decisões. A vida se divide em caminhos paralelos, mostrando como pequenas escolhas mudam tudo: amores, amizades e a forma como a gente aprende a existir.",
      link: "#"
    },
    {
      id: "sociedade-anel",
      title: "A Sociedade do Anel",
      author: "J. R. R. Tolkien",
      year: 1954,
      category: "fantasia",
      price: "R$ 79,90",
      cover: "/img/Capa_senhor_dos_anéis.jpg",
      tags: ["fantasia", "aventura", "épico", "clássico"],
      description:
        "O início da jornada pela Terra-média. Um anel, um fardo impossível e uma companhia improvável. Um clássico que moldou a fantasia moderna, com ritmo de lenda e coração de viagem.",
      link: "#"
    },
    {
      id: "Dom-Casmurro",
      title: "Dom Casmurro",
      author: "Machado de Assis",
      year: 1899,
      category: "literatura",
      price: "R$ 44,90",
      cover: "/img/dom.jpg",
      tags: ["clássico", "literatura brasileira", "ciúme", "ambiguidade"],
      description:
        "Bentinho e Capitu: uma história de amor, ciúme e dúvida que atravessa gerações. Machado de Assis constrói um romance onde a verdade é um espelho quebrado, refletindo as complexidades da mente humana e as incertezas do coração.",
      link: "#"
    },
    {
      id: "duna",
      title: "Duna",
      author: "Frank Herbert",
      year: 1965,
      category: "sci-fi",
      price: "R$ 69,90",
      cover: "/img/Duna.jpg",
      tags: ["épico", "sci-fi", "política", "ecologia"],
      description:
        "Em Arrakis, poder e sobrevivência se misturam à profecia e ao controle de um recurso valioso. Um universo vasto, tenso e hipnótico, onde cada decisão cobra juros.",
      link: "#"
    },
    {
      id: "relatos-de-um-gato-viajante",
      title: "Relatos de um Gato Viajante",
      author: "Hiro Arikawa",
      year: 2022,
      category: "pop",
      price: "R$ 39,90",
      cover: "/img/relatosdeumgato.jpg",
      tags: ["contos", "humor", "cotidiano", "leve"],
      description:
        "Histórias curtas e cativantes de um gato que viaja pelo Japão, encontrando pessoas e lugares únicos. Um livro que é um abraço quentinho para os amantes de gatos e de boas histórias.",
      link: "#"
    },
    {
      id: "sapiens",
      title: "Sapiens: Uma Breve História da Humanidade",
      author: "Yuval Noah Harari",
      year: 2011,
      category: "historia",
      price: "R$ 69,90",
      cover: "/img/sapiens.jpg",
      tags: ["história", "ciência", "humanidade", "pensamento"],
      description:
        "Uma jornada fascinante pela história da humanidade, desde os primeiros homens até o presente. Um livro que desafia o pensamento com insights sobre evolução, cultura e o futuro da espécie humana.",
      link: "#"
    }
  ];

  /* ========================================================================
     2) ESTADO DO FILTRO E BUSCA
     ======================================================================== */
  /*
    state = estado atual da interface
    --------------------------------
    Em vez de espalhar variáveis soltas, você guarda aqui:
    - filter: filtro ativo ("todos", "fantasia", "Clássico"...)
    - query: texto digitado na busca

    Isso facilita:
    - render() olhar “uma fonte de estado”
    - futuramente adicionar ordenação (ex.: state.sort = "preco")
  */
  const state = {
    filter: "todos",
    query: ""
  };

  /* ========================================================================
     3) ELEMENTOS DO DOM (ganchos para interagir com a página)
     ======================================================================== */
  /*
    Aqui buscamos elementos que o JS precisa controlar.
    Regra de ouro:
    - Se um elemento não existir, o JS não deve quebrar.
      (por isso vários "if (!x) return" mais abaixo)
  */
  const header = document.querySelector(".arcana-header");
  const filterButtons = document.querySelectorAll(".filter-btn");

  /*
    grid = container onde entram os slides do catálogo.
    Importante: agora ele é .swiper-wrapper, então cada item precisa ser .swiper-slide.
  */
  const grid = document.getElementById("catalogGrid");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");

  // Modal do Bootstrap (componente já pronto; nós só alimentamos conteúdo)
  const bookModalEl = document.getElementById("bookModal");
  const bookModal = bookModalEl ? new bootstrap.Modal(bookModalEl) : null;

  // Campos dentro do modal (onde vamos “injetar” dados do livro selecionado)
  const modalTitle = document.getElementById("bookModalTitle");
  const modalMeta = document.getElementById("bookModalMeta");
  const modalPrice = document.getElementById("bookModalPrice");
  const modalDesc = document.getElementById("bookModalDesc");
  const modalTags = document.getElementById("bookModalTags");
  const modalCover = document.getElementById("bookModalCover");
  const modalBuy = document.getElementById("bookModalBuy");

  // Botão de tema (existe no HTML, mas não está sendo usado neste arquivo ainda)
  const themeToggle = document.getElementById("themeToggle");

  // Instância do Swiper do catálogo (guardada para destruir/recriar quando necessário)
  let catalogSwiper = null;

  /* ========================================================================
     5) INICIALIZAÇÕES (AOS + Swipers + Navbar glass)
     ======================================================================== */

  /*
    AOS
    ---
    Só inicializa se a lib estiver carregada (window.AOS).
    Config:
    - duration: tempo da animação
    - easing: curva de animação (suavidade)
    - once: true = anima só uma vez (evita “piscando” ao subir/descer)
    - offset: “distância” antes do elemento entrar para disparar
  */
  if (window.AOS) {
    AOS.init({
      duration: 650,
      easing: "ease-out",
      once: true,
      offset: 80
    });
  }

  /*
    Swiper da História
    ------------------
    Mantém o carrossel “capítulos” com:
    - loop: recomeça sem parar
    - autoplay: troca automática
    - navigation/pagination: botões e bolinhas
  */
  if (window.Swiper) {
    new Swiper(".arcana-swiper", {
      loop: true,
      grabCursor: true,
      spaceBetween: 12,
      slidesPerView: 1,
      autoplay: { delay: 4200, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
      breakpoints: {
        768: { slidesPerView: 1 },
        992: { slidesPerView: 1 }
      }
    });
  }

  /*
    Navbar “glass” ao rolar
    -----------------------
    - Se window.scrollY > 10: adiciona classe .is-scrolled
    - CSS usa .is-scrolled para aplicar blur + fundo translúcido
  */
  const handleScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll(); // chama uma vez pra acertar estado inicial (página pode carregar já “rolada”)

  /* ========================================================================
     6) NORMALIZAÇÃO + FILTRO + BUSCA (com aliases para não quebrar)
     ======================================================================== */

  /*
    normalize(str)
    --------------
    Transformação para comparação “à prova de variação”:
    - remove acentos (NFD + diacríticos)
    - lowerCase
    - trim
    Assim: "Clássico", "classico", " CLÁSSICOS " viram a mesma coisa.
  */
  function normalize(str) {
    return (str || "")
      .toString()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }

  /*
    matchesFilter(book)
    -------------------
    Regras:
    - Se filtro = "todos", passa direto.
    - Caso contrário, compara o filtro com as tags do livro.
    - Usa aliases para corrigir plural/singular e variações comuns.
    Por que filtrar por tag?
    - Porque tag é o “vocabulário flexível” do livro.
      Ex.: um livro pode ser "fantasia" e também "clássico".
  */
  function matchesFilter(book) {
    if (state.filter === "todos") return true;

    const filter = normalize(state.filter);

    // Mapeia “formas alternativas” para uma forma canônica (padrão)
    const aliases = {
      classicos: "classico",
      classico: "classico",
      conto: "contos",
      contos: "contos"
    };

    const canonical = aliases[filter] || filter;

    // true se alguma tag do livro bater com o filtro canônico
    return (book.tags || []).some(tag => normalize(tag) === canonical);
  }

  /*
    matchesQuery(book)
    ------------------
    Busca textual simples (client-side):
    - monta um “haystack” com título, autor, categoria, tags e descrição
    - normaliza tudo
    - verifica se inclui o texto digitado (q)
  */
  function matchesQuery(book) {
    const q = normalize(state.query);
    if (!q) return true;

    const hay = normalize([
      book.title,
      book.author,
      book.category,
      (book.tags || []).join(" "),
      book.description
    ].join(" "));

    return hay.includes(q);
  }

  /*
    getVisibleBooks()
    -----------------
    Aplica filtro + busca e retorna a lista final que deve aparecer no catálogo.
  */
  function getVisibleBooks() {
    return BOOKS.filter(b => matchesFilter(b) && matchesQuery(b));
  }

  /* ========================================================================
     7) CATÁLOGO: render em SLIDES + Swiper (carrossel)
     ======================================================================== */

  /*
    coverStyle(coverUrl)
    --------------------
    Gera a string de background-image com camadas:
    1) radial dourado (atmosfera)
    2) gradiente leve (profundidade)
    3) imagem de capa (url)
    Retorna string para usar no atributo style="" do HTML gerado.
  */
  function coverStyle(coverUrl) {
    if (!coverUrl) return "";
    return `background-image:
      radial-gradient(700px 280px at 25% 30%, rgba(201,163,94,.22), transparent 55%),
      linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02)),
      url('${coverUrl}')`;
  }

  /*
    initCatalogSwiper()
    -------------------
    Inicializa ou reinicializa o Swiper do catálogo.
    Por que reinicializar?
    - Porque render() troca o DOM (slides mudam),
      então o Swiper precisa recalcular tudo.

    Estratégia:
    - se já existe uma instância, destroy(true, true)
      (limpa eventos + estilos inline gerados)
    - cria um novo Swiper com as configs desejadas
  */
  function initCatalogSwiper() {
    if (!window.Swiper) return;

    // Evita duplicar instâncias ao re-renderizar
    if (catalogSwiper && typeof catalogSwiper.destroy === "function") {
      catalogSwiper.destroy(true, true);
      catalogSwiper = null;
    }

    catalogSwiper = new Swiper(".arcana-catalog-swiper", {
      loop: true,
      grabCursor: true,
      spaceBetween: 14,
      slidesPerView: 1,
      watchOverflow: true, // se tiver poucos slides, evita comportamento estranho

      /*
        Autoplay “esteira”
        ------------------
        delay: 0 + speed alto cria efeito contínuo.
        pauseOnMouseEnter: pausa no hover (desktop) pra leitura.
        disableOnInteraction: false mantém autoplay mesmo após arrastar.
      */
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      speed: 6000,

      // Controles (ganchos CSS do seu HTML)
      pagination: {
        el: ".catalog-pagination",
        clickable: true
      },
      navigation: {
        nextEl: ".catalog-next",
        prevEl: ".catalog-prev"
      },

      // Responsivo: mais livros por “página” conforme largura
      breakpoints: {
        576: { slidesPerView: 2 },
        992: { slidesPerView: 3 }
      }
    });
  }

  /*
    render()
    --------
    Função principal de “pintar” o catálogo na tela.
    Ela:
    1) calcula books visíveis (filtro + busca)
    2) gera HTML dos slides
    3) controla emptyState
    4) reinicia Swiper do catálogo
    5) atualiza AOS (porque DOM mudou)
  */
  function render() {
    if (!grid) return;

    const books = getVisibleBooks();

    /*
      Cada livro vira:
      <div class="swiper-slide">
        <article class="catalog-card" data-book-id="...">...</article>
      </div>
      Observação:
      - data-book-id é o “pino” que permite encontrar o livro no clique.
      - O botão "Ver detalhes" tem data-action="open-modal" para facilitar delegation.
    */
    grid.innerHTML = books.map(book => {
      return `
        <div class="swiper-slide">
          <article class="catalog-card" data-book-id="${book.id}">
            <div
              class="catalog-cover"
              style="${coverStyle(book.cover)}"
              aria-label="Capa do livro ${book.title}"
              role="img"
            ></div>

            <div class="catalog-body">
              <h3 class="catalog-title">${book.title}</h3>
              <p class="catalog-author">${book.author} • ${book.year}</p>

              <p class="catalog-desc">${book.description}</p>

              <div class="catalog-footer">
                <span class="price">${book.price}</span>
                <button class="btn btn-ghost btn-sm" type="button" data-action="open-modal">
                  Ver detalhes
                </button>
              </div>

              <div class="tags mt-3">
                ${(book.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join("")}
              </div>
            </div>
          </article>
        </div>
      `;
    }).join("");

    // Empty state: mostra quando não há resultados
    if (emptyState) {
      emptyState.classList.toggle("d-none", books.length !== 0);
    }

    // Reinicia Swiper após trocar os slides
    initCatalogSwiper();

    // AOS precisa recalcular animações quando o DOM muda
    if (window.AOS) AOS.refreshHard();
  }

  /* ========================================================================
     8) EVENTOS: filtros + busca + clique modal
     ======================================================================== */

  /*
    Clique nos filtros
    ------------------
    - Remove is-active de todos
    - Marca o clicado
    - Atualiza state.filter
    - Re-renderiza catálogo
  */
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      state.filter = btn.dataset.filter || "todos";
      render();
    });
  });

  /*
    Busca com debounce
    ------------------
    Debounce = espera um pouquinho antes de renderizar,
    evitando render() a cada tecla com muita agressividade.
    Aqui: 120ms (rápido e suave).
  */
  let t = null;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.query = e.target.value || "";
        render();
      }, 120);
    });
  }

  /*
    Clique no catálogo (delegation)
    ------------------------------
    Em vez de adicionar listener em cada botão (que muda quando renderiza),
    a gente escuta o container (#catalogGrid) e “descobre” o alvo.

    Passos:
    1) verifica se clicou em algo com data-action="open-modal"
    2) acha o card pai com data-book-id
    3) acha o livro no array BOOKS
    4) preenche modal + mostra
  */
  if (grid) {
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action='open-modal']");
      if (!btn) return;

      const card = e.target.closest("[data-book-id]");
      if (!card) return;

      const id = card.getAttribute("data-book-id");
      const book = BOOKS.find(b => b.id === id);
      if (!book) return;

      fillModal(book);
      if (bookModal) bookModal.show();
    });
  }

  /* ========================================================================
     9) MODAL: preenchimento + categorias corrigidas
     ======================================================================== */

  /*
    fillModal(book)
    --------------
    Preenche todos os campos do modal com os dados do livro.
    Importante:
    - modalCover usa backgroundImage (com camadas) igual ao card
    - modalBuy recebe href do link do livro
  */
  function fillModal(book) {
    if (!modalTitle) return;

    modalTitle.textContent = book.title;
    modalMeta.textContent = `${book.author} • ${book.year} • ${labelCategory(book.category)}`;
    modalPrice.textContent = book.price;
    modalDesc.textContent = book.description;

    // Tags no modal: gera vários “chips”
    modalTags.innerHTML = (book.tags || []).map(t => `<span class="tag">${t}</span>`).join("");

    // Reset da capa (boa prática: evita “restos” se algum livro não tiver capa)
    modalCover.style.backgroundImage = "";

    if (book.cover) {
      modalCover.style.backgroundImage = `
        radial-gradient(700px 280px at 25% 30%, rgba(201,163,94,.22), transparent 55%),
        linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02)),
        url('${book.cover}')
      `;
      modalCover.style.backgroundSize = "cover";
      modalCover.style.backgroundPosition = "center";
    }

    // Link do botão “comprar”
    modalBuy.setAttribute("href", book.link || "#");
  }

  /*
    labelCategory(cat)
    ------------------
    Converte o “código” da categoria (ex.: "sci-fi") em label amigável ("Sci-fi").
    - normaliza chave para evitar variações ("SciFi", "scifi", etc.)
    - se não encontrar, cai no fallback "Livro"
  */
  function labelCategory(cat) {
    const key = normalize(cat);

    const map = {
      ficcao: "Ficção",
      romance: "Romance",
      fantasia: "Fantasia",
      "sci-fi": "Sci-fi",
      scifi: "Sci-fi",
      literatura: "Literatura",
      historia: "História",
      pop: "Pop"
    };

    return map[key] || "Livro";
  }

  // Render inicial: desenha o catálogo assim que a página carrega
  render();

  /*
    Nota sobre o tema (light/dark)
    ------------------------------
    Você já pega themeToggle no DOM, mas não implementou aqui no código enviado.
    Se quiser, eu adapto este mesmo arquivo com:
    - leitura do localStorage
    - aplicação de body.classList.add('light-mode')
    - clique no botão alternando tema e salvando a preferência
  */
})();

/* =============================================================================
   Scrollspy simples (fora da IIFE)
   ============================================================================= */

/*
  Scrollspy (destaque de link ativo)
  ---------------------------------
  Objetivo: quando você rola a página, o link da seção atual na navbar
  recebe a classe .is-active (para seu CSS destacar em dourado).

  Como funciona:
  - pega todos os links .nav-link
  - pega todas as seções com id (section[id])
  - calcula a posição atual (scrollY + offset)
  - encontra a última seção cujo topo já passou do “ponto de leitura”
  - marca o link correspondente ao id

  Offset (110):
  - compensa o header fixo + um respiro para não “trocar cedo demais”
*/
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const sections = Array.from(document.querySelectorAll("section[id]"));

function setActiveLink() {
  const y = window.scrollY + 110;
  let currentId = "";

  // Encontra a seção atual (a mais “próxima acima” do ponto y)
  for (const sec of sections) {
    if (sec.offsetTop <= y) currentId = sec.id;
  }

  // Liga/desliga a classe conforme o href do link
  navLinks.forEach(a => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle("is-active", href === `#${currentId}`);
  });
}

// Scroll listener passivo (melhor performance)
window.addEventListener("scroll", setActiveLink, { passive: true });
setActiveLink(); // chama uma vez para definir estado inicial
