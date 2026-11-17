// Elementos del DOM
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileLabel = document.getElementById('file-label');

const stickerWInput = document.getElementById('sticker-w');
const stickerHInput = document.getElementById('sticker-h');
const stickerQtyInput = document.getElementById('sticker-qty');
const stickerGapInput = document.getElementById('sticker-gap');
const blackBgCheckbox = document.getElementById('black-bg');
const btnAddDesign = document.getElementById('btn-add-design');
const btnClearAll = document.getElementById('btn-clear-all');

const designsListEl = document.getElementById('designs-list');
const designGroupCountEl = document.getElementById('design-group-count');

const deliveryTypeSelect = document.getElementById('delivery-type');
const materialSelect = document.getElementById('material-select');
const sheetsQtyInput = document.getElementById('sheets-qty');

const unitSheetPriceEl = document.getElementById('unit-sheet-price');
const totalPriceEl = document.getElementById('total-price');
const perStickerCostEl = document.getElementById('per-sticker-cost');
const discountBadgeRow = document.getElementById('discount-badge-row');
const surchargeRow = document.getElementById('surcharge-row');

const printSheetEl = document.getElementById('print-sheet');
const stickersContainer = document.getElementById('stickers-container');
const sheetTitleDisplay = document.getElementById('sheet-title-display');
const sheetDimsDisplay = document.getElementById('sheet-dims-display');
const placedCounterEl = document.getElementById('placed-counter');
const overflowWarningEl = document.getElementById('overflow-warning');
const btnExportPdf = document.getElementById('btn-export-pdf');

// Estado de la aplicación
let uploadedImageDataUrl = null;
let uploadedFileName = '';
let designGroups = []; // Cada grupo: { id, name, src, w, h, qty, gap, blackBg }

// Escala visual en pantalla (1 cm = 14 px para que Super A3 entre cómodo en pantalla)
const PX_PER_CM = 14;

// Configuración de hojas según las reglas de la imprenta
const SHEET_SPECS = {
    'troquelada': { title: 'Super A3 Troquelada', w: 30, h: 44, label: 'Área útil: 30 × 44 cm' },
    'individuales': { title: 'Stickers Individuales', w: 30, h: 44, label: 'Área útil base: 30 × 44 cm' },
    'lisa-super-a3': { title: 'Super A3 Lisa', w: 32, h: 47, label: 'Medida hoja: 32 × 47 cm' },
    'lisa-a4': { title: 'A4 Lisa', w: 21, h: 29, label: 'Medida hoja: 21 × 29 cm' }
};

// Manejo de subida de archivos (Clic y Drag & Drop)
dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
});

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Por favor seleccioná un archivo de imagen válido (PNG, JPG o WebP).');
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        uploadedImageDataUrl = ev.target.result;
        uploadedFileName = file.name;
        fileLabel.textContent = `✅ ${file.name}`;
    };
    reader.readAsDataURL(file);
}

// Agregar diseño a la lista y plancha
btnAddDesign.addEventListener('click', () => {
    if (!uploadedImageDataUrl) {
        alert('Primero adjuntá una imagen en el paso 01.');
        return;
    }

    const w = parseFloat(stickerWInput.value) || 2.5;
    const h = parseFloat(stickerHInput.value) || 8.0;
    const qty = parseInt(stickerQtyInput.value) || 1;
    const gap = parseFloat(stickerGapInput.value) || 4;
    const blackBg = blackBgCheckbox.checked;

    designGroups.push({
        id: Date.now() + Math.random(),
        name: uploadedFileName || 'Diseño personalizado',
        src: uploadedImageDataUrl,
        w,
        h,
        qty,
        gap,
        blackBg
    });

    renderAll();
});

// Vaciar toda la plancha
btnClearAll.addEventListener('click', () => {
    designGroups = [];
    renderAll();
});

// Cambiar cantidad o eliminar un grupo de diseño
function changeGroupQty(id, delta) {
    const group = designGroups.find(g => g.id === id);
    if (!group) return;
    group.qty += delta;
    if (group.qty <= 0) {
        designGroups = designGroups.filter(g => g.id !== id);
    }
    renderAll();
}

function removeDesignGroup(id) {
    designGroups = designGroups.filter(g => g.id !== id);
    renderAll();
}

