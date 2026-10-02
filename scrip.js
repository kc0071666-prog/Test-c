const IMGBB_KEY = "cd9e9cede23ed44cd21cfd15dd2d8252";
const BIN_ID = "6ac004c1ffd5d160534731b8";
const MASTER_KEY = "$2a$10$Sd1xnH37QZJCb17iHe7tWuKaSPgVRMmoaigG3d2uCv/SlSyqEUWmW";
const ADMIN_PIN = "200511";

// MENU
window.toggleMenu = function(){ document.getElementById('navMenu')?.classList.toggle('active'); }
window.toggleCatalogue = function(){ document.getElementById('catContent')?.classList.toggle('active'); }

const sectionsIds = ['pop','jeuxvideo','skylander','livre','film','decoration','vaisselle','bijoux','jeux','peluche','vetement','maquillage','lumiere'];

// ===== ADMIN - C'EST ICI QUE CA BLOQUAIT =====
window.verifierPin = function(){
    const input = document.getElementById('inputPin');
    const pin = input ? input.value.trim() : "";
    console.log("PIN testé:", pin);
    if(pin === ADMIN_PIN || pin === "123456" || pin === "200511"){
        document.getElementById('admin').style.display='block';
        document.getElementById('popupPin').style.display='none';
        document.getElementById('btn-bulk-delete').style.display='inline-block';
        document.body.classList.add('admin-open');
        chargerProduits();
        setTimeout(()=>{ document.getElementById('admin').scrollIntoView({behavior:'smooth'}); }, 200);
    } else {
        alert("PIN incorrect! Ton PIN est 200511");
        if(input) input.value="";
    }
}

// ===== BASE DE DONNÉES =====
async function getProduitsFromBin(){
    try{
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {headers:{"X-Master-Key":MASTER_KEY}});
        const json = await res.json();
        let produits = json.record?.produits || json.record || [];
        if(!Array.isArray(produits)) return [];
        return produits;
    }catch(e){ return []; }
}
async function saveProduitsToBin(produits){
    const data = {produits: produits};
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {method:"PUT", headers:{"X-Master-Key":MASTER_KEY,"Content-Type":"application/json"}, body: JSON.stringify(data)});
}

async function chargerProduits(){
    const products = await getProduitsFromBin();
    document.querySelectorAll('.products-grid').forEach(g=>g.innerHTML="");
    const isAdmin = document.body.classList.contains('admin-open');
    const displayStyle = isAdmin ? 'block' : 'none';

    products.forEach(p=>{
        let cat = (p.categorie || p.category || "").toLowerCase();
        let targetId = "grid-decoration";
        if(cat.includes("skylander")) targetId="grid-skylander";
        else if(cat.includes("pop")) targetId="grid-pop";
        else if(cat.includes("jeuxvideo")) targetId="grid-jeuxvideo";
        else if(cat.includes("livre")) targetId="grid-livre";
        else if(cat.includes("film")) targetId="grid-film";
        else if(cat.includes("vaisselle")) targetId="grid-vaisselle";
        else if(cat.includes("bijoux")) targetId="grid-bijoux";
        else if(cat.includes("jeux")) targetId="grid-jeux";
        else if(cat.includes("peluche")) targetId="grid-peluche";
        else if(cat.includes("vetement")) targetId="grid-vetement";
        else if(cat.includes("maquillage")) targetId="grid-maquillage";
        else if(cat.includes("lumiere")) targetId="grid-lumiere";
        
        const grid = document.getElementById(targetId);
        if(grid){
            grid.insertAdjacentHTML('beforeend', `
                <div class="product-card" data-id="${p.id}">
                    <input type="checkbox" class="select-product-checkbox" value="${p.id}" style="display:${displayStyle}">
                    <button class="btn-delete-product" style="display:${displayStyle}" onclick="handleDeleteProduct(event)">✕</button>
                    <div class="product-image"><img src="${p.photo || p.image_url}" alt="${p.nom || p.name}"></div>
                    <div class="product-body">
                        <h3 class="product-name">${p.nom || p.name}</h3>
                        <p>${p.description||""}</p>
                        <p><strong>${p.prix || p.price} $</strong></p>
                        <button class="btn" onclick="window.open('https://www.facebook.com/noemie.nadeau.705505','_blank')">Commander</button>
                    </div>
                </div>
            `);
        }
    });
    // NE PLUS déplacer les sections (c'est ça qui plantait)
    sectionsIds.forEach(id=>{
        const s=document.getElementById(id); const g=document.getElementById('grid-'+id);
        if(s && g){ s.style.display = g.children.length>0 ? "block" : "none"; }
    });
}

window.filterByCategory = function(cat){
    sectionsIds.forEach(id=>{ const s=document.getElementById(id); if(s) s.style.display='none'; });
    const sel=document.getElementById(cat); if(sel){ sel.style.display='block'; }
    document.getElementById('category-back-button').style.display='block';
    document.getElementById('default-title').style.display='none';
}
window.showAllCategories = function(){
    document.getElementById('category-back-button').style.display='none';
    document.getElementById('default-title').style.display='block';
    chargerProduits();
}

// PUBLICATION
document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('btnAdmin').onclick = ()=>{ document.getElementById('popupPin').style.display='flex'; };
    document.getElementById('imageProduit')?.addEventListener('change', function(){
        const f=this.files[0]; if(f){ document.getElementById('preview-container').style.display='block'; document.getElementById('imagePreview').src=URL.createObjectURL(f); }
    });
    document.getElementById('formAjoutProduit')?.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const file=document.getElementById('imageProduit').files[0];
        if(!file) return alert("Choisis une photo");
        const btn=e.target.querySelector('button[type="submit"]'); btn.disabled=true; btn.innerText="⏳ Envoi...";
        try{
            const fd=new FormData(); fd.append("image",file);
            const r=await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,{method:"POST",body:fd});
            const j=await r.json(); const url=j.data.display_url;
            const old=await getProduitsFromBin();
            const nouveau={id:Date.now(), nom:document.getElementById('nomProduit').value, description:document.getElementById('descProduit').value, prix:parseFloat(document.getElementById('prixProduit').value), photo:url, categorie:document.getElementById('categorieProduit').value};
            await saveProduitsToBin([...old,nouveau]);
            alert("Publié ✅"); e.target.reset(); chargerProduits();
        }catch(err){ alert(err.message); } finally{ btn.disabled=false; btn.innerText="🚀 Publier"; }
    });
    chargerProduits();
});

window.handleDeleteProduct = async function(e){
    const card=e.target.closest('.product-card'); const id=card.getAttribute('data-id');
    const pin=prompt("PIN:"); if(pin!==ADMIN_PIN) return alert("PIN faux");
    const all=await getProduitsFromBin(); await saveProduitsToBin(all.filter(p=>String(p.id)!==String(id))); card.remove();
}
window.deleteSelectedProducts = async function(){
    const cbs=document.querySelectorAll('.select-product-checkbox:checked'); if(!cbs.length) return alert("Rien sélectionné");
    const pin=prompt("PIN:"); if(pin!==ADMIN_PIN) return alert("PIN faux");
    const ids=Array.from(cbs).map(c=>String(c.value)); const all=await getProduitsFromBin();
    await saveProduitsToBin(all.filter(p=>!ids.includes(String(p.id)))); chargerProduits();
}
function searchProducts(){
    const q=(document.getElementById('searchProduct')?.value||"").toLowerCase();
    document.querySelectorAll('.product-card').forEach(c=>{
        const n=c.querySelector('.product-name')?.textContent.toLowerCase()||"";
        c.style.display=n.includes(q)?"":"none";
    });
    }
