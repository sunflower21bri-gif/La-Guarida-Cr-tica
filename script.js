import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, increment, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKSAKv_Q1vmbsk9cKqGMjsypJHvxM-cPs",
  authDomain: "la-guarida-critica.firebaseapp.com",
  projectId: "la-guarida-critica",
  storageBucket: "la-guarida-critica.firebasestorage.app",
  messagingSenderId: "972639549117",
  appId: "1:972639549117:web:a4eaff7120f2c931cee9d4",
  measurementId: "G-7BYXM4VS29"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let posts = [];
let selectedTags = new Set();
let currentCategoryFilter = 'all';
let currentUser = null;
let uploadedImageBase64 = "";

const forumForm = document.getElementById('forum-form');
const starsPicker = document.getElementById('stars-picker');
const ratingVal = document.getElementById('rating-val');
const postsContainer = document.getElementById('posts-container');
const countAll = document.getElementById('count-all');
const searchInput = document.getElementById('search-input');
const authorInput = document.getElementById('author');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const btnSubmitPost = document.getElementById('btn-submit-post');
const coverFileInput = document.getElementById('cover-file');
const imageNameIndicator = document.getElementById('image-preview-name');

const defaultPlaceholder = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80";

document.addEventListener('DOMContentLoaded', () => {
  initStarfieldCanvas();
  setupAuthListeners();
  setupStarPicker();
  setupTagsPicker();
  setupImageReader();
  cargarReseñasDeNube();
  setupEventListeners();
});

function setupAuthListeners() {
  btnLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => console.error("Error al iniciar sesión:", error));
  });

  btnLogout.addEventListener('click', () => {
    signOut(auth);
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      btnLogin.classList.add('hidden');
      userInfo.classList.remove('hidden');
      userAvatar.src = user.photoURL || defaultPlaceholder;
      userName.textContent = user.displayName;
      authorInput.value = user.displayName;
      btnSubmitPost.disabled = false;
      btnSubmitPost.textContent = "Publicar Reseña 🚀✨";
    } else {
      currentUser = null;
      btnLogin.classList.remove('hidden');
      userInfo.classList.add('hidden');
      authorInput.value = "";
      btnSubmitPost.disabled = true;
      btnSubmitPost.textContent = "Inicia sesión para publicar 🚀";
    }
  });
}

function setupImageReader() {
  coverFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      imageNameIndicator.textContent = file.name;
      const reader = new FileReader();
      reader.onload = function(event) {
        uploadedImageBase64 = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      imageNameIndicator.textContent = "Ninguna imagen seleccionada";
      uploadedImageBase64 = "";
    }
  });
}

async function guardarReseñaEnNube(newPost) {
  try {
    await addDoc(collection(db, "resenas"), newPost);
    cargarReseñasDeNube();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  } catch (e) {
    console.error("Error al guardar en la nube:", e);
    alert("Hubo un error al publicar la reseña.");
  }
}

async function cargarReseñasDeNube() {
  try {
    const q = query(collection(db, "resenas"), orderBy("id", "desc"));
    const querySnapshot = await getDocs(q);
    posts = [];
    querySnapshot.forEach((docSnap) => {
      posts.push({ firestoreId: docSnap.id, ...docSnap.data() });
    });
    renderPosts();
  } catch (e) {
    console.error("Error al cargar reseñas:", e);
  }
}

forumForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentUser) {
    alert("Debes iniciar sesión para publicar.");
    return;
  }

  const type = document.getElementById('media-type').value;
  const title = document.getElementById('title').value.trim();
  const creator = document.getElementById('creator').value.trim();
  const author = currentUser.displayName;
  const rating = parseInt(ratingVal.value);
  const comment = document.getElementById('comment').value.trim();

  const newPost = {
    id: Date.now(),
    uid: currentUser.uid,
    type,
    title,
    creator,
    author,
    tags: Array.from(selectedTags).length > 0 ? Array.from(selectedTags) : ["General"],
    cover: uploadedImageBase64 !== "" ? uploadedImageBase64 : defaultPlaceholder,
    rating,
    comment,
    likes: 0,
    date: new Date().toISOString().split('T')[0]
  };

  guardarReseñaEnNube(newPost);

  forumForm.reset();
  selectedTags.clear();
  document.querySelectorAll('.tag-chip-btn').forEach(btn => btn.classList.remove('selected'));
  authorInput.value = currentUser.displayName;
  ratingVal.value = 5;
  uploadedImageBase64 = "";
  imageNameIndicator.textContent = "Ninguna imagen seleccionada";
  setupStarPicker();
});

window.likePost = async function(firestoreId) {
  try {
    const postRef = doc(db, "resenas", firestoreId);
    await updateDoc(postRef, { likes: increment(1) });
    cargarReseñasDeNube();
  } catch (e) {
    console.error("Error al dar like:", e);
  }
};