// Renderizar lista lateral de diseños
function renderDesignsList() {
    designGroupCountEl.textContent = designGroups.length;

    if (designGroups.length === 0) {
        designsListEl.innerHTML = `<div class="empty-list-msg">Aún no agregaste diseños. Subí una imagen arriba para empezar.</div>`;
        return;
    }

    designsListEl.innerHTML = '';
    designGroups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'design-item-card';
        item.innerHTML = `
            <img src="${group.src}" class="design-thumb" style="background:${group.blackBg ? '#000' : '#fff'}" alt="thumb">
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

// Renderizar la hoja a escala real en el visor
function renderSheetCanvas() {
    const mode = deliveryTypeSelect.value;
    const spec = SHEET_SPECS[mode];

    sheetTitleDisplay.textContent = spec.title;
    sheetDimsDisplay.textContent = spec.label;

    printSheetEl.style.width = `${spec.w * PX_PER_CM}px`;
    printSheetEl.style.height = `${spec.h * PX_PER_CM}px`;
    printSheetEl.querySelector('.sheet-guide-label').textContent = `${spec.title.toUpperCase()} (${spec.w} × ${spec.h} CM)`;

    stickersContainer.innerHTML = '';
    let totalStickers = 0;

    designGroups.forEach(group => {
        const gapPx = (group.gap / 10) * PX_PER_CM;
        stickersContainer.style.gap = `${gapPx}px`;

        for (let i = 0; i < group.qty; i++) {
            totalStickers++;
            const node = document.createElement('div');
            node.className = 'sticker-node';
            node.style.width = `${group.w * PX_PER_CM}px`;
            node.style.height = `${group.h * PX_PER_CM}px`;
            node.style.backgroundColor = group.blackBg ? '#000000' : '#ffffff';

            const img = document.createElement('img');
            img.src = group.src;

            const delBtn = document.createElement('button');
            delBtn.className = 'remove-single-btn';
            delBtn.textContent = '×';
            delBtn.title = 'Eliminar este sticker';
            delBtn.onclick = () => changeGroupQty(group.id, -1);

            node.appendChild(img);
            node.appendChild(delBtn);
            stickersContainer.appendChild(node);
        }
    });

    placedCounterEl.textContent = `${totalStickers} stickers en hoja`;

    // Verificar si los stickers desbordan el alto físico de la hoja
    const isOverflowing = stickersContainer.scrollHeight > stickersContainer.clientHeight + 2;
    overflowWarningEl.style.display = isOverflowing ? 'inline-block' : 'none';

    return totalStickers;
}

// Cálculo exacto de tarifas según reglas del negocio
function updatePricing(totalStickersCount) {
    const mode = deliveryTypeSelect.value;
    const material = materialSelect.value;
    const sheetsQty = Math.max(1, parseInt(sheetsQtyInput.value) || 1);

    let unitPrice = 0;
    let isBulk = sheetsQty >= 2;
    let hasSurcharge = false;

    if (mode === 'lisa-a4') {
        unitPrice = 1300;
        isBulk = false;
    } else if (mode === 'lisa-super-a3') {
        unitPrice = material === 'opp' ? 5500 : 2200;
        isBulk = false;
    } else {
        // Troquelada o Individuales (base Super A3)
        if (material === 'papel') {
            unitPrice = isBulk ? 4000 : 5000;
        } else if (material === 'opp') {
            unitPrice = isBulk ? 6000 : 7000;
        } else {
            // Vinilo
            unitPrice = isBulk ? 8400 : 11200;
        }

        if (mode === 'individuales') {
            unitPrice = Math.round(unitPrice * 1.40);
            hasSurcharge = true;
        }
    }

    const total = unitPrice * sheetsQty;
    const totalStickersAllSheets = totalStickersCount * sheetsQty;
    const costPerSticker = totalStickersAllSheets > 0 ? Math.round(total / totalStickersAllSheets) : 0;

    unitSheetPriceEl.textContent = `$${unitPrice.toLocaleString('es-AR')}`;
    totalPriceEl.textContent = `$${total.toLocaleString('es-AR')}`;
    perStickerCostEl.textContent = totalStickersAllSheets > 0 ? `$${costPerSticker.toLocaleString('es-AR')} c/u` : '$0';

    discountBadgeRow.style.display = (isBulk && (mode === 'troquelada' || mode === 'individuales')) ? 'flex' : 'none';
    surchargeRow.style.display = hasSurcharge ? 'flex' : 'none';
}

function renderAll() {
    renderDesignsList();
    const count = renderSheetCanvas();
    updatePricing(count);
}

// Listeners de cambios de configuración
deliveryTypeSelect.addEventListener('change', renderAll);
materialSelect.addEventListener('change', renderAll);
sheetsQtyInput.addEventListener('input', renderAll);

// Exportar PDF a escala real en centímetros con marcas de corte
btnExportPdf.addEventListener('click', () => {
    if (designGroups.length === 0) {
        alert('Agregá al menos un diseño antes de exportar el PDF.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const mode = deliveryTypeSelect.value;
    const spec = SHEET_SPECS[mode];

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'cm',
        format: [spec.w, spec.h]
    });

    // Margen inicial de 0.8 cm
    const margin = 0.8;
    let cursorX = margin;
    let cursorY = margin;
    let maxRowHeight = 0;

    designGroups.forEach(group => {
        const gapCm = group.gap / 10;

        for (let i = 0; i < group.qty; i++) {
            if (cursorX + group.w > spec.w - margin) {
                cursorX = margin;
                cursorY += maxRowHeight + gapCm;
                maxRowHeight = 0;
            }

            if (cursorY + group.h > spec.h - margin) {
                break; // Evita dibujar fuera de los límites físicos
            }

            if (group.blackBg) {
                doc.setFillColor(0, 0, 0);
                doc.rect(cursorX, cursorY, group.w, group.h, 'F');
            }

            // Insertar imagen a escala exacta
            doc.addImage(group.src, 'PNG', cursorX, cursorY, group.w, group.h);

            // Línea de corte vectorial en magenta (0.1 mm)
            doc.setDrawColor(236, 72, 153);
            doc.setLineWidth(0.01);
            doc.rect(cursorX, cursorY, group.w, group.h, 'S');

            cursorX += group.w + gapCm;
            if (group.h > maxRowHeight) maxRowHeight = group.h;
        }
    });

    doc.save(`Plancha_${spec.w}x${spec.h}cm_Rapibarbe.pdf`);
});

// Inicializar
renderAll();
