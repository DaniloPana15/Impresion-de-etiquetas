// Elementos del DOM
const presetSelect = document.getElementById('preset-select');
const sheetWInput = document.getElementById('sheet-w');
const sheetHInput = document.getElementById('sheet-h');
const sheetMarginInput = document.getElementById('sheet-margin');
const sheetPriceInput = document.getElementById('sheet-price');
const sheetsQtyInput = document.getElementById('sheets-qty');
const cutLinesModeSelect = document.getElementById('cut-lines-mode');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileLabel = document.getElementById('file-label');

const stickerWInput = document.getElementById('sticker-w');
const stickerHInput = document.getElementById('sticker-h');
const stickerQtyInput = document.getElementById('sticker-qty');
const stickerGapInput = document.getElementById('sticker-gap');
const btnSwapDims = document.getElementById('btn-swap-dims');
const btnAddDesign = document.getElementById('btn-add-design');
const btnAutoFill = document.getElementById('btn-auto-fill');
const btnClearAll = document.getElementById('btn-clear-all');

const designsListEl = document.getElementById('designs-list');
const designGroupCountEl = document.getElementById('design-group-count');

const maxCapacityDisplay = document.getElementById('max-capacity-display');
const placedSummaryEl = document.getElementById('placed-summary');
const perStickerCostEl = document.getElementById('per-sticker-cost');
const totalPriceEl = document.getElementById('total-price');

const previewBgModeSelect = document.getElementById('preview-bg-mode');
const printSheetEl = document.getElementById('print-sheet');
const stickersContainer = document.getElementById('stickers-container');
const sheetTitleDisplay = document.getElementById('sheet-title-display');
const sheetDimsDisplay = document.getElementById('sheet-dims-display');
const placedCounterEl = document.getElementById('placed-counter');
const overflowWarningEl = document.getElementById('overflow-warning');

const btnExportPng = document.getElementById('btn-export-png');
const btnExportPdf = document.getElementById('btn-export-pdf');

// Estado
let pendingFiles = []; // { name, src, imgObj }
let designGroups = []; // { id, name, src, imgObj, w, h, qty }

// Perfiles preconfigurados de imprentas
const IMPRENTA_PRESETS = {
    'dtf-palermo-half': {
        title: 'DTF Palermo — Medio Metro',
        w: 57, h: 50, marginMm: 5, price: 10000, cutLines: 'none'
    },
    'dtf-palermo-full': {
        title: 'DTF Palermo — 1 Metro',
        w: 57, h: 100, marginMm: 5, price: 15000, cutLines: 'none'
    },
    'troquelada-a3': {
        title: 'Super A3 Troquelada',
        w: 30, h: 44, marginMm: 8, price: 11200, cutLines: 'magenta'
    },
    'lisa-a4': {
        title: 'A4 Lisa Sin Cortar',
        w: 21, h: 29, marginMm: 5, price: 1300, cutLines: 'none'
    }
};

// Cambio de preset de imprenta
presetSelect.addEventListener('change', () => {
    const val = presetSelect.value;
    if (IMPRENTA_PRESETS[val]) {
        const p = IMPRENTA_PRESETS[val];
        sheetWInput.value = p.w;
        sheetHInput.value = p.h;
        sheetMarginInput.value = p.marginMm;
        sheetPriceInput.value = p.price;
        cutLinesModeSelect.value = p.cutLines;
    }
    renderAll();
});

// Si el usuario edita manualmente medidas o precio, pasar a "custom"
[sheetWInput, sheetHInput, sheetMarginInput, sheetPriceInput].forEach(inp => {
    inp.addEventListener('input', () => {
        presetSelect.value = 'custom';
        renderAll();
    });
});

sheetsQtyInput.addEventListener('input', renderAll);
cutLinesModeSelect.addEventListener('change', renderAll);
stickerGapInput.addEventListener('input', renderAll);
stickerWInput.addEventListener('input', renderAll);
stickerHInput.addEventListener('input', renderAll);

// Cambiar fondo de vista previa
previewBgModeSelect.addEventListener('change', () => {
    printSheetEl.classList.remove('bg-checker', 'bg-black', 'bg-white');
    printSheetEl.classList.add(`bg-${previewBgModeSelect.value}`);
});

