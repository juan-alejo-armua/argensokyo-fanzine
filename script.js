/* ============================================================
  script.js - Revista Digital responsiva + índice
  ============================================================ */

/* ----------------- Lista de carpetas ----------------- */
const folderList = [
    "1_Inicio-1_5",
    "2_Touhou6-6_21",
    "3_Touhou7-22_32",
    "4_Touhou8-33_41",
    "5_Touhou9-42_49",
    "6_Touhou10-50_57",
    "7_Touhou11-58_70",
    "8_Touhou12-71_78",
    "9_Touhou13-79_84",
    "10_Touhou14-85_90",
    "11_Touhou15-91_96",
    "12_Touhou16-97_112",
    "13_Touhou17-113_125",
    "14_Touhou18-126_130",
    "15_Touhou19-131_135",
    "16_Touhou20-136_140",
    "17_PC98-141_152",
    "18_Spinoffs-153_172",
    "19_Fangames-173_175",
    "20_Colaboraciones-176_177",
    "21_TouhouArg-178_182",
    "22_Entrevistas-183_187",
    "23_Creditos-188_196"
];

/* ----------------- Parseo ----------------- */
const customNames = {
    "Spinoffs": "Spin offs",
    "TouhouArg": "Touhou Arg",
    "Fangames": "Fan games"
        // Agregá más si querés
};

function parseFolderString(s) {
    const m = s.match(/^(\d+)_(.+)-(\d+)_(\d+)$/);
    if (!m) return null;

    const order = parseInt(m[1], 10);

    const rawName = m[2];

    // Nombre final = personalizado o auto-formateado
    const name =
        customNames[rawName] ||
        rawName
        .replace(/([a-z])([A-Z])/g, "$1 $2") // separa palabras por mayúsculas internas
        .replace(/([A-Za-z])(\d)/g, "$1 $2"); // separa letra+numero

    const start = parseInt(m[3], 10);
    const end = parseInt(m[4], 10);

    return { folder: s, order, name, start, end, pages: end - start + 1 };
}

const segments = folderList.map(parseFolderString).filter(Boolean);
const TOTAL_GLOBAL_PAGES = segments.reduce((mx, seg) => Math.max(mx, seg.end), 0);

/* ----------------- Estado ----------------- */
let currentPage = 1;
let doubleView = false;

const left = document.getElementById("page-left");
const right = document.getElementById("page-right");
const indicator = document.getElementById("page-indicator");
const magazineDiv = document.getElementById("magazine");
const fullscreenBtn = document.getElementById("fullscreen");
const exitBtn = document.getElementById("exit-fullscreen");
const sidebar = document.getElementById("sidebar-index");

/* ----------------- Index dinámico ----------------- */
function buildOverlayIndex() {
    const list = document.getElementById("index-list");
    list.innerHTML = '';

    segments.forEach(seg => {
        const b = document.createElement("button");
        b.textContent = seg.name;
        b.onclick = () => {
            currentPage = seg.start;
            renderPage();
            closeIndexOverlay();
        };
        list.appendChild(b);
    });
}
buildOverlayIndex();

/* ----------------- Responsive view ----------------- */
function checkResponsiveView() {
    if (window.innerWidth <= 768) {
        doubleView = false;
        document.getElementById("toggle-view").style.display = "none";
    } else {
        document.getElementById("toggle-view").style.display = "inline-block";
    }
}

window.addEventListener("resize", () => {
    checkResponsiveView();
    renderPage();
});
checkResponsiveView();

/* ----------------- Utilidades ----------------- */
function encodeFolder(folder) { return encodeURIComponent(folder); }

function getSegmentForGlobal(globalPage) {
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (globalPage >= seg.start && globalPage <= seg.end) return { index: i, segment: seg };
    }
    return { index: segments.length - 1, segment: segments[segments.length - 1] };
}

function globalToRealPath(globalPage) {
    const info = getSegmentForGlobal(globalPage);
    return `paginas/${encodeFolder(info.segment.folder)}/${globalPage}.webp`;
}

/* ----------------- Precarga ----------------- */
function preloadImage(src) {
    const img = new Image();
    img.onload = () => {};
    img.onerror = e => console.error("Failed to load:", src, e);
    img.src = src;
}

function preloadRangeGlobal(fromG, toG) {
    const from = Math.max(1, fromG);
    const to = Math.min(TOTAL_GLOBAL_PAGES, toG);
    for (let g = from; g <= to; g++) preloadImage(globalToRealPath(g));
}

function preloadSegmentByIndex(i) {
    if (i < 0 || i >= segments.length) return;
    preloadRangeGlobal(segments[i].start, segments[i].end);
}

function preloadAllLogic() {
    if (!segments.length) return;
    const curInfo = getSegmentForGlobal(currentPage);
    const curIndex = curInfo.index;
    preloadSegmentByIndex(curIndex);
    if (curIndex - 1 >= 0) preloadRangeGlobal(segments[curIndex - 1].end - 1, segments[curIndex - 1].end);
    if (curIndex + 1 < segments.length) preloadRangeGlobal(segments[curIndex + 1].start, Math.min(segments[curIndex + 1].start + 1, segments[curIndex + 1].end));
    for (let i = 0; i < segments.length; i++) {
        if (i === curIndex || i === curIndex - 1 || i === curIndex + 1) continue;
        preloadImage(globalToRealPath(segments[i].start));
    }
}

/* ----------------- Transiciones ----------------- */
function applyFadeOut(img) {
    if (!img) return;
    img.classList.remove("fade-in", "show");
    img.classList.add("fade-out");
}

function applyFadeIn(img) {
    if (!img) return;
    img.classList.remove("fade-out");
    img.classList.add("fade-in");
    setTimeout(() => {
        img.classList.remove("fade-in");
        img.classList.add("show");
    }, 250);
}

/* ----------------- Render ----------------- */
function clamp() { if (currentPage < 1) currentPage = 1; if (currentPage > TOTAL_GLOBAL_PAGES) currentPage = TOTAL_GLOBAL_PAGES; }

function renderPage() {
    clamp();
    const imgs = [left, right];
    imgs.forEach(img => applyFadeOut(img));
    setTimeout(() => {
        if (!doubleView) {
            right.style.display = "none";
            left.src = globalToRealPath(currentPage);
            left.style.display = "block";
        } else {
            right.style.display = "block";
            left.src = globalToRealPath(currentPage);
            right.src = (currentPage + 1 <= TOTAL_GLOBAL_PAGES) ? globalToRealPath(currentPage + 1) : "";
        }
        if (!doubleView) {
            indicator.innerText = `Página ${currentPage}`;
        } else {
            const nextPage = currentPage + 1;
            if (nextPage <= TOTAL_GLOBAL_PAGES) {
                indicator.innerText = `Páginas ${currentPage} – ${nextPage}`;
            } else {
                indicator.innerText = `Página ${currentPage}`;
            }
        }

        setTimeout(() => {
            if (!doubleView) { applyFadeIn(left); } else {
                applyFadeIn(left);
                applyFadeIn(right);
            }
        }, 40);
        preloadAllLogic();
        updateSidebarActive();
    }, 200);
}

/* ----------------- Navegación ----------------- */
document.getElementById("next").onclick = () => {
    currentPage += doubleView ? 2 : 1;
    if (currentPage > TOTAL_GLOBAL_PAGES) currentPage = TOTAL_GLOBAL_PAGES;
    renderPage();
};

document.getElementById("prev").onclick = () => {
    currentPage -= doubleView ? 2 : 1;
    if (currentPage < 1) currentPage = 1;
    renderPage();
};

document.getElementById("toggle-view").onclick = () => {
    doubleView = !doubleView;
    renderPage();
};

/* ----------------- Fullscreen ----------------- */
let fullscreenActive = false;
fullscreenBtn.onclick = () => {
    fullscreenActive = !fullscreenActive;
    if (fullscreenActive) {
        magazineDiv.classList.add("fullscreen");
        fullscreenBtn.innerText = "⤡ Reducir";
        exitBtn.style.display = "block";
    } else {
        magazineDiv.classList.remove("fullscreen");
        fullscreenBtn.innerText = "⤢ Expandir";
        exitBtn.style.display = "none";
    }
};
exitBtn.onclick = () => {
    fullscreenActive = false;
    magazineDiv.classList.remove("fullscreen");
    fullscreenBtn.innerText = "⤢ Expandir";
    exitBtn.style.display = "none";
};

/* click lateral para navegar fullscreen */
magazineDiv.addEventListener("click", (e) => {
    if (!fullscreenActive) return;
    const rect = magazineDiv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) currentPage = Math.max(1, currentPage - (doubleView ? 2 : 1));
    else currentPage = Math.min(TOTAL_GLOBAL_PAGES, currentPage + (doubleView ? 2 : 1));
    renderPage();
});

/* ----------------- Sidebar active ----------------- */
function updateSidebarActive() {
    segments.forEach((seg, i) => {
        const btn = document.getElementById("segment-btn-" + i);
        if (!btn) return;
        if (currentPage >= seg.start && currentPage <= seg.end) btn.classList.add("active");
        else btn.classList.remove("active");
    });
}

/* ----------------- Inicio ----------------- */
renderPage();

/* ----------------- Debug */
window._revistaSegments = segments;
window._revistaTotalPages = TOTAL_GLOBAL_PAGES;
window._revistaCurrent = () => currentPage;

const overlay = document.getElementById("index-overlay");
const openBtn = document.getElementById("open-index");
const closeBtn = document.getElementById("close-index");

function closeIndexOverlay() {
    overlay.classList.add("hidden");
}

openBtn.onclick = () => {
    overlay.classList.remove("hidden");
};

closeBtn.onclick = closeIndexOverlay;

// cerrar tocando afuera del panel
overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeIndexOverlay();
});