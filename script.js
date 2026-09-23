const TELEGRAM_USERNAME = "CourseWallah123"; 
let allCourses = [];
let currentCategory = "All Courses";
let cart = JSON.parse(localStorage.getItem('userCart')) || [];
let currentSort = 'popular'; // 'popular' or 'reversed'

// 1. Loader Animation (Slower and smoother)
window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.loader-progress').style.width = '100%';
        setTimeout(() => { document.getElementById('loader').classList.add('hidden'); }, 800);
    }, 500);
});

// 2. Modals Setup
const faqModal = document.getElementById('faqModal');
const cartModal = document.getElementById('cartModal');
document.getElementById('faqBtn').addEventListener('click', () => faqModal.classList.add('active'));
document.getElementById('closeFaqBtn').addEventListener('click', () => faqModal.classList.remove('active'));
document.getElementById('closeCartBtn').addEventListener('click', () => cartModal.classList.remove('active'));
faqModal.addEventListener('click', (e) => { if(e.target === faqModal) faqModal.classList.remove('active'); });
cartModal.addEventListener('click', (e) => { if(e.target === cartModal) cartModal.classList.remove('active'); });

// 3. Sidebar Toggle
const sidebar = document.getElementById('sidebar');
document.getElementById('menuBtn').addEventListener('click', () => sidebar.classList.add('active'));
document.getElementById('closeBtn').addEventListener('click', () => sidebar.classList.remove('active'));

// 4. Voice Search
const micBtn = document.getElementById('micBtn');
const searchInput = document.getElementById('searchInput');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    micBtn.addEventListener('click', () => { recognition.start(); micBtn.classList.add('listening'); });
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        searchInput.dispatchEvent(new Event('input'));
    };
    recognition.onend = () => { micBtn.classList.remove('listening'); };
    recognition.onerror = () => { micBtn.classList.remove('listening'); alert("Mic error. Please allow microphone access."); };
} else {
    micBtn.addEventListener('click', () => alert("Voice search is not supported in your browser."));
}

// 5. Fetch Data
fetch('courses.json')
    .then(res => res.json())
    .then(data => {
        allCourses = data;
        updateStatsBar(allCourses.length);
        generateCategories();
        applySortAndDisplay();
        updateCartBadge();
    })
    .catch(err => console.log('Error:', err));

function updateStatsBar(count) {
    document.getElementById('statsBar').innerText = `${count} Verified Courses Available`;
}
function updateTitle(count) {
    document.getElementById('allCoursesTitle').innerText = `All Courses (${count})`;
}

// 6. Sorting Logic
document.getElementById('sortBtn').addEventListener('click', () => {
    if (currentSort === 'popular') {
        currentSort = 'reversed';
        document.getElementById('sortBtn').innerHTML = '↑ Reversed';
    } else {
        currentSort = 'popular';
        document.getElementById('sortBtn').innerHTML = '↓ Popular';
    }
    applySortAndDisplay();
});

function applySortAndDisplay() {
    let filtered = currentCategory === "All Courses" ? [...allCourses] : allCourses.filter(c => c.category === currentCategory);
    
    if (currentSort === 'popular') {
        filtered.sort((a, b) => b.rating - a.rating); // High to low
    } else {
        filtered.sort((a, b) => a.rating - b.rating); // Low to high
    }
    
    displayCourses(filtered);
}

// 7. Categories
function generateCategories() {
    const catList = document.getElementById('categoryList');
    const categories = {};
    allCourses.forEach(c => { const cat = c.category || "General"; categories[cat] = (categories[cat] || 0) + 1; });
    let html = `<div class="category-item active" onclick="filterCategory('All Courses', this)"><span>All Courses</span><span class="count">${allCourses.length}</span></div>`;
    for (const [cat, count] of Object.entries(categories)) {
        html += `<div class="category-item" onclick="filterCategory('${cat}', this)"><span>${cat}</span><span class="count">${count}</span></div>`;
    }
    catList.innerHTML = html;
}

function filterCategory(category, element) {
    currentCategory = category;
    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
    applySortAndDisplay();
    if (window.innerWidth <= 768) sidebar.classList.remove('active');
}

