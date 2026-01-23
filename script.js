// Global state
let products = [];
let currentQuantity = 1;
let currentProduct = null;
let cart = [];

// Load all data on page load
document.addEventListener('DOMContentLoaded', async () => {
    loadCart();
    updateCartCount();
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
    saveCart();
    updateCartCount();
    alert(`Added ${currentQuantity} ${currentProduct.title} to cart!`);
    closeModal();
}

// Cart management functions
function loadCart() {
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cartCount');
    countEl.textContent = count;
    if (count === 0) {
        countEl.classList.add('hidden');
    } else {
        countEl.classList.remove('hidden');
    }
}

function openCart() {
    renderCart();
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function renderCart() {
    const contentEl = document.getElementById('cartContent');

    if (cart.length === 0) {
        contentEl.innerHTML = `
            <div class="cart-empty">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <rect x="4" y="8" width="16" height="2" rx="1" fill="currentColor"/>
                    <path d="M5 10L6 20C6.1 20.5 6.5 21 7 21H17C17.5 21 17.9 20.5 18 20L19 10" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <line x1="8" y1="11" x2="9" y2="20" stroke="currentColor" stroke-width="1.2"/>
                    <line x1="12" y1="11" x2="12" y2="20" stroke="currentColor" stroke-width="1.2"/>
                    <line x1="16" y1="11" x2="15" y2="20" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M6.2 13H17.8" stroke="currentColor" stroke-width="1"/>
                    <path d="M6.5 16H17.5" stroke="currentColor" stroke-width="1"/>
                </svg>
                <p>Your cart is empty</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Add some delicious baked goods!</p>
            </div>
        `;
        return;
    }

    const total = cart.reduce((sum, item) => {
        const price = parseFloat(item.price?.replace('$', '') || 0);
        return sum + (price * item.quantity);
    }, 0);

    contentEl.innerHTML = `
        <div class="cart-items">
            ${cart.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80?text=Product'">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.title}</div>
                        <div class="cart-item-price">${item.price || 'Price upon request'}</div>
                        <div class="cart-item-controls">
                            <button class="cart-quantity-btn" onclick="updateCartQuantity(${index}, -1)">−</button>
                            <span class="cart-quantity">${item.quantity}</span>
                            <button class="cart-quantity-btn" onclick="updateCartQuantity(${index}, 1)">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})" title="Remove item">×</button>
                </div>
            `).join('')}
        </div>
        <div class="cart-footer">
            <div class="cart-total">
                <span class="cart-total-label">Total</span>
                <span class="cart-total-amount">$${total.toFixed(2)}</span>
            </div>
            <div class="cart-actions">
                <button class="cart-checkout-btn" onclick="showCheckoutForm()">Proceed to Checkout</button>
                <button class="cart-clear-btn" onclick="clearCart()">Clear Cart</button>
            </div>
        </div>
    `;
}

function updateCartQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
    updateCartCount();
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartCount();
    renderCart();
}

function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        updateCartCount();
        renderCart();
    }
}

function showCheckoutForm() {
    const contentEl = document.getElementById('cartContent');
    const total = cart.reduce((sum, item) => {
        const price = parseFloat(item.price?.replace('$', '') || 0);
        return sum + (price * item.quantity);
    }, 0);

    // Format cart items for readable display in email
    const cartSummary = cart.map(item => {
        const price = parseFloat(item.price?.replace('$', '') || 0);
        const subtotal = price * item.quantity;
        return `${item.title} x${item.quantity} @ ${item.price || 'Price upon request'} each = $${subtotal.toFixed(2)}`;
    }).join('\n');

    contentEl.innerHTML = `
        <form class="checkout-form" name="order" method="POST" netlify onsubmit="handleCheckout(event)">
            <input type="hidden" name="form-name" value="order">
            <textarea name="cart-items" style="display:none">${cartSummary}</textarea>
            <input type="hidden" name="order_total" value="$${total.toFixed(2)}">
            
            <h3 style="font-family: 'Alice', serif; color: #554319; margin-bottom: 0.5rem;">Checkout</h3>
            
            <div class="form-group">
                <label for="name">Full Name *</label>
                <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="phone">Phone Number *</label>
                <input type="tel" id="phone" name="phone" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="pickup-date">Preferred Pickup Date *</label>
                    <input type="date" id="pickup-date" name="pickup-date" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group">
                    <label for="pickup-time">Preferred Time *</label>
                    <select id="pickup-time" name="pickup-time" required>
                        <option value="">Select time</option>
                        <option value="Morning (8am-12pm)">Morning (8am-12pm)</option>
                        <option value="Afternoon (12pm-4pm)">Afternoon (12pm-4pm)</option>
                        <option value="Evening (4pm-8pm)">Evening (4pm-8pm)</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label for="instructions">Special Instructions (Optional)</label>
                <textarea id="instructions" name="instructions" placeholder="Any dietary restrictions, customizations, etc."></textarea>
            </div>
            
            <div class="cart-total" style="margin: 1rem 0;">
                <span class="cart-total-label">Total</span>
                <span class="cart-total-amount">$${total.toFixed(2)}</span>
            </div>
            
            <div class="cart-actions">
                <button type="submit" class="cart-checkout-btn">Place Order</button>
                <button type="button" class="cart-clear-btn" onclick="renderCart()">Back to Cart</button>
            </div>
        </form>
    `;
}

function handleCheckout(event) {
    event.preventDefault();
    const form = event.target;

    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
    })
        .then(() => {
            showCheckoutSuccess();
            cart = [];
            saveCart();
            updateCartCount();
            setTimeout(() => {
                closeCart();
            }, 3000);
        })
        .catch(error => {
            alert('There was an error submitting your order. Please try again.');
            console.error('Form submission error:', error);
        });
}

function showCheckoutSuccess() {
    const contentEl = document.getElementById('cartContent');
    contentEl.innerHTML = `
        <div class="checkout-success">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
            </svg>
            <h3>Order Placed Successfully!</h3>
            <p>Thank you for your order. We'll be in touch shortly to confirm your pickup details.</p>
        </div>
    `;
}

// Close modal when clicking outside
document.getElementById('productModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal();
    }
});