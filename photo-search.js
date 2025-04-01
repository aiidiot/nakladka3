// photo-search.js
class PhotoSearch {
    constructor(pexelsKey, pixabayKey) {
        this.pexelsKey = pexelsKey;
        this.pixabayKey = pixabayKey;
        this.currentPage = 1;
        this.currentQuery = '';
        this.photosPerPage = 15;
        this.currentPhotos = [];
        this.totalResults = 0;
        this.selectedPhotoIndex = 0;
        this.currentSource = 'all'; // 'all', 'pexels', or 'pixabay'

        this.init();
    }

    init() {
        // Initialize search elements
        const searchInput = document.getElementById('photoSearch');
        const searchButton = document.getElementById('photoSearchBtn');
        const sourceSelect = document.getElementById('sourceSelect');
        
        searchButton.addEventListener('click', () => this.performSearch());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        sourceSelect.addEventListener('change', () => {
            this.currentSource = sourceSelect.value;
            if (this.currentQuery) {
                this.performSearch();
            }
        });

        // Initialize navigation
        this.initializeNavigation();
    }

    async performSearch() {
        const query = document.getElementById('photoSearch').value.trim();
        if (!query) return;

        this.currentQuery = query;
        this.currentPage = 1;
        this.showLoader();

        try {
            if (this.currentSource === 'all') {
                await this.fetchFromBothSources();
            } else if (this.currentSource === 'pexels') {
                await this.fetchFromPexels();
            } else {
                await this.fetchFromPixabay();
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Wystąpił błąd podczas wyszukiwania.');
        }

        this.hideLoader();
    }

    async fetchFromBothSources() {
        try {
            const [pexelsData, pixabayData] = await Promise.all([
                this.fetchPexelsPhotos(),
                this.fetchPixabayPhotos()
            ]);

            // Normalize and combine results
            const pexelsPhotos = this.normalizePexelsData(pexelsData);
            const pixabayPhotos = this.normalizePixabayData(pixabayData);

            this.currentPhotos = [...pexelsPhotos, ...pixabayPhotos];
            this.totalResults = this.currentPhotos.length;
            this.selectedPhotoIndex = 0;
            this.updateGalleryDisplay();
        } catch (error) {
            console.error('Error fetching from both sources:', error);
            throw error;
        }
    }

    async fetchFromPexels() {
        const data = await this.fetchPexelsPhotos();
        this.currentPhotos = this.normalizePexelsData(data);
        this.totalResults = data.total_results;
        this.updateGalleryDisplay();
    }

    async fetchFromPixabay() {
        const data = await this.fetchPixabayPhotos();
        this.currentPhotos = this.normalizePixabayData(data);
        this.totalResults = data.total;
        this.updateGalleryDisplay();
    }

    async fetchPexelsPhotos() {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(this.currentQuery)}&per_page=${this.photosPerPage}&page=${this.currentPage}`,
            {
                headers: {
                    'Authorization': this.pexelsKey
                }
            }
        );
        return response.json();
    }

    async fetchPixabayPhotos() {
        const response = await fetch(
            `https://pixabay.com/api/?key=${this.pixabayKey}&q=${encodeURIComponent(this.currentQuery)}&per_page=${this.photosPerPage}&page=${this.currentPage}`
        );
        return response.json();
    }

    normalizePexelsData(data) {
        return data.photos.map(photo => ({
            id: `pexels-${photo.id}`,
            source: 'Pexels',
            thumbnail: photo.src.tiny,
            large: photo.src.large,
            original: photo.src.original,
            photographer: photo.photographer,
            photographerUrl: photo.photographer_url,
            sourceUrl: photo.url,
            alt: photo.alt || 'Pexels photo'
        }));
    }

    normalizePixabayData(data) {
        return data.hits.map(photo => ({
            id: `pixabay-${photo.id}`,
            source: 'Pixabay',
            thumbnail: photo.previewURL,
            large: photo.largeImageURL,
            original: photo.largeImageURL,
            photographer: photo.user,
            photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
            sourceUrl: photo.pageURL,
            alt: photo.tags || 'Pixabay photo'
        }));
    }

    updateGalleryDisplay() {
        const mainPhoto = document.getElementById('photoMainDisplay');
        const sidePhotosLeft = document.getElementById('photoSideLeft');
        const sidePhotosRight = document.getElementById('photoSideRight');
        const photoCredits = document.getElementById('photoCredits');

        if (this.currentPhotos.length === 0) {
            mainPhoto.innerHTML = '<p>Nie znaleziono zdjęć</p>';
            return;
        }

        const currentPhoto = this.currentPhotos[this.selectedPhotoIndex];
        
        // Update main photo
        mainPhoto.innerHTML = `
            <img src="${currentPhoto.large}" 
                 alt="${currentPhoto.alt}" 
                 class="main-photo">
        `;

        // Update credits
        photoCredits.innerHTML = `
            Autor: <a href="${currentPhoto.photographerUrl}" target="_blank">${currentPhoto.photographer}</a>
            | Źródło: <a href="${currentPhoto.sourceUrl}" target="_blank">${currentPhoto.source}</a>
        `;

        // Update thumbnails
        this.updateSideThumbnails(sidePhotosLeft, sidePhotosRight);
        this.updateNavigationState();
    }

    initializeNavigation() {
        // Initialize navigation buttons
        document.getElementById('prevPhoto').addEventListener('click', () => this.navigatePhotos('prev'));
        document.getElementById('nextPhoto').addEventListener('click', () => this.navigatePhotos('next'));
        document.getElementById('prevPage').addEventListener('click', () => this.changePage('prev'));
        document.getElementById('nextPage').addEventListener('click', () => this.changePage('next'));

        // Initialize usage buttons
        document.getElementById('useAsMain').addEventListener('click', () => this.useCurrentPhoto('main'));
        document.getElementById('useAsOverlay').addEventListener('click', () => this.useCurrentPhoto('overlay'));
        document.getElementById('downloadPhoto').addEventListener('click', () => this.downloadCurrentPhoto());
    }

    navigatePhotos(direction) {
        if (direction === 'prev' && this.selectedPhotoIndex > 0) {
            this.selectedPhotoIndex--;
        } else if (direction === 'next' && this.selectedPhotoIndex < this.currentPhotos.length - 1) {
            this.selectedPhotoIndex++;
        }
        this.updateGalleryDisplay();
    }

    async changePage(direction) {
        if (direction === 'prev' && this.currentPage > 1) {
            this.currentPage--;
        } else if (direction === 'next') {
            this.currentPage++;
        }
        await this.performSearch();
    }

    updateSideThumbnails(leftContainer, rightContainer) {
        leftContainer.innerHTML = '';
        rightContainer.innerHTML = '';

        const leftPhotos = this.currentPhotos.slice(0, this.selectedPhotoIndex);
        const rightPhotos = this.currentPhotos.slice(this.selectedPhotoIndex + 1);

        leftPhotos.forEach((photo, index) => {
            const thumb = this.createThumbnail(photo, index);
            leftContainer.appendChild(thumb);
        });

        rightPhotos.forEach((photo, index) => {
            const thumb = this.createThumbnail(photo, index + this.selectedPhotoIndex + 1);
            rightContainer.appendChild(thumb);
        });
    }

    createThumbnail(photo, index) {
        const thumb = document.createElement('div');
        thumb.className = 'photo-thumbnail';
        thumb.innerHTML = `
            <img src="${photo.thumbnail}" alt="${photo.alt}">
            <span class="source-badge">${photo.source}</span>
        `;
        thumb.addEventListener('click', () => {
            this.selectedPhotoIndex = index;
            this.updateGalleryDisplay();
        });
        return thumb;
    }

    updateNavigationState() {
        const prevPhotoBtn = document.getElementById('prevPhoto');
        const nextPhotoBtn = document.getElementById('nextPhoto');
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');

        prevPhotoBtn.disabled = this.selectedPhotoIndex === 0;
        nextPhotoBtn.disabled = this.selectedPhotoIndex === this.currentPhotos.length - 1;
        prevPageBtn.disabled = this.currentPage === 1;
        nextPageBtn.disabled = this.currentPage * this.photosPerPage >= this.totalResults;
    }

    useCurrentPhoto(target) {
        if (this.currentPhotos.length === 0) return;
        
        const photo = this.currentPhotos[this.selectedPhotoIndex];
        if (target === 'main') {
            document.getElementById('mainImageLink').value = photo.large;
            const event = new Event('input');
            document.getElementById('mainImageLink').dispatchEvent(event);
        } else {
            document.getElementById('overlayImageLink').value = photo.large;
            const event = new Event('input');
            document.getElementById('overlayImageLink').dispatchEvent(event);
        }
    }

    async downloadCurrentPhoto() {
        if (this.currentPhotos.length === 0) return;
        
        const photo = this.currentPhotos[this.selectedPhotoIndex];
        try {
            const response = await fetch(photo.original);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photo-${photo.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading photo:', error);
            this.showError('Wystąpił błąd podczas pobierania zdjęcia.');
        }
    }

    showLoader() {
        const loader = document.getElementById('photoSearchLoader');
        if (loader) loader.style.display = 'block';
    }

    hideLoader() {
        const loader = document.getElementById('photoSearchLoader');
        if (loader) loader.style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('photoSearchError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const photoSearch = new PhotoSearch(
        'F5Tr6b6Unj4cyzy97fuMGonryTKiwwOyEJIaYTEPFIcpRe2RtCUazabU',
        '6203269-2d19e951044657528b43fa19a'
    );
});