// Girar 90° ancho/alto
btnSwapDims.addEventListener('click', () => {
    const tmp = stickerWInput.value;
    stickerWInput.value = stickerHInput.value;
    stickerHInput.value = tmp;
    renderAll();
});

// Subida múltiple de archivos
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => {
    if (e.target.files.length > 0) handleFiles(e.target.files);
});

function handleFiles(fileList) {
    const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
        alert('Seleccioná archivos de imagen válidos (PNG, JPG o WebP).');
        return;
    }

    pendingFiles = [];
    let loadedCount = 0;

    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                pendingFiles.push({
                    name: file.name,
                    src: ev.target.result,
                    imgObj: img
                });
                loadedCount++;
                if (loadedCount === validFiles.length) {
                    fileLabel.textContent = validFiles.length === 1
                        ? `✅ ${validFiles[0].name}`
                        : `✅ ${validFiles.length} diseños listos para agregar`;
                }
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Agregar diseño(s) a la plancha
btnAddDesign.addEventListener('click', () => {
    if (pendingFiles.length === 0) {
        alert('Primero adjuntá al menos una imagen en el paso 02.');
        return;
    }

    const w = Math.max(0.5, parseFloat(stickerWInput.value) || 10);
    const h = Math.max(0.5, parseFloat(stickerHInput.value) || 2);
    const qty = Math.max(1, parseInt(stickerQtyInput.value) || 1);

    pendingFiles.forEach(pf => {
        designGroups.push({
            id: Date.now() + Math.random(),
            name: pf.name,
            src: pf.src,
            imgObj: pf.imgObj,
            w,
            h,
            qty
        });
    });

    renderAll();
});

// Calcular distribución exacta en grilla (posiciones en cm)
function computeLayout() {
    const sheetW = Math.max(5, parseFloat(sheetWInput.value) || 57);
    const sheetH = Math.max(5, parseFloat(sheetHInput.value) || 50);
    const marginCm = (parseFloat(sheetMarginInput.value) || 0) / 10;
    const gapCm = (parseFloat(stickerGapInput.value) || 4) / 10;

    const placedItems = [];
    let overflowCount = 0;

    let cursorX = marginCm;
    let cursorY = marginCm;
    let maxRowH = 0;

    designGroups.forEach(group => {
        for (let i = 0; i < group.qty; i++) {
            if (cursorX + group.w > sheetW - marginCm + 0.001) {
                cursorX = marginCm;
                cursorY += maxRowH + gapCm;
                maxRowH = 0;
            }

            if (cursorY + group.h > sheetH - marginCm + 0.001) {
                overflowCount++;
                continue;
            }

            placedItems.push({
                groupId: group.id,
                src: group.src,
                imgObj: group.imgObj,
                x: cursorX,
                y: cursorY,
                w: group.w,
                h: group.h
            });

            cursorX += group.w + gapCm;
            if (group.h > maxRowH) maxRowH = group.h;
        }
    });

    // Calcular capacidad máxima teórica usando la medida actual del input
    const refW = Math.max(0.5, parseFloat(stickerWInput.value) || 10);
    const refH = Math.max(0.5, parseFloat(stickerHInput.value) || 2);
    const usableW = Math.max(0, sheetW - marginCm * 2);
    const usableH = Math.max(0, sheetH - marginCm * 2);
    const cols = Math.floor((usableW + gapCm) / (refW + gapCm));
    const rows = Math.floor((usableH + gapCm) / (refH + gapCm));
    const maxCapacity = Math.max(0, cols * rows);

    return { sheetW, sheetH, placedItems, overflowCount, maxCapacity };
}

// Llenar hoja automáticamente repartiendo en partes iguales
btnAutoFill.addEventListener('click', () => {
    if (designGroups.length === 0) {
        alert('Primero agregá tus diseños a la lista.');
        return;
    }

    const sheetW = Math.max(5, parseFloat(sheetWInput.value) || 57);
    const sheetH = Math.max(5, parseFloat(sheetHInput.value) || 50);
    const marginCm = (parseFloat(sheetMarginInput.value) || 0) / 10;
    const gapCm = (parseFloat(stickerGapInput.value) || 4) / 10;

    const first = designGroups[0];
    const usableW = sheetW - marginCm * 2;
    const usableH = sheetH - marginCm * 2;
    const cols = Math.floor((usableW + gapCm) / (first.w + gapCm));
    const rows = Math.floor((usableH + gapCm) / (first.h + gapCm));
    const totalSlots = Math.max(1, cols * rows);

    const perGroup = Math.floor(totalSlots / designGroups.length);
    let remainder = totalSlots % designGroups.length;

    designGroups.forEach(g => {
        g.qty = perGroup + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
    });

    renderAll();
});