// 8. Display Courses
function displayCourses(courseList) {
    const container = document.getElementById('courseContainer');
    container.innerHTML = '';
    updateTitle(courseList.length);
    
    courseList.forEach(course => {
        const msg = `Hello COURSE WALLAH, I want this course: ${course.title}`;
        const tgLink = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(msg)}`;
        const imgUrl = course.image || `https://placehold.co/600x400/1e293b/818cf8?text=${encodeURIComponent(course.title)}`;
        
        const isLiked = localStorage.getItem(`like_${course.id}`) === 'true';
        const isDisliked = localStorage.getItem(`dislike_${course.id}`) === 'true';
        
        const card = `
            <div class="card">
                <div class="card-img-box">
                    <img src="${imgUrl}" alt="${course.title}" onerror="this.src='https://placehold.co/600x400/1e293b/818cf8?text=No+Image'">
                    <div class="price-badge">₹${course.price}</div>
                </div>
                <div class="card-content">
                    <div class="card-meta-row">
                        <span class="meta-badge rating">⭐ ${course.rating} (${course.reviews})</span>
                        <span class="meta-badge category">${course.category}</span>
                    </div>
                    <h3 class="card-title">${course.id}. ${course.title}</h3>
                    <div class="like-dislike">
                        <span class="${isLiked ? 'active-like' : ''}" onclick="toggleLike(${course.id}, this)">👍 <span class="like-count">${course.likes || 72}</span></span>
                        <span class="${isDisliked ? 'active-dislike' : ''}" onclick="toggleDislike(${course.id}, this)">👎 <span class="dislike-count">${course.dislikes || 3}</span></span>
                    </div>
                    <div class="card-actions">
                        <a href="${tgLink}" target="_blank" class="btn-unlock">🔒 Unlock Course • ₹${course.price}</a>
                        <button class="btn-cart" onclick="addToCart(${course.id})">🛒 Cart</button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// 9. Like/Dislike Interactivity
function toggleLike(id, element) {
    const countSpan = element.querySelector('.like-count');
    let count = parseInt(countSpan.innerText);
    const isLiked = localStorage.getItem(`like_${id}`) === 'true';
    if (isLiked) { count--; localStorage.removeItem(`like_${id}`); element.classList.remove('active-like'); } 
    else {
        count++; localStorage.setItem(`like_${id}`, 'true'); element.classList.add('active-like');
        const parent = element.parentElement;
        const dislikeBtn = parent.querySelector('.active-dislike');
        if(dislikeBtn) { let dCount = parseInt(dislikeBtn.querySelector('.dislike-count').innerText); dCount--; dislikeBtn.querySelector('.dislike-count').innerText = dCount; dislikeBtn.classList.remove('active-dislike'); localStorage.removeItem(`dislike_${id}`); }
    }
    countSpan.innerText = count;
}

function toggleDislike(id, element) {
    const countSpan = element.querySelector('.dislike-count');
    let count = parseInt(countSpan.innerText);
    const isDisliked = localStorage.getItem(`dislike_${id}`) === 'true';
    if (isDisliked) { count--; localStorage.removeItem(`dislike_${id}`); element.classList.remove('active-dislike'); } 
    else {
        count++; localStorage.setItem(`dislike_${id}`, 'true'); element.classList.add('active-dislike');
        const parent = element.parentElement;
        const likeBtn = parent.querySelector('.active-like');
        if(likeBtn) { let lCount = parseInt(likeBtn.querySelector('.like-count').innerText); lCount--; likeBtn.querySelector('.like-count').innerText = lCount; likeBtn.classList.remove('active-like'); localStorage.removeItem(`like_${id}`); }
    }
    countSpan.innerText = count;
}

// 10. Cart System
function addToCart(id) {
    if (!cart.includes(id)) {
        cart.push(id); localStorage.setItem('userCart', JSON.stringify(cart)); updateCartBadge(); alert("Course added to cart!");
    } else { alert("Course already in cart!"); }
}

function updateCartBadge() {
    let badge = document.getElementById('cartCountBadge');
    if(!badge) {
        const cartIcon = document.querySelector('.cart-icon');
        if(cartIcon) { badge = document.createElement('span'); badge.id = 'cartCountBadge'; badge.className = 'cart-count-badge'; cartIcon.appendChild(badge); }
    }
    if(badge) badge.innerText = cart.length;
}

function openCartModal() {
    const container = document.getElementById('cartItemsContainer');
    const totalSpan = document.getElementById('cartTotalPrice');
    let total = 0; container.innerHTML = '';
    if(cart.length === 0) { container.innerHTML = '<p style="text-align:center; color:#64748b;">Your cart is empty.</p>'; totalSpan.innerText = 0; } 
    else {
        cart.forEach(id => {
            const course = allCourses.find(c => c.id === id);
            if(course) {
                total += course.price;
                container.innerHTML += `
                    <div class="cart-item">
                        <div><div class="cart-item-title">${course.title}</div><div class="cart-item-price">₹${course.price}</div></div>
                        <span class="remove-item" onclick="removeFromCart(${course.id})">Remove</span>
                    </div>
                `;
            }
        });
        totalSpan.innerText = total;
    }
}

function removeFromCart(id) {
    cart = cart.filter(cid => cid !== id); localStorage.setItem('userCart', JSON.stringify(cart)); updateCartBadge(); openCartModal();
}

document.getElementById('checkoutBtn').addEventListener('click', () => {
    if(cart.length === 0) { alert("Cart is empty!"); return; }
    let message = "Hello COURSE WALLAH, I want to buy these courses:\n";
    let total = 0;
    cart.forEach((id, index) => {
        const course = allCourses.find(c => c.id === id);
        if(course) { message += `${index + 1}. ${course.title} (₹${course.price})\n`; total += course.price; }
    });
    message += `\nTotal: ₹${total}`;
    const tgLink = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`;
    window.open(tgLink, '_blank'); cartModal.classList.remove('active');
});

// 11. Search Function
document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    let filtered = allCourses.filter(c => c.title.toLowerCase().includes(term));
    if (currentCategory !== "All Courses") { filtered = filtered.filter(c => c.category === currentCategory); }
    displayCourses(filtered);
});