window.deletePost = async function(firestoreId, postUid) {
  if (!currentUser) {
    alert("Inicia sesión para eliminar.");
    return;
  }
  if (currentUser.uid !== postUid) {
    alert("Solo puedes eliminar tus propias reseñas.");
    return;
  }

  if (confirm("¿Estás seguro de eliminar esta reseña?")) {
    try {
      await deleteDoc(doc(db, "resenas", firestoreId));
      cargarReseñasDeNube();
    } catch (e) {
      console.error("Error al eliminar:", e);
    }
  }
};

window.setCategoryFilter = function(category) {
  currentCategoryFilter = category;
  document.querySelectorAll('.nav-tab, .cat-btn').forEach(btn => btn.classList.remove('active'));
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
  const queryVal = searchInput.value.toLowerCase().trim();
  countAll.textContent = posts.length;

  let filtered = posts.filter(post => {
    const matchesCat = currentCategoryFilter === 'all' || post.type === currentCategoryFilter;
    const tagsString = (post.tags || []).join(' ').toLowerCase();
    const matchesQuery = post.title.toLowerCase().includes(queryVal) ||
                         post.creator.toLowerCase().includes(queryVal) ||
                         post.comment.toLowerCase().includes(queryVal) ||
                         tagsString.includes(queryVal);
    return matchesCat && matchesQuery;
  });

  if (filtered.length === 0) {
    postsContainer.innerHTML = `
      <div class="empty-box" style="grid-column:1/-1; text-align:center; padding:4rem;">
        <span style="font-size:3rem;">🦊</span>
        <h3 style="margin-top:1rem; font-family:'Comfortaa', cursive;">No hay reseñas en la guarida</h3>
        <p style="color:#B8B8E8; font-size:0.9rem; margin-top:0.4rem;">¡Sé el primero en iniciar sesión y publicar una!</p>
      </div>
    `;
    return;
  }

  postsContainer.innerHTML = filtered.map(post => `
    <article class="post-card">
      <div class="post-cover">
        <span class="badge-cat">${getCategoryIcon(post.type)} ${getCategoryName(post.type)}</span>
        <img src="${post.cover}" alt="Portada" onerror="this.src='${defaultPlaceholder}'">
      </div>
      <div class="post-body">
        <h3 class="post-title">${escapeHTML(post.title)}</h3>
        <p class="post-creator">Por ${escapeHTML(post.creator)}</p>

        <div class="post-tags-list">
          ${(post.tags || []).map(t => `<span class="card-tag-badge">🏷️ ${escapeHTML(t)}</span>`).join('')}
        </div>
        
        <div class="post-stars">
          <span>${renderStars(post.rating)}</span>
        </div>

        <p class="post-text">"${escapeHTML(post.comment)}"</p>

        <div class="post-footer">
          <span>Por: <strong>${escapeHTML(post.author)}</strong></span>
          <div class="post-actions">
            <button class="btn-like" onclick="likePost('${post.firestoreId}')">
              ❤️ <span>${post.likes || 0}</span>
            </button>
            ${currentUser && currentUser.uid === post.uid ? `
              <button class="btn-delete" onclick="deletePost('${post.firestoreId}', '${post.uid}')">🗑️</button>
            ` : ''}
          </div>
        </div>
      </div>
    </article>
  `).join('');
}

function getCategoryIcon(type) {
  if (type === 'Pelicula') return '🎬';
  if (type === 'Libro') return '📖';
  if (type === 'Comic') return '💥';
  return '🌌';
}
function getCategoryName(type) {
  if (type === 'Pelicula') return 'Película';
  if (type === 'Libro') return 'Libro';
  if (type === 'Comic') return 'Cómic';
  return 'Manga';
}

function setupTagsPicker() {
  document.querySelectorAll('.tag-chip-btn').forEach(btn => {
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
}

function setupStarPicker() {
  const stars = starsPicker.querySelectorAll('.star-btn');
  function updateStars(val) {
    stars.forEach(star => {
      const starVal = parseInt(star.getAttribute('data-value'));
      star.classList.toggle('active', starVal <= val);
    });
  }
  updateStars(parseInt(ratingVal.value));
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'));
      ratingVal.value = val;
      updateStars(val);
    });
  });
}

function initStarfieldCanvas() {
  const canvas = document.getElementById('starfield-canvas');
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5, alpha: Math.random(), speed: 0.01 });
  }
  function animate() {
    ctx.clearRect(0, 0, width, height);
    stars.forEach(star => {
      star.alpha += star.speed;
      if (star.alpha > 1 || star.alpha < 0.2) star.speed = -star.speed;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFF';
      ctx.globalAlpha = Math.abs(star.alpha);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function setupEventListeners() {
  searchInput.addEventListener('input', renderPosts);
}
