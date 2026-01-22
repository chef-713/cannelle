// Global state
let products = [];
let currentQuantity = 1;
let currentProduct = null;

// Load all data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadHero(),
        loadProducts(),
        loadAbout(),
        loadBaker()
    ]);
});

// Toggle mobile menu
function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('active');
}

// Load hero section
async function loadHero() {
    try {
        const res = await fetch('content/settings/hero.json');
        if (!res.ok) throw new Error('Failed to load hero');
        const data = await res.json();
        const heroEl = document.getElementById('heroContent');
        heroEl.classList.remove('loading');
        heroEl.innerHTML = `
            <h1>${data.heading}</h1>
            <p>${data.tagline}</p>
        `;
    } catch (error) {
        console.error('Error loading hero:', error);
        const heroEl = document.getElementById('heroContent');
        heroEl.classList.remove('loading');
        heroEl.innerHTML = `
            <h1>Flavor-Forward Baked Goods</h1>
            <p>Sophisticated, artisan creations for those who appreciate exceptional quality and taste</p>
        `;
    }
}

// Load products
async function loadProducts() {
    try {
        const res = await fetch('content/products.json');
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        products = data.products.filter(p => p.available).sort((a, b) => a.order - b.order);
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML = `
            <div class="error-message">Unable to load products. Please try again later.</div>
        `;
    }
}

// Render products
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (products.length === 0) {
        grid.innerHTML = '<div class="error-message">No products available at this time.</div>';
        return;
    }
    grid.className = 'products-grid';
    grid.innerHTML = products.map((product, index) => `
        <div class="product-card" onclick="openModal(${index})">
            <div class="product-image-container">
                ${product.isNew ? '<span class="new-badge">New</span>' : ''}
                <img src="${product.mainImage}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/600?text=Image+Not+Found'">
                <div class="product-name-band">
                    <h3 class="product-name">${product.title}</h3>
                    <div class="product-price">${product.price || 'Price upon request'}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load about section
async function loadAbout() {
    try {
        const res = await fetch('content/settings/about.json');
        if (!res.ok) throw new Error('Failed to load about');
        const data = await res.json();
        const aboutEl = document.getElementById('aboutContent');
        aboutEl.classList.remove('loading');
        aboutEl.innerHTML = `
            <h2 class="section-title">${data.title}</h2>
            <p>${data.paragraph1}</p>
            <p>${data.paragraph2}</p>
        `;
    } catch (error) {
        console.error('Error loading about:', error);
        const aboutEl = document.getElementById('aboutContent');
        aboutEl.classList.remove('loading');
        aboutEl.innerHTML = `
            <h2 class="section-title">About Our Bakery</h2>
            <p>Unable to load content.</p>
        `;
    }
}

// Load baker bio
async function loadBaker() {
    try {
        const res = await fetch('content/settings/baker.json');
        if (!res.ok) throw new Error('Failed to load baker');
        const data = await res.json();
        const bakerEl = document.getElementById('bakerContent');
        bakerEl.classList.remove('loading');
        bakerEl.style.display = 'contents';
        bakerEl.innerHTML = `
            <img src="${data.photo}" alt="${data.name}" class="baker-image" onerror="this.src='https://via.placeholder.com/200?text=Baker'">
            <div class="baker-text">
                <h3>${data.title}</h3>
                <p>${data.bio}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading baker:', error);
        const bakerEl = document.getElementById('bakerContent');
        bakerEl.classList.remove('loading');
        bakerEl.innerHTML = `<p>Unable to load baker information.</p>`;
    }
}

// Open modal with product
function openModal(productIndex) {
    currentProduct = products[productIndex];
    currentQuantity = 1;
    renderModal();
    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentProduct = null;
}

// Render modal content
function renderModal() {
    if (!currentProduct) return;
    
    // Collect all images
    const images = [currentProduct.mainImage, currentProduct.image1, currentProduct.image2]
        .filter(img => img && img.trim() !== '');
    
    // Check if video exists
    const hasVideo = currentProduct.videoUrl && currentProduct.videoUrl.trim() !== '';
    const videoId = hasVideo ? getYouTubeVideoId(currentProduct.videoUrl) : null;
    
    // Build thumbnails (images + video thumbnail if exists)
    let thumbnailsHtml = '';
    if (images.length > 1 || hasVideo) {
        const imageThumbnails = images.slice(0, hasVideo ? 2 : 3).map(img => 
            `<img src="${img}" alt="Product view" class="modal-thumbnail" onclick="changeMainImage('${img}', 'image')" data-type="image">`
        ).join('');
        
        const videoThumbnail = hasVideo ? 
            `<div class="modal-thumbnail video-thumbnail" onclick="changeMainImage('${videoId}', 'video')" data-type="video">
                <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="Video">
                <div class="play-icon">▶</div>
            </div>` : '';
        
        thumbnailsHtml = `
            <div class="modal-thumbnails">
                ${imageThumbnails}
                ${videoThumbnail}
            </div>
        `;
    }
    
    document.getElementById('modalBody').innerHTML = `
        <div class="modal-images">
            <div id="modalMainContent" class="modal-main-content">
                <img src="${images[0]}" alt="${currentProduct.title}" class="modal-main-image" id="modalMainImage">
            </div>
            ${thumbnailsHtml}
        </div>
        <div class="modal-details">
            <h2>${currentProduct.title}</h2>
            <div class="price">${currentProduct.price || 'Price upon request'}</div>
            <p>${currentProduct.description}</p>
            <div class="quantity-selector">
                <button class="quantity-btn" onclick="decreaseQuantity()">−</button>
                <span class="quantity-value" id="quantityValue">${currentQuantity}</span>
                <button class="quantity-btn" onclick="increaseQuantity()">+</button>
            </div>
            <button class="add-to-cart-btn" onclick="addToCart()">Add to Cart</button>
        </div>
    `;
}

// Change main image or video in modal
function changeMainImage(src, type) {
    const mainContent = document.getElementById('modalMainContent');
    
    if (type === 'video') {
        // Show video
        mainContent.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${src}?autoplay=1" 
                class="modal-main-image"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen 
                style="border-radius: 8px;">
            </iframe>
        `;
    } else {
        // Show image
        mainContent.innerHTML = `
            <img src="${src}" alt="Product" class="modal-main-image" id="modalMainImage">
        `;
    }
}

// Get YouTube video ID from URL
function getYouTubeVideoId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
}

// Quantity controls
function increaseQuantity() {
    currentQuantity++;
    document.getElementById('quantityValue').textContent = currentQuantity;
}

function decreaseQuantity() {
    if (currentQuantity > 1) {
        currentQuantity--;
        document.getElementById('quantityValue').textContent = currentQuantity;
    }
}

// Add to cart (localStorage)
function addToCart() {
    if (!currentProduct) return;
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.title === currentProduct.title);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += currentQuantity;
    } else {
        cart.push({
            title: currentProduct.title,
            price: currentProduct.price,
            quantity: currentQuantity,
            image: currentProduct.mainImage
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Added ${currentQuantity} ${currentProduct.title} to cart!`);
    closeModal();
}

// Close modal when clicking outside
document.getElementById('productModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});