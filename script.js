// ==========================================================================
// La Guarida Crítica - JavaScript Logic
// ==========================================================================

const initialPosts = [
  {
    id: 1,
    type: "Comic",
    title: "Spider-Man: Into the Spider-Verse",
    creator: "Brian Michael Bendis / Sony",
    author: "ZorroComic",
    tags: ["Accion", "Comedia", "Ciencia Ficción"],
    cover: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    rating: 5,
    comment: "Una obra maestra del cómic moderno adaptada al cine. Animación deslumbrante, gran sentido del humor y acción desenfrenada.",
    likes: 28,
    date: "2026-03-20"
  },
  {
    id: 2,
    type: "Novela",
    title: "El Principito",
    creator: "Antoine de Saint-Exupéry",
    author: "CriticaGalactica",
    tags: ["Fantasia", "Aventura"],
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
    rating: 5,
    comment: "Caminando entre estrellas y zorros astutos. Solo con el corazón se puede ver bien; lo esencial es invisible a los ojos.",
    likes: 24,
    date: "2026-03-21"
  },
  {
    id: 3,
    type: "Pelicula",
    title: "Knives Out (Entre Navajas y Secretos)",
    creator: "Rian Johnson",
    author: "MisterioFox",
    tags: ["Suspenso", "Comedia", "Drama"],
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80",
    rating: 5,
    comment: "Giro tras giro en un misterio súper entretenido. Comedia negra con suspenso de primer nivel.",
    likes: 17,
    date: "2026-03-22"
  }
];

let posts = JSON.parse(localStorage.getItem('guarida_critica_posts')) || initialPosts;
let selectedTags = new Set();
let currentCategoryFilter = 'all';
let currentTagFilter = 'all';
let currentImageBase64 = null;
let currentImageTab = 'file';

const forumForm = document.getElementById('forum-form');
const starsPicker = document.getElementById('stars-picker');
const ratingVal = document.getElementById('rating-val');
const postsContainer = document.getElementById('posts-container');
const countAll = document.getElementById('count-all');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const coverFile = document.getElementById('cover-file');
const coverUrl = document.getElementById('cover-url');
const previewBox = document.getElementById('preview-box');
const previewImg = document.getElementById('preview-img');
const customTagInput = document.getElementById('custom-tag-input');
const btnAddCustomTag = document.getElementById('btn-add-custom-tag');

const defaultPlaceholder = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80";

document.addEventListener('DOMContentLoaded', () => {
  renderPosts();
  setupStarPicker();
  setupImageHandlers();
  setupTagsPicker();
  setupEventListeners();
});

function saveToLocalStorage() {
  localStorage.setItem('guarida_critica_posts', JSON.stringify(posts));
}

function setupTagsPicker() {
  const tagBtns = document.querySelectorAll('.tag-chip-btn');
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        btn.classList.remove('selected');
      } else {
        selectedTags.add(tag);
        btn.classList.add('selected');
      }
    });
  });

  btnAddCustomTag.addEventListener('click', () => {
    const val = customTagInput.value.trim();
    if (val && !selectedTags.has(val)) {
      selectedTags.add(val);
      
      const newBtn = document.createElement('button');
      newBtn.type = 'button';
      newBtn.className = 'tag-chip-btn selected';
      newBtn.setAttribute('data-tag', val);
      newBtn.textContent = '🏷️ ' + val;
      newBtn.addEventListener('click', () => {
        if (selectedTags.has(val)) {
          selectedTags.delete(val);
          newBtn.classList.remove('selected');
        } else {
          selectedTags.add(val);
          newBtn.classList.add('selected');
        }
      });

      document.getElementById('tags-picker').appendChild(newBtn);
      customTagInput.value = '';
    }
  });
}

function setupStarPicker() {
  const stars = starsPicker.querySelectorAll('.star-btn');
  
  function updateStars(val) {
    stars.forEach(star => {
      const starVal = parseInt(star.getAttribute('data-value'));
      if (starVal <= val) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }

  updateStars(parseInt(ratingVal.value));

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'));
      ratingVal.value = val;
      updateStars(val);
    });

    star.addEventListener('mouseover', () => {
      const val = parseInt(star.getAttribute('data-value'));
      updateStars(val);
    });
  });

  starsPicker.addEventListener('mouseleave', () => {
    updateStars(parseInt(ratingVal.value));
  });
}

window.switchImageTab = function(tab) {
  currentImageTab = tab;
  document.getElementById('tab-file-btn').classList.toggle('active', tab === 'file');
  document.getElementById('tab-url-btn').classList.toggle('active', tab === 'url');
  
  document.getElementById('file-tab-content').classList.toggle('active', tab === 'file');
  document.getElementById('url-tab-content').classList.toggle('active', tab === 'url');

  updatePreview();
};

function setupImageHandlers() {
  coverFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        currentImageBase64 = evt.target.result;
        previewImg.src = currentImageBase64;
        previewBox.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  coverUrl.addEventListener('input', updatePreview);
}

function updatePreview() {
  if (currentImageTab === 'url' && coverUrl.value.trim() !== '') {
    previewImg.src = coverUrl.value.trim();
    previewBox.classList.remove('hidden');
  } else if (currentImageTab === 'file' && currentImageBase64) {
    previewImg.src = currentImageBase64;
    previewBox.classList.remove('hidden');
  } else {
    previewBox.classList.add('hidden');
  }
}

forumForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const type = document.getElementById('media-type').value;
  const title = document.getElementById('title').value.trim();
  const creator = document.getElementById('creator').value.trim();
  const author = document.getElementById('author').value.trim();
  const rating = parseInt(ratingVal.value);
  const comment = document.getElementById('comment').value.trim();

  let cover = defaultPlaceholder;
  if (currentImageTab === 'file' && currentImageBase64) {
    cover = currentImageBase64;
  } else if (currentImageTab === 'url' && coverUrl.value.trim() !== '') {
    cover = coverUrl.value.trim();
  }

  const tagsArray = Array.from(selectedTags);

  const newPost = {
    id: Date.now(),
    type,
    title,
    creator,
    author,
    tags: tagsArray.length > 0 ? tagsArray : ["General"],
    cover,
    rating,
    comment,
    likes: 0,
    date: new Date().toISOString().split('T')[0]
  };

  posts.unshift(newPost);
  saveToLocalStorage();
  renderPosts();

  forumForm.reset();
  selectedTags.clear();
  document.querySelectorAll('.tag-chip-btn').forEach(btn => btn.classList.remove('selected'));
  currentImageBase64 = null;
  previewBox.classList.add('hidden');
  ratingVal.value = 5;
  setupStarPicker();
  switchImageTab('file');
});

window.setCategoryFilter = function(category) {
  currentCategoryFilter = category;
  document.querySelectorAll('.category-tabs .cat-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderPosts();
};

window.setTagFilter = function(tag) {
  currentTagFilter = tag;
  document.querySelectorAll('.tag-pill-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderPosts();
};

function renderStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= rating ? '★' : '☆';
  }
  return stars;
}

function renderPosts() {
  const query = searchInput.value.toLowerCase().trim();
  const sortBy = sortSelect.value;

  countAll.textContent = posts.length;

  let filtered = posts.filter(post => {
    const matchesCat = currentCategoryFilter === 'all' || post.type === currentCategoryFilter;
    const matchesTag = currentTagFilter === 'all' || (post.tags && post.tags.includes(currentTagFilter));
    
    const tagsString = (post.tags || []).join(' ').toLowerCase();
    const matchesQuery = post.title.toLowerCase().includes(query) ||
                         post.creator.toLowerCase().includes(query) ||
                         post.comment.toLowerCase().includes(query) ||
                         tagsString.includes(query);

    return matchesCat && matchesTag && matchesQuery;
  });

  if (sortBy === 'rating-desc') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'rating-asc') {
    filtered.sort((a, b) => a.rating - b.rating);
  } else if (sortBy === 'likes') {
    filtered.sort((a, b) => b.likes - a.likes);
  } else {
    filtered.sort((a, b) => b.id - a.id);
  }

  if (filtered.length === 0) {
    postsContainer.innerHTML = `
      <div class="empty-box">
        <span>🦊</span>
        <h3>No se encontraron publicaciones</h3>
        <p>Intenta cambiando la categoría o las etiquetas de búsqueda.</p>
      </div>
    `;
    return;
  }

  postsContainer.innerHTML = filtered.map(post => `
    <article class="post-card">
      <div class="post-cover">
        <span class="badge-cat">${getCategoryIcon(post.type)} ${getCategoryName(post.type)}</span>
        <img src="${post.cover}" alt="Portada de ${escapeHTML(post.title)}" onerror="this.src='${defaultPlaceholder}'">
      </div>
      <div class="post-body">
        <h3 class="post-title">${escapeHTML(post.title)}</h3>
        <p class="post-creator">Por ${escapeHTML(post.creator)}</p>

        <div class="post-tags-list">
          ${(post.tags || []).map(t => `<span class="card-tag-badge">🏷️ ${escapeHTML(t)}</span>`).join('')}
        </div>
        
        <div class="post-stars">
          <span>${renderStars(post.rating)}</span>
          <span class="rating-num">(${post.rating}/5)</span>
        </div>

        <p class="post-text">"${escapeHTML(post.comment)}"</p>

        <div class="post-footer">
          <span>Por: <strong>${escapeHTML(post.author)}</strong></span>
          <div class="post-actions">
            <button class="btn-like" onclick="likePost(${post.id})">
              ❤️ <span>${post.likes}</span>
            </button>
            <button class="btn-delete" onclick="deletePost(${post.id})" title="Borrar comentario">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function getCategoryIcon(type) {
  if (type === 'Pelicula') return '🎬';
  if (type === 'Libro') return '📖';
  if (type === 'Novela') return '🌌';
  return '💥';
}

function getCategoryName(type) {
  if (type === 'Pelicula') return 'Película';
  if (type === 'Libro') return 'Libro';
  if (type === 'Novela') return 'Novela';
  return 'Cómic';
}

window.likePost = function(id) {
  const post = posts.find(p => p.id === id);
  if (post) {
    post.likes += 1;
    saveToLocalStorage();
    renderPosts();
  }
};

window.deletePost = function(id) {
  if (confirm("¿Estás seguro de que deseas eliminar este comentario?")) {
    posts = posts.filter(p => p.id !== id);
    saveToLocalStorage();
    renderPosts();
  }
};

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function setupEventListeners() {
  searchInput.addEventListener('input', renderPosts);
  sortSelect.addEventListener('change', renderPosts);
}