btnClearAll.addEventListener('click', () => {
    designGroups = [];
    renderAll();
});

window.changeGroupQty = function(id, delta) {
    const group = designGroups.find(g => g.id === id);
    if (!group) return;
    group.qty += delta;
    if (group.qty <= 0) {
        designGroups = designGroups.filter(g => g.id !== id);
    }
    renderAll();
};

window.removeDesignGroup = function(id) {
    designGroups = designGroups.filter(g => g.id !== id);
    renderAll();
};

function renderDesignsList() {
    designGroupCountEl.textContent = designGroups.length;
    if (designGroups.length === 0) {
        designsListEl.innerHTML = `<div class="empty-list-msg">Aún no agregaste etiquetas. Subí tus PNG arriba.</div>`;
        return;
    }

    designsListEl.innerHTML = '';
    designGroups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'design-item-card';
        item.innerHTML = `
            <img src="${group.src}" class="design-thumb" alt="thumb">
            <div class="design-meta">
                <strong title="${group.name}">${group.name}</strong>
                <span>${group.w} × ${group.h} cm • <strong>${group.qty} u.</strong></span>
            </div>
            <div class="design-actions">
                <button class="qty-mini-btn" onclick="changeGroupQty(${group.id}, -1)">-</button>
                <button class="qty-mini-btn" onclick="changeGroupQty(${group.id}, 1)">+</button>
                <button class="delete-group-btn" title="Eliminar diseño" onclick="removeDesignGroup(${group.id})">✕</button>
            </div>
        `;
        designsListEl.appendChild(item);
    });
}

function renderAll() {
    renderDesignsList();
    const { sheetW, sheetH, placedItems, overflowCount, maxCapacity } = computeLayout();

    const presetTitle = presetSelect.value === 'custom'
        ? 'Pliego Personalizado'
        : IMPRENTA_PRESETS[presetSelect.value].title;

    sheetTitleDisplay.textContent = presetTitle;
    sheetDimsDisplay.textContent = `${sheetW} × ${sheetH} cm`;

    // Escala visual adaptativa para que el pliego quepa cómodo en pantalla
    const maxVisualWidth = 680;
    const pxPerCm = Math.min(12, maxVisualWidth / sheetW);

    printSheetEl.style.width = `${sheetW * pxPerCm}px`;
    printSheetEl.style.height = `${sheetH * pxPerCm}px`;
    printSheetEl.querySelector('.sheet-guide-label').textContent = `PLIEGO REAL (${sheetW} × ${sheetH} CM)`;

    stickersContainer.innerHTML = '';
    const showCutLines = cutLinesModeSelect.value === 'magenta';

    placedItems.forEach(item => {
        const node = document.createElement('div');
        node.className = 'sticker-node';
        node.style.position = 'absolute';
        node.style.left = `${item.x * pxPerCm}px`;
        node.style.top = `${item.y * pxPerCm}px`;
        node.style.width = `${item.w * pxPerCm}px`;
        node.style.height = `${item.h * pxPerCm}px`;
        node.style.border = showCutLines ? '1px dashed #ec4899' : '1px dashed rgba(148, 163, 184, 0.35)';

        const img = document.createElement('img');
        img.src = item.src;

        const delBtn = document.createElement('button');
        delBtn.className = 'remove-single-btn';
        delBtn.textContent = '×';
        delBtn.onclick = () => changeGroupQty(item.groupId, -1);

        node.appendChild(img);
        node.appendChild(delBtn);
        stickersContainer.appendChild(node);
    });

    // Actualizar contadores y cotización
    const sheetsQty = Math.max(1, parseInt(sheetsQtyInput.value) || 1);
    const unitSheetPrice = Math.max(0, parseFloat(sheetPriceInput.value) || 0);
    const totalMoney = unitSheetPrice * sheetsQty;
    const totalPlacedAllSheets = placedItems.length * sheetsQty;
    const costPerUnit = totalPlacedAllSheets > 0 ? Math.round(totalMoney / totalPlacedAllSheets) : 0;

    maxCapacityDisplay.textContent = `${maxCapacity} u. (${sheetW}×${sheetH} cm)`;
    placedSummaryEl.textContent = `${placedItems.length} u. por paño`;
    placedCounterEl.textContent = `${placedItems.length} en hoja`;
    perStickerCostEl.textContent = totalPlacedAllSheets > 0 ? `$${costPerUnit.toLocaleString('es-AR')} c/u` : '$0';
    totalPriceEl.textContent = `$${totalMoney.toLocaleString('es-AR')}`;

    if (overflowCount > 0) {
        overflowWarningEl.style.display = 'inline-block';
        overflowWarningEl.textContent = `⚠️ ${overflowCount} etiquetas quedaron fuera (no entran en ${sheetW}×${sheetH} cm)`;
    } else {
        overflowWarningEl.style.display = 'none';
    }
}

// Helper para dibujar imagen manteniendo proporción real centrada
function drawImageContain(ctx, img, x, y, boxW, boxH) {
    const imgRatio = img.width / img.height;
    const boxRatio = boxW / boxH;
    let drawW = boxW;
    let drawH = boxH;

    if (imgRatio > boxRatio) {
        drawH = boxW / imgRatio;
    } else {
        drawW = boxH * imgRatio;
    }

    const offsetX = x + (boxW - drawW) / 2;
    const offsetY = y + (boxH - drawH) / 2;
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
}

// EXPORTAR PNG TRANSPARENTE A 300 DPI REALES (Ideal DTF Palermo / DTF UV)
btnExportPng.addEventListener('click', () => {
    const { sheetW, sheetH, placedItems } = computeLayout();
    if (placedItems.length === 0) {
        alert('Agregá al menos una etiqueta antes de exportar.');
        return;
    }

    // 300 DPI = 118.110236 píxeles por centímetro
    const PX_PER_CM_300DPI = 300 / 2.54;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sheetW * PX_PER_CM_300DPI);
    canvas.height = Math.round(sheetH * PX_PER_CM_300DPI);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Fondo 100% transparente

    const drawCut = cutLinesModeSelect.value === 'magenta';

    placedItems.forEach(item => {
        const xPx = item.x * PX_PER_CM_300DPI;
        const yPx = item.y * PX_PER_CM_300DPI;
        const wPx = item.w * PX_PER_CM_300DPI;
        const hPx = item.h * PX_PER_CM_300DPI;

        drawImageContain(ctx, item.imgObj, xPx, yPx, wPx, hPx);

        if (drawCut) {
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 2;
            ctx.strokeRect(xPx, yPx, wPx, hPx);
        }
    });

    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Pliego_DTF_UV_${sheetW}x${sheetH}cm_300DPI_${placedItems.length}u.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
});

// EXPORTAR PDF A ESCALA REAL EN CM
btnExportPdf.addEventListener('click', () => {
    const { sheetW, sheetH, placedItems } = computeLayout();
    if (placedItems.length === 0) {
        alert('Agregá al menos una etiqueta antes de exportar.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: sheetW > sheetH ? 'landscape' : 'portrait',
        unit: 'cm',
        format: [sheetW, sheetH]
    });

    const drawCut = cutLinesModeSelect.value === 'magenta';

    placedItems.forEach(item => {
        const imgRatio = item.imgObj.width / item.imgObj.height;
        const boxRatio = item.w / item.h;
        let drawW = item.w;
        let drawH = item.h;

        if (imgRatio > boxRatio) {
            drawH = item.w / imgRatio;
        } else {
            drawW = item.h * imgRatio;
        }

        const offsetX = item.x + (item.w - drawW) / 2;
        const offsetY = item.y + (item.h - drawH) / 2;

        doc.addImage(item.src, 'PNG', offsetX, offsetY, drawW, drawH);

        if (drawCut) {
            doc.setDrawColor(236, 72, 153);
            doc.setLineWidth(0.01);
            doc.rect(item.x, item.y, item.w, item.h, 'S');
        }
    });

    doc.save(`Pliego_${sheetW}x${sheetH}cm_${placedItems.length}u.pdf`);
});

// Inicializar
renderAll();
