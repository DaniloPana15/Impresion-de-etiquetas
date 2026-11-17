// Referencias de elementos DOM
const sheetTypeSelect = document.getElementById('sheet-type');
const materialTypeSelect = document.getElementById('material-type');
const finishTypeSelect = document.getElementById('finish-type');
const quantitySheetsInput = document.getElementById('quantity-sheets');

const widthSlider = document.getElementById('sticker-width');
const heightSlider = document.getElementById('sticker-height');
const spacingSlider = document.getElementById('sticker-spacing');
const valWidth = document.getElementById('val-width');
const valHeight = document.getElementById('val-height');
const valSpacing = document.getElementById('val-spacing');

const uploadImageInput = document.getElementById('upload-image');
const btnAddSticker = document.getElementById('btn-add-sticker');
const btnClearCanvas = document.getElementById('btn-clear-canvas');
const printCanvasArea = document.getElementById('print-canvas-area');
const canvasDimsText = document.getElementById('canvas-dims-text');
const itemsCountText = document.getElementById('items-count');
const blackBgToggle = document.getElementById('black-background-toggle');

const priceUnitText = document.getElementById('price-unit');
const quoteQtyText = document.getElementById('quote-qty');
const priceTotalText = document.getElementById('price-total');
const btnExportPdf = document.getElementById('btn-export-pdf');

// Estado interno
let currentImageSrc = "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300";
let placedStickers = [];

// Actualizar etiquetas de rangos
widthSlider.addEventListener('input', () => valWidth.textContent = widthSlider.value);
heightSlider.addEventListener('input', () => valHeight.textContent = heightSlider.value);
spacingSlider.addEventListener('input', () => valSpacing.textContent = spacingSlider.value);

// Selección de plantillas rápidas
document.querySelectorAll('.btn-template').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentImageSrc = e.target.getAttribute('data-img');
        alert("¡Plantilla seleccionada! Haz clic en 'Agregar a la Plancha'.");
    });
});

// Carga de archivo propio
uploadImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImageSrc = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Lógica de cálculo de precios basada en tus reglas
function updatePricing() {
    let basePrice = 11200; // Por defecto Vinilo troquelado Super A3
    const sheetVal = sheetTypeSelect.value;
    const materialVal = materialTypeSelect.value;
    const finishVal = finishTypeSelect.value;

    if (sheetVal === 'a4-lisa') {
        basePrice = 1300;
    } else if (sheetVal === 'super-a3-lisa') {
        if (materialVal === 'comun') basePrice = 2200;
        else if (materialVal === 'opp') basePrice = 5500;
        else basePrice = 5500;
    } else if (sheetVal === 'super-a3-troquelada') {
        if (materialVal === 'comun') basePrice = 5000;
        else if (materialVal === 'opp') basePrice = 7000;
        else basePrice = 11200;
    }

    // Recargo del 40% si es sticker individual
    if (finishVal === 'individuales') {
        basePrice = basePrice * 1.4;
    }

    const qty = parseInt(quantitySheetsInput.value) || 1;
    let total = basePrice * qty;

    priceUnitText.textContent = `$${Math.round(basePrice).toLocaleString()}`;
    quoteQtyText.textContent = `${qty} plancha(s)`;
    priceTotalText.textContent = `$${Math.round(total).toLocaleString()}`;
}

sheetTypeSelect.addEventListener('change', updatePricing);
materialTypeSelect.addEventListener('change', updatePricing);
finishTypeSelect.addEventListener('change', updatePricing);
quantitySheetsInput.addEventListener('input', updatePricing);

// Simulación de acomodo automático en grilla dentro de la hoja
function renderCanvasGrid() {
    printCanvasArea.innerHTML = '';
    
    if (placedStickers.length === 0) {
        printCanvasArea.innerHTML = `<div id="canvas-placeholder-text">Tu plancha está vacía.<br>Sube una imagen o usa una plantilla.</div>`;
        itemsCountText.textContent = `0 stickers colocados`;
        return;
    }

    itemsCountText.textContent = `${placedStickers.length} stickers colocados`;

    const areaWidth = printCanvasArea.clientWidth;
    const areaHeight = printCanvasArea.clientHeight;

    const wCm = parseFloat(widthSlider.value);
    const hCm = parseFloat(heightSlider.value);
    const spacingPx = parseInt(spacingSlider.value) * 2; // escala visual

    // Conversión aproximada cm a px para vista previa
    const pxPerCm = 15;
    const wPx = wCm * pxPerCm;
    const hPx = hCm * pxPerCm;

    let currentX = 10;
    let currentY = 10;

    placedStickers.forEach((sticker, index) => {
        if (currentX + wPx > areaWidth - 10) {
            currentX = 10;
            currentY += hPx + spacingPx;
        }

        if (currentY + hPx > areaHeight - 10) return; // Fuera de área visual

        const div = document.createElement('div');
        div.className = 'virtual-sticker';
        div.style.width = `${wPx}px`;
        div.style.height = `${hPx}px`;
        div.style.left = `${currentX}px`;
        div.style.top = `${currentY}px`;
        if (blackBgToggle.checked) {
            div.style.backgroundColor = '#000';
        }

        const img = document.createElement('img');
        img.src = sticker.src;
        div.appendChild(img);

        printCanvasArea.appendChild(div);
        currentX += wPx + spacingPx;
    });
}

// Botón Agregar Sticker
btnAddSticker.addEventListener('click', () => {
    // Agregamos en lote una tanda aproximada según el tamaño (ej: 24 u 48)
    const countToAdd = parseFloat(widthSlider.value) <= 5 ? 24 : 12;
    for(let i=0; i<countToAdd; i++) {
        placedStickers.push({ src: currentImageSrc });
    }
    renderCanvasGrid();
});

// Botón Limpiar
btnClearCanvas.addEventListener('click', () => {
    placedStickers = [];
    renderCanvasGrid();
});

blackBgToggle.addEventListener('change', renderCanvasGrid);

// Exportar a PDF Real usando jsPDF
btnExportPdf.addEventListener('click', () => {
    if (placedStickers.length === 0) {
        alert("Agrega al menos un sticker a la plancha antes de exportar el PDF.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'cm',
        format: [44, 30] // Formato área útil Super A3 (30x44 cm)
    });

    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 44, 30, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("STICKERPRESS PRO - PLANCHA DE PRODUCCION", 2, 2);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de stickers en plancha: ${placedStickers.length}`, 2, 3);
    doc.text(`Medida unitaria: ${widthSlider.value} x ${heightSlider.value} cm`, 2, 3.6);

    // Dibujar marcas de corte vectoriales en magenta simuladas en el PDF
    doc.setDrawColor(255, 0, 255);
    doc.setLineWidth(0.02);
    doc.rect(1, 4.5, 42, 24); // Margen de corte útil

    doc.save("Plancha_Stickers_Rapibarbe.pdf");
});

// Inicializar cotización al cargar
updatePricing();
