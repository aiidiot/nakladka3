// Główne zmienne
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    // Podstawowe elementy
    const overlayContainer = document.getElementById('overlayContainer');
    const shadow = document.getElementById('shadow');
    const mainImage = document.getElementById('mainImage');
    const overlayImage = document.getElementById('overlayImage');
    const editorContainer = document.getElementById('editorContainer');

    // Elementy sterujące
    const mainImageInput = document.getElementById('mainImageInput');
    const overlayImageInput = document.getElementById('overlayImageInput');
    const mainImageLink = document.getElementById('mainImageLink');
    const overlayImageLink = document.getElementById('overlayImageLink');
    const overlayLibrary = document.getElementById('overlayLibrary');
    const borderColorInput = document.getElementById('borderColor');
    const colorPresets = document.querySelectorAll('.color-btn');
    const shapeButtons = document.querySelectorAll('.btn[data-shape]');
    const shadowToggle = document.getElementById('shadowToggle');

    // Dodajemy kontrolkę wyboru rozmiaru obrazu
    const editorSizeControl = createEditorSizeControl();
    const controlsContainer = document.querySelector('.controls') || document.body;
    controlsContainer.appendChild(editorSizeControl);

    // Funkcja tworząca kontrolkę wyboru rozmiaru edytora
    function createEditorSizeControl() {
        const container = document.createElement('div');
        container.className = 'control-group';
        
        const label = document.createElement('label');
        label.textContent = 'Rozmiar obrazu:';
        container.appendChild(label);
        
        const select = document.createElement('select');
        select.id = 'editorSizeSelect';
        
        const options = [
            { value: 'current', text: 'Aktualny' },
            { value: 'cms', text: '1620x1000 (CMS)' }
        ];
        
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });
        
        container.appendChild(select);
        
        select.addEventListener('change', function() {
            updateEditorSize(this.value);
        });
        
        return container;
    }

    // Funkcja aktualizująca rozmiar edytora
    function updateEditorSize(sizeOption) {
        if (sizeOption === 'cms') {
            editorContainer.style.width = '1620px';
            editorContainer.style.height = '1000px';
            editorContainer.style.aspectRatio = '1620/1000';
        } else {
            // Przywróć domyślne wartości lub bieżące ustawienia
            editorContainer.style.width = '';
            editorContainer.style.height = '';
            editorContainer.style.aspectRatio = '';
        }
        
        // Aktualizacja pozycji elementów po zmianie rozmiaru
        centerMainImage();
        updateShadow();
    }

    // Funkcja centrowania głównego obrazu
    function centerMainImage() {
        // Resetujemy transformację, aby obraz był wyśrodkowany
        const currentScale = mainImageScale.value / 100;
        mainImage.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
    }

    // Funkcja inicjalizacji cienia - zawsze włączony
    function initializeShadow() {
        shadow.style.position = 'absolute';
        shadow.style.backgroundColor = 'rgba(0, 0, 0, 0.66)';
        shadow.style.filter = 'blur(10px)';
        shadow.style.display = 'block';
        shadow.className = overlayContainer.className;
        updateShadow();
        shadowToggle.checked = true;
    }

    // Funkcja aktualizacji cienia
    function updateShadow() {
        const borderWidth = parseInt(getComputedStyle(overlayContainer).borderWidth);
        
        if (overlayContainer.classList.contains('sklejka')) {
            // Logika dla sklejki
            shadow.style.width = (overlayContainer.offsetWidth + borderWidth * 2) + 'px';
            shadow.style.height = (overlayContainer.offsetHeight + borderWidth * 2) + 'px';
            shadow.style.left = (overlayContainer.offsetLeft - borderWidth) + 'px';
            shadow.style.top = (overlayContainer.offsetTop - borderWidth) + 'px';
            shadow.classList.add('sklejka');
            shadow.classList.remove('skos');
        } 
        else if (overlayContainer.classList.contains('skos')) {
            // Pozycjonowanie cienia dla skosu - dokładnie na granicy podziału
            shadow.classList.add('skos');
            shadow.classList.remove('sklejka');
            shadow.style.width = '8px';
            shadow.style.height = '120%';
            shadow.style.left = '50.5%'; // Ustawiamy na środku
            shadow.style.transform = 'translateX(-49%) rotate(8deg)'; // Centrujemy i obracamy
            shadow.style.top = '-10%';
            shadow.style.backgroundColor = 'rgba(0, 0, 0, 0.92)';
            shadow.style.filter = 'blur(9px)';
        } 
        else {
            // Standardowa logika dla pozostałych kształtów
            shadow.style.width = (overlayContainer.offsetWidth + borderWidth * 2) + 'px';
            shadow.style.height = (overlayContainer.offsetHeight + borderWidth * 2) + 'px';
            shadow.style.left = (overlayContainer.offsetLeft - borderWidth) + 'px';
            shadow.style.top = (overlayContainer.offsetTop - borderWidth) + 'px';
            shadow.classList.remove('sklejka', 'skos');
        }

        // Upewniamy się, że główny element jest zawsze nad cieniem
        overlayContainer.style.zIndex = '6';
        shadow.style.zIndex = '5';
    }
       
    // Funkcja do ustawiania stylów obrazu nakładki
    function setupOverlayImage(imgElement) {
        // Czekamy na załadowanie obrazu
        imgElement.onload = function() {
            const container = overlayContainer;
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;
            const imgWidth = this.naturalWidth;
            const imgHeight = this.naturalHeight;

            // Obliczamy skalę, aby obraz zmieścił się w całości
            const scale = Math.min(containerWidth / imgWidth, containerHeight / imgHeight);
            
            imgElement.style.width = '100%';
            imgElement.style.height = '100%';
            imgElement.style.objectFit = 'contain'; // Zmiana z 'cover' na 'contain'
            imgElement.style.position = 'absolute';
            imgElement.style.top = '0';
            imgElement.style.left = '0';
            imgElement.style.bottom = '0';
            imgElement.style.right = '0'
            
            // Ustawiamy skalę w kontrolce
            if (overlayImageScale) {
                overlayImageScale.value = Math.round(scale * 100);
                const event = new Event('input');
                overlayImageScale.dispatchEvent(event);
            }
        };
    }

    // Przeciąganie nakładki
    function dragStart(e) {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === overlayContainer || overlayContainer.contains(e.target)) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, overlayContainer);
            if (shadow.style.display === 'block') {
                setTranslate(currentX + 3, currentY + 3, shadow);
            }
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        const currentRotation = rotationAngleInput.value || '0';
        
        if (el === overlayContainer) {
            el.style.transform = `translate(${xPos}px, ${yPos}px) rotate(${currentRotation}deg)`;
            if (shadow.style.display === 'block') {
                shadow.style.transform = `translate(${xPos + 3}px, ${yPos + 3}px) rotate(${currentRotation}deg)`;
            }
        }
    }

    // Dodawanie listenerów dla drag & drop
    overlayContainer.addEventListener('touchstart', dragStart, false);
    overlayContainer.addEventListener('touchend', dragEnd, false);
    overlayContainer.addEventListener('touchmove', drag, false);

    overlayContainer.addEventListener('mousedown', dragStart, false);
    document.addEventListener('mousemove', drag, false);
    document.addEventListener('mouseup', dragEnd, false);
    
    // Obsługa zdjęć
    mainImageInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                mainImage.src = e.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
            mainImageLink.value = '';
        }
    });

    overlayImageInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                overlayImage.src = e.target.result;
                setupOverlayImage(overlayImage);
            };
            reader.readAsDataURL(e.target.files[0]);
            overlayImageLink.value = '';
            overlayLibrary.value = 'custom';
        }
    });

    // Obsługa kolorów
    borderColorInput.addEventListener('input', function() {
        overlayContainer.style.borderColor = this.value;
    });

    colorPresets.forEach(btn => {
        btn.addEventListener('click', function() {
            const color = this.dataset.color;
            borderColorInput.value = color;
            overlayContainer.style.borderColor = color;
        });
    });

    // Obsługa kształtów
    shapeButtons.forEach(button => {
        button.addEventListener('click', function() {
            shapeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const shape = this.dataset.shape;
            overlayContainer.className = shape;
            if (shadow.style.display === 'block') {
                shadow.className = shape;
                updateShadow();
            }
        });
    });

    // Obsługa grubości ramki
    const borderWidthInput = document.getElementById('borderWidth');
    const borderWidthNumberInput = document.getElementById('borderWidthInput');

    function updateBorderWidth(value) {
        overlayContainer.style.borderWidth = `${value}px`;
        borderWidthInput.value = value;
        borderWidthNumberInput.value = value;
        updateShadow();
    }

    borderWidthInput.addEventListener('input', () => {
        updateBorderWidth(borderWidthInput.value);
    });

    borderWidthNumberInput.addEventListener('input', () => {
        updateBorderWidth(borderWidthNumberInput.value);
    });
    
    // Obsługa rozmiaru
    const overlaySizeInput = document.getElementById('overlaySize');
    const overlaySizeNumberInput = document.getElementById('overlaySizeInput');

    function updateOverlaySize(value) {
        if (!overlayContainer.classList.contains('sklejka') && !overlayContainer.classList.contains('skos')) {
            overlayContainer.style.width = `${value}px`;
            overlayContainer.style.height = `${value}px`;
            updateShadow();
        }
        overlaySizeInput.value = value;
        overlaySizeNumberInput.value = value;
    }

    overlaySizeInput.addEventListener('input', () => {
        updateOverlaySize(overlaySizeInput.value);
    });

    overlaySizeNumberInput.addEventListener('input', () => {
        updateOverlaySize(overlaySizeNumberInput.value);
    });

    // Obsługa obrotu
    const rotationAngleInput = document.getElementById('rotationAngle');
    const rotationAngleNumberInput = document.getElementById('rotationAngleInput');
    const rotateLeft = document.getElementById('rotateLeft');
    const rotateRight = document.getElementById('rotateRight');

    function updateRotation(value) {
        // Get current translation values if they exist
        const currentTransform = overlayContainer.style.transform || '';
        const translateMatch = currentTransform.match(/translate\(([-\d.]+px),\s*([-\d.]+px)\)/);
        const translateX = translateMatch ? translateMatch[1] : '0px';
        const translateY = translateMatch ? translateMatch[2] : '0px';

        // Apply both rotation and translation to overlayContainer
        overlayContainer.style.transform = `translate(${translateX}, ${translateY}) rotate(${value}deg)`;
        
        // Update shadow rotation
        if (shadow.style.display === 'block') {
            const shadowTranslateMatch = shadow.style.transform.match(/translate\(([-\d.]+px),\s*([-\d.]+px)\)/);
            const shadowTranslateX = shadowTranslateMatch ? shadowTranslateMatch[1] : '0px';
            const shadowTranslateY = shadowTranslateMatch ? shadowTranslateMatch[2] : '0px';
            shadow.style.transform = `translate(${shadowTranslateX}, ${shadowTranslateY}) rotate(${value}deg)`;
        }
        
        // Update input values
        rotationAngleInput.value = value;
        rotationAngleNumberInput.value = value;
    }

    function rotateBy(degrees) {
        const currentRotation = parseInt(rotationAngleInput.value) || 0;
        let newRotation = currentRotation + degrees;
        newRotation = ((newRotation % 360) + 360) % 360;
        updateRotation(newRotation);
    }

    rotationAngleInput.addEventListener('input', () => {
        updateRotation(rotationAngleInput.value);
    });

    rotationAngleNumberInput.addEventListener('input', () => {
        updateRotation(rotationAngleNumberInput.value);
    });

    rotateLeft.addEventListener('click', () => rotateBy(-10));
    rotateRight.addEventListener('click', () => rotateBy(10));
    
    // Obsługa cienia
    shadowToggle.addEventListener('change', () => {
        if (shadowToggle.checked) {
            shadow.style.display = 'block';
            initializeShadow();
            updateShadow();
        } else {
            shadow.style.display = 'none';
        }
    });

    // Obsługa skalowania
    const mainImageScale = document.getElementById('mainImageScale');
    const overlayImageScale = document.getElementById('overlayImageScale');

    mainImageScale.addEventListener('input', function() {
        const scale = this.value / 100;
        mainImage.style.transform = `translate(-50%, -50%) scale(${scale})`;
        this.nextElementSibling.textContent = `${this.value}%`;
    });

    overlayImageScale.addEventListener('input', function() {
        const scale = this.value / 100;
        const currentRotation = rotationAngleInput.value;
        overlayImage.style.transform = `rotate(${currentRotation}deg) scale(${scale})`;
        this.nextElementSibling.textContent = `${this.value}%`;
    });

    // Obsługa przycisku autodopasowania
    const autoFitBtn = document.getElementById('autoFitBtn');
    autoFitBtn.addEventListener('click', () => {
        const containerWidth = mainImage.parentElement.offsetWidth;
        const containerHeight = mainImage.parentElement.offsetHeight;
        const imgWidth = mainImage.naturalWidth;
        const imgHeight = mainImage.naturalHeight;
        
        const scale = Math.min(containerWidth / imgWidth, containerHeight / imgHeight);
        
        mainImageScale.value = Math.round(scale * 100);
        mainImage.style.transform = `translate(-50%, -50%) scale(${scale})`;
        mainImageScale.nextElementSibling.textContent = `${Math.round(scale * 100)}%`;
    });

    // Obsługa URL obrazów
    mainImageLink.addEventListener('input', function() {
        if (this.value.trim()) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function() {
                mainImage.src = this.src;
            };
            img.src = this.value.trim();
        }
    });

    overlayImageLink.addEventListener('input', function() {
        if (this.value.trim()) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function() {
                overlayImage.src = this.src;
                setupOverlayImage(overlayImage);
            };
            img.src = this.value.trim();
            overlayLibrary.value = 'custom';
        }
    });
    
    // Obsługa biblioteki nakładek
    overlayLibrary.addEventListener('change', function() {
        if (this.value !== 'custom') {
            const baseUrl = 'https://raw.githubusercontent.com/aiidiot/nakladka/main/';
            const overlayUrl = baseUrl + this.value;
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function() {
                overlayImage.src = this.src;
                setupOverlayImage(overlayImage);
            };
            img.src = overlayUrl;
            overlayImageInput.value = '';
            overlayImageLink.value = '';
        }
    });

    // Obsługa zapisywania
    const saveAsBtn = document.getElementById('saveAsBtn');
    saveAsBtn.addEventListener('click', () => {
        // Sprawdzamy aktualny wybrany rozmiar
        const selectedSize = document.getElementById('editorSizeSelect').value;
        
        // Zapisujemy obecny rozmiar
        const originalWidth = editorContainer.style.width;
        const originalHeight = editorContainer.style.height;
        const originalAspectRatio = editorContainer.style.aspectRatio;
        
        // Jeśli wybrano rozmiar CMS, upewniamy się, że container ma dokładnie 1620x1000
        if (selectedSize === 'cms' && (editorContainer.offsetWidth !== 1620 || editorContainer.offsetHeight !== 1000)) {
            editorContainer.style.width = '1620px';
            editorContainer.style.height = '1000px';
            editorContainer.style.aspectRatio = '1620/1000';
        }
        
        // Generujemy obraz
        domtoimage.toBlob(editorContainer)
            .then(function(blob) {
                const link = document.createElement('a');
                const fileName = selectedSize === 'cms' ? 'edited-image-1620x1000.png' : 'edited-image.png';
                link.download = fileName;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
                
                // Przywracamy oryginalny rozmiar
                if (originalWidth !== editorContainer.style.width || originalHeight !== editorContainer.style.height) {
                    editorContainer.style.width = originalWidth;
                    editorContainer.style.height = originalHeight;
                    editorContainer.style.aspectRatio = originalAspectRatio;
                }
            });
    });

    // Obsługa kopiowania do schowka
    const copyToClipboardBtn = document.getElementById('copyToClipboardBtn');
    copyToClipboardBtn.addEventListener('click', () => {
        // Sprawdzamy aktualny wybrany rozmiar
        const selectedSize = document.getElementById('editorSizeSelect').value;
        
        // Zapisujemy obecny rozmiar
        const originalWidth = editorContainer.style.width;
        const originalHeight = editorContainer.style.height;
        const originalAspectRatio = editorContainer.style.aspectRatio;
        
        // Jeśli wybrano rozmiar CMS, upewniamy się, że container ma dokładnie 1620x1000
        if (selectedSize === 'cms' && (editorContainer.offsetWidth !== 1620 || editorContainer.offsetHeight !== 1000)) {
            editorContainer.style.width = '1620px';
            editorContainer.style.height = '1000px';
            editorContainer.style.aspectRatio = '1620/1000';
        }
        
        domtoimage.toBlob(editorContainer)
            .then(function(blob) {
                navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]).then(function() {
                    alert('Skopiowano do schowka!');
                    
                    // Przywracamy oryginalny rozmiar
                    if (originalWidth !== editorContainer.style.width || originalHeight !== editorContainer.style.height) {
                        editorContainer.style.width = originalWidth;
                        editorContainer.style.height = originalHeight;
                        editorContainer.style.aspectRatio = originalAspectRatio;
                    }
                });
            });
    });

    // Funkcje obsługi szablonów
    function loadSavedTemplates() {
        const select = document.getElementById('templateSelect');
        select.innerHTML = '<option value="default">Możesz wskazać zapisany przez siebie szablon</option>';
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('template_')) {
                const templateName = key.replace('template_', '');
                const option = new Option(templateName, templateName);
                select.add(option);
            }
        }
    }

    function getCurrentSettings() {
        return {
            shape: overlayContainer.className,
            overlaySize: overlayContainer.style.width,
            borderWidth: overlayContainer.style.borderWidth,
            borderColor: overlayContainer.style.borderColor,
            position: {
                x: xOffset,
                y: yOffset
            },
            rotation: rotationAngleInput.value,
            shadow: true,
            overlayScale: overlayImageScale.value,
            editorSize: document.getElementById('editorSizeSelect').value // Dodajemy zachowanie aktualnego rozmiaru
        };
    }
    
    // Funkcja aplikująca zapisane ustawienia
    function applySettings(settings) {
        // Przywracanie kształtu
        overlayContainer.className = settings.shape;
        shadow.className = settings.shape;

        // Przywracanie rozmiaru
        if (!settings.shape.includes('sklejka') && !settings.shape.includes('skos')) {
            overlayContainer.style.width = settings.overlaySize;
            overlayContainer.style.height = settings.overlaySize;
        }

        // Przywracanie ramki
        overlayContainer.style.borderWidth = settings.borderWidth;
        overlayContainer.style.borderColor = settings.borderColor;
        borderColorInput.value = settings.borderColor;
        borderWidthInput.value = parseInt(settings.borderWidth);
        borderWidthNumberInput.value = parseInt(settings.borderWidth);

        // Przywracanie pozycji
        xOffset = settings.position.x;
        yOffset = settings.position.y;
        setTranslate(xOffset, yOffset, overlayContainer);

        // Przywracanie obrotu
        updateRotation(settings.rotation);
        
        // Przywracanie skali
        overlayImageScale.value = settings.overlayScale;
        const scale = settings.overlayScale / 100;
        overlayImage.style.transform = `rotate(${settings.rotation}deg) scale(${scale})`;

        // Przywracanie rozmiaru edytora (jeśli zapisano)
        if (settings.editorSize) {
            document.getElementById('editorSizeSelect').value = settings.editorSize;
            updateEditorSize(settings.editorSize);
        }

        // Aktualizacja cienia
        updateShadow();
    }

    // Event Listenery dla szablonów
    document.getElementById('loadTemplateBtn').addEventListener('click', function() {
        const templateName = document.getElementById('templateSelect').value;
        if (templateName === 'default') {
            alert('Wybierz szablon do wczytania');
            return;
        }
        
        const template = localStorage.getItem('template_' + templateName);
        if (template) {
            applySettings(JSON.parse(template));
        } else {
            alert('Nie znaleziono szablonu');
        }
    });

    document.getElementById('saveTemplateBtn').addEventListener('click', function() {
        const newTemplateName = document.getElementById('newTemplateName').value.trim();
        if (!newTemplateName) {
            alert('Wprowadź nazwę szablonu');
            return;
        }
        
        const settings = getCurrentSettings();
        localStorage.setItem('template_' + newTemplateName, JSON.stringify(settings));
        
        // Dodawanie nowej opcji do selecta
        const select = document.getElementById('templateSelect');
        const exists = Array.from(select.options).some(option => option.value === newTemplateName);
        
        if (!exists) {
            const option = new Option(newTemplateName, newTemplateName);
            select.add(option);
        }
        
        document.getElementById('newTemplateName').value = '';
        alert('Szablon został zapisany');
    });

    document.getElementById('deleteTemplateBtn').addEventListener('click', function() {
        const select = document.getElementById('templateSelect');
        const templateName = select.value;
        
        if (templateName === 'default') {
            alert('Wybierz szablon do usunięcia');
            return;
        }
        
        if (confirm(`Czy na pewno chcesz usunąć szablon "${templateName}"?`)) {
            localStorage.removeItem('template_' + templateName);
            select.remove(select.selectedIndex);
            alert('Szablon został usunięty');
        }
    });

    // Setup nawigacji
    function setupNavigation(navId, targetImage) {
        const nav = document.getElementById(navId);
        const step = 10;
        
        nav.querySelector('.up').addEventListener('click', () => {
            const currentTop = parseInt(getComputedStyle(targetImage).top) || 0;
            targetImage.style.top = `${currentTop - step}px`;
        });
        
        nav.querySelector('.down').addEventListener('click', () => {
            const currentTop = parseInt(getComputedStyle(targetImage).top) || 0;
            targetImage.style.top = `${currentTop + step}px`;
        });
        
        nav.querySelector('.left').addEventListener('click', () => {
            const currentLeft = parseInt(getComputedStyle(targetImage).left) || 0;
            targetImage.style.left = `${currentLeft - step}px`;
        });
        
        nav.querySelector('.right').addEventListener('click', () => {
            const currentLeft = parseInt(getComputedStyle(targetImage).left) || 0;
            targetImage.style.left = `${currentLeft + step}px`;
        });
    }

    setupNavigation('mainImageNav', mainImage);
    setupNavigation('overlayImageNav', overlayImage);

    // Inicjalizacja początkowa
    initializeShadow();
    loadSavedTemplates();
});