/* ========== 1. CONFIGURATION NOUVELLE BASE GRATUITE ========== */
const IMGBB_KEY = "cd9e9cede23ed44cd21cfd15dd2d8252";
const BIN_ID = "6ac004c1ffd5d160534731b8";
const MASTER_KEY = "$2a$10$Sd1xnH37QZJCb17iHe7tWuKaSPgVRMmoaigG3d2uCv/SlSyqEUWmW";
const ADMIN_PIN = "123456";

/* ========== MENU HAMBURGER ========== */
window.toggleMenu = function() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.toggle('active');
};
const sectionsIds = ['pop','jeuxvideo','skylander','livre','film','decoration','vaisselle','bijoux','jeux','peluche','vetement','maquillage','lumiere'];

async function getProduitsFromBin() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, { headers: {"X-Master-Key": MASTER_KEY} });
        const json = await res.json();
        let produits = [];
        if (json.record?.produits) produits = json.record.produits;
        else if (Array.isArray(json.record)) produits = json.record;
        else if (Array.isArray(json)) produits = json;
        return produits.map(p => ({
            id: p.id || Date.now() + Math.random(),
            name: p.name || p.nom || "Sans nom",
            description: p.description || "",
            price: p.price || p.prix || 0,
            image_url: p.image_url || p.photo || "",
            category: p.category || p.categorie || "decoration",
            created_at: p.created_at || p.id || Date.now()
        }));
    } catch(e) { return []; }
}
async function saveProduitsToBin(produits) {
    const dataToSave = { produits: produits.map(p => ({ id: p.id, nom: p.name, description: p.description, prix: p.price, photo: p.image_url, categorie: p.category })) };
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, { method: "PUT", headers: {"X-Master-Key": MASTER_KEY, "Content-Type":"application/json"}, body: JSON.stringify(dataToSave) });
}

async function chargerProduits() {
    const products = await getProduitsFromBin();
    const grilles = document.querySelectorAll('.products-grid');
    grilles.forEach(g => g.innerHTML = "");
    const isAdmin = document.body.classList.contains('admin-open');
    const displayStyle = isAdmin? 'block' : 'none';
    products.forEach(product => {
        let cat = (product.category || '').toLowerCase().trim();
        let targetId = "grid-decoration";
        if (cat.includes("skylander")) targetId = "grid-skylander";
        else if (cat.includes("vaisselle")) targetId = "grid-vaisselle";
        else if (cat.includes("bijoux")) targetId = "grid-bijoux";
        else if (cat.includes("pop")) targetId = "grid-pop";
        else if (cat.includes("livre")) targetId = "grid-livre";
        else if (cat.includes("jeuxvideo")) targetId = "grid-jeuxvideo";
        else if (cat.includes("film")) targetId = "grid-film";
        else if (cat.includes("jeux") || cat.includes("casse")) targetId = "grid-jeux";
        else if (cat.includes("peluche")) targetId = "grid-peluche";
        else if (cat.includes("vetement")) targetId = "grid-vetement";
        else if (cat.includes("maquillage")) targetId = "grid-maquillage";
        else if (cat.includes("lumiere")) targetId = "grid-lumiere";
        const gridElement = document.getElementById(targetId);
        if (gridElement) {
            gridElement.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${product.id}">
                    <input type="checkbox" class="select-product-checkbox" value="${product.id}" style="display: ${displayStyle}">
                    <button class="btn-delete-product" style="display: ${displayStyle}" onclick="handleDeleteProduct(event)">✕</button>
                    <div class="product-image"><img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'"></div>
                    <div class="product-body">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <p class="product-price"><strong>${product.price}$</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505', '_blank')">Commander</button>
                    </div>
                </div>
            `);
        }
    });
    const container = document.querySelector('#produits.container');
    sectionsIds.forEach(id => {
        const section = document.getElementById(id);
        const grid = document.getElementById('grid-' + id);
        if (section && grid) {
            if (grid.children.length > 0) { container.prepend(section); section.style.display = "block"; }
            else { container.appendChild(section); section.style.display = "none"; }
        }
    });
    appliquerRecherche();
}
window.toggleCatalogue = function() { const content = document.getElementById('catContent'); if (content) content.classList.toggle('active'); };
window.filterByCategory = function(cat) {
    const recherche = document.getElementById('rechercheProduit');
    if (recherche) recherche.value = '';
    sectionsIds.forEach(id => { const s = document.getElementById(id); if (s) s.style.display = 'none'; });
    const selected = document.getElementById(cat);
    if (selected) { selected.style.display = 'block'; window.scrollTo({ top: selected.offsetTop - 120, behavior: 'smooth' }); }
    document.getElementById('category-back-button').style.display = 'block';
    document.getElementById('default-title').style.display = 'none';
    const content = document.getElementById('catContent'); if (content) content.classList.remove('active');
};
window.showAllCategories = function() {
    const recherche = document.getElementById('rechercheProduit');
    if (recherche) recherche.value = '';
    chargerProduits();
    document.getElementById('category-back-button').style.display = 'none';
    document.getElementById('default-title').style.display = 'block';
};
const form = document.getElementById('formAjoutProduit');
if (form) {
    form.onsubmit = async function(e) {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const file = document.getElementById('imageProduit').files[0];
        if (!file) return alert("Choisis une photo!");
        submitBtn.disabled = true; submitBtn.innerText = "⏳ Envoi photo...";
        try {
            const fd = new FormData(); fd.append("image", file);
            const r1 = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {method:"POST", body:fd});
            const j1 = await r1.json(); if (!j1.success) throw new Error("ImgBB échoué");
            const photoUrl = j1.data.display_url;
            submitBtn.innerText = "⏳ Sauvegarde...";
            const oldProduits = await getProduitsFromBin();
            const nouveau = { id: Date.now(), name: document.getElementById('nomProduit').value, description: document.getElementById('descProduit').value, price: parseFloat(document.getElementById('prixProduit').value), image_url: photoUrl, category: document.getElementById('categorieProduit').value };
            await saveProduitsToBin([...oldProduits, nouveau]);
            alert("Produit publié! ✅"); form.reset(); document.getElementById('preview-container').style.display = 'none'; chargerProduits();
        } catch (err) { alert(err.message); } finally { submitBtn.disabled = false; submitBtn.innerText = "🚀 Publier"; }
    };
}
window.verifierPin = async function() {
    const input = document.getElementById('inputPin'); const pin = input.value.trim();
    if (!/^\d{6}$/.test(pin)) { alert("PIN de 6 chiffres requis."); return; }
    if (pin!== ADMIN_PIN) { alert("Code PIN incorrect!"); input.value=""; return; }
    document.getElementById('admin').style.display = 'block'; document.getElementById('popupPin').style.display = 'none'; document.getElementById('btn-bulk-delete').style.display = 'inline-block';
    document.body.classList.add('admin-open'); chargerProduits();
    document.getElementById('admin').scrollIntoView({ behavior: 'smooth' });
};
window.handleDeleteProduct = async function(event) {
    const card = event.target.closest('.product-card'); const id = card.getAttribute('data-id');
    const pin = prompt("Entrez le code PIN pour supprimer :"); if (!pin) return; if (pin!== ADMIN_PIN) return alert("PIN incorrect");
    const all = await getProduitsFromBin(); const filtered = all.filter(p => String(p.id)!== String(id));
    await saveProduitsToBin(filtered); card.style.transform = "scale(0)"; card.style.opacity = "0"; setTimeout(() => card.remove(), 300);
};
window.deleteSelectedProducts = async function() {
    const checkboxes = document.querySelectorAll('.select-product-checkbox:checked');
    if (checkboxes.length === 0) return alert("Aucun produit sélectionné");
    const pin = prompt(`Supprimer ${checkboxes.length} produits? PIN :`); if (!pin) return; if (pin!== ADMIN_PIN) return alert("PIN incorrect");
    const idsToDelete = Array.from(checkboxes).map(cb => String(cb.value));
    const all = await getProduitsFromBin(); const filtered = all.filter(p =>!idsToDelete.includes(String(p.id)));
    await saveProduitsToBin(filtered); alert(`${idsToDelete.length} supprimé(s).`); chargerProduits();
};
function appliquerRecherche() {
    const rechercheInput = document.getElementById('rechercheProduit') || document.getElementById('searchProduct');
    if (!rechercheInput) return;
    const recherche = rechercheInput.value.trim().toLowerCase();
    sectionsIds.forEach(id => {
        const section = document.getElementById(id); if (!section) return;
        const cartes = section.querySelectorAll('.product-card'); let cartesVisibles = 0;
        cartes.forEach(carte => {
            const nom = carte.querySelector('.product-name');
            const correspond = nom && nom.textContent.toLowerCase().includes(recherche);
            carte.style.display = correspond? '' : 'none'; if (correspond) cartesVisibles++;
        });
        if (recherche) section.style.display = cartesVisibles > 0? 'block' : 'none';
        else section.style.display = cartes.length > 0? 'block' : 'none';
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) btnAdmin.onclick = () => { document.getElementById('popupPin').style.display = 'flex'; };
    const imgInput = document.getElementById('imageProduit');
    if (imgInput) { imgInput.onchange = function() { const [file] = this.files; if (file) { document.getElementById('preview-container').style.display = 'block'; document.getElementById('imagePreview').src = URL.createObjectURL(file); } }; }
    chargerProduits();
});
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById('searchProduct') || document.querySelector('input[placeholder*="Rechercher"]');
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            const recherche = this.value.trim().toLowerCase();
            const produits = document.querySelectorAll(".product-card");
            produits.forEach(function(produit) {
                const titre = produit.querySelector(".product-name") || produit.querySelector("h3");
                if (!titre) return; const nom = titre.textContent.trim().toLowerCase();
                produit.style.display = nom.includes(recherche)? "" : "none";
            });
            if (this.value.trim() === "") chargerProduits();
        });
    }
});
function searchProducts(){ appliquerRecherche(); }
