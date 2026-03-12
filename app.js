// --- API Configurations (ID စစ်ရန်အတွက်သာ) ---
const API = 'https://ffymoodon.store'; 
const KEY = 'Ak9#Xm2$Pv5@Lz8R';

// --- ယာယီ Data များ ---
let currentUserId = 'guest_user'; 
let selectedSku = null, basePrice = 0, currentCode = 'mlbb_global', verifiedIGN = '', currentQty = 1;

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", () => {
    goTo('home');
});

// --- Navigation & Views ---
function goTo(page) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById('checkout-bar').style.display = 'none';
    
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    
    if (page === 'history') {
        document.getElementById('history-view').style.display = 'block';
        openWebHistory();
        if(document.querySelectorAll('.nav-tab')[1]) document.querySelectorAll('.nav-tab')[1].classList.add('active'); 
    } else if (page === 'product') {
        document.getElementById('product-view').style.display = 'block';
    } else {
        document.getElementById('home-view').style.display = 'block';
        if(document.querySelectorAll('.nav-tab')[0]) document.querySelectorAll('.nav-tab')[0].classList.add('active'); 
    }
    window.scrollTo(0,0);
}

// --- Game Logic ---
function openGame(code, name) {
    currentCode = code;
    if(document.getElementById('view-title')) document.getElementById('view-title').innerText = name;
    if(document.getElementById('p-id')) document.getElementById('p-id').value = '';
    if(document.getElementById('p-zone')) document.getElementById('p-zone').value = '';
    if(document.getElementById('ign-display')) document.getElementById('ign-display').innerHTML = '';
    verifiedIGN = '';
    
    document.querySelectorAll('.region-tab').forEach(t => t.classList.remove('active'));
    let firstTab = document.querySelector('.region-tab');
    if(firstTab) firstTab.classList.add('active');
    
    loadProducts(code);
    goTo('product');
}

function changeRegion(code, el) {
    document.querySelectorAll('.region-tab').forEach(t => t.classList.remove('active')); 
    el.classList.add('active'); 
    loadProducts(code);
}

// --- Load Products (Offline / Dummy Data) ---
function loadProducts(code) {
    const list = document.getElementById('diamond-list');
    list.innerHTML = `<div style="text-align:center; padding:30px; color: var(--accent);">Loading Items...</div>`;
    
    setTimeout(() => {
        const dummyItems = [
            { sku: 'ml_wdp', name: 'Weekly Diamond Pass', price: 7500, img: 'https://cdn-icons-png.flaticon.com/512/3762/3762699.png' },
            { sku: 'ml_tp', name: 'Twilight Pass', price: 34500, img: 'https://cdn-icons-png.flaticon.com/512/3762/3762699.png' },
            { sku: 'ml_50', name: '50+50 Diamonds', price: 4900, img: 'https://cdn-icons-png.flaticon.com/512/3762/3762699.png' },
            { sku: 'ml_150', name: '150+150 Diamonds', price: 14500, img: 'https://cdn-icons-png.flaticon.com/512/3762/3762699.png' },
            { sku: 'ml_250', name: '250+250 Diamonds', price: 17500, img: 'https://cdn-icons-png.flaticon.com/512/3762/3762699.png' },
            { sku: 'ml_500', name: '500+500 Diamonds', price: 50480, img: 'https://cdn-icons-png.flaticon.com/512/3762/3762699.png' }
        ];
        
        list.innerHTML = "";
        let header = document.createElement('div');
        header.className = 'cat-header'; header.innerHTML = "🎁 Top Up Items";
        list.appendChild(header);

        let grid = document.createElement('div'); grid.className = 'product-grid';
        dummyItems.forEach(item => {
            let div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <img src="${item.img}" class="p-img">
                <div class="p-name">${item.name}</div>
                <div class="p-price">${item.price.toLocaleString()} Ks</div>
            `;
            div.onclick = () => {
                document.querySelectorAll('.product-item').forEach(i => i.classList.remove('selected'));
                div.classList.add('selected'); 
                selectedSku = item.sku; basePrice = item.price; currentQty = 1;
                updatePriceUI();
                document.getElementById('checkout-bar').style.display = 'flex';
            };
            grid.appendChild(div);
        });
        list.appendChild(grid);
    }, 200);
}

// --- ID Checking (⭐️ API ဖြင့် ပြန်လည်ချိတ်ဆက်ထားသည် ⭐️) ---
function handleCheckID() {
    const id = document.getElementById('p-id').value;
    const zone = document.getElementById('p-zone').value;
    const disp = document.getElementById('ign-display');
    
    if(!id || !zone) return Swal.fire('Oops', 'ID နှင့် Zone အပြည့်အစုံထည့်ပါ', 'warning');
    disp.innerHTML = 'Checking on Server...';
    
    fetch(`${API}/api/check_id`, { 
        method:'POST', headers:{'Content-Type':'application/json','X-API-Key':KEY}, 
        body:JSON.stringify({player_id:id, zone_id:zone, game:currentCode}) 
    })
    .then(r=>r.json()).then(d => {
        if(d.success) { 
            verifiedIGN = d.username; 
            disp.innerHTML = `✅ ${d.username}`; 
        } else { 
            disp.innerHTML = `❌ Not Found`; verifiedIGN = ''; 
        }
    }).catch(err => {
        disp.innerHTML = `❌ Connection Error`; verifiedIGN = '';
    });
}

function handlePaste() { 
    navigator.clipboard.readText().then(t => { 
        let m = t.match(/\d+/g); 
        if(m) { 
            if(document.getElementById('p-id')) document.getElementById('p-id').value=m[0]; 
            if(m[1] && document.getElementById('p-zone')) document.getElementById('p-zone').value=m[1]; 
            handleCheckID(); 
        } 
    }); 
}

// --- Checkout Logic ---
function updateQty(change) { if(currentQty + change >= 1) { currentQty += change; updatePriceUI(); } }

function updatePriceUI() {
    if(document.getElementById('qty-text')) document.getElementById('qty-text').innerText = currentQty;
    if(document.getElementById('selected-price')) document.getElementById('selected-price').innerText = (basePrice * currentQty).toLocaleString() + " Ks";
}

function closeCheckout() { 
    document.getElementById('checkout-bar').style.display = 'none'; 
    document.querySelectorAll('.product-item').forEach(i => i.classList.remove('selected'));
}

function initiateBuy() {
    if(!verifiedIGN) return Swal.fire('Wait!', 'ကျေးဇူးပြု၍ VERIFY ID အရင်နှိပ်ပေးပါ', 'warning');
    
    Swal.fire({title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
    
    setTimeout(() => {
        Swal.fire('Success', 'ဝယ်ယူမှု အောင်မြင်ပါသည်', 'success'); 
        closeCheckout(); goTo('history');
    }, 1000);
}

// --- Order History (Offline / Dummy Data) ---
function openWebHistory() {
    const list = document.getElementById('full-history-list');
    list.innerHTML = 'Loading history...';

    setTimeout(() => {
        const dummyHistory = [
            { item_name: 'Weekly Diamond Pass', price: 7500, target: '12345678 (1234)', time: new Date().toLocaleString() }
        ];
        
        let html = "";
        dummyHistory.forEach(o => {
            html += `
            <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; margin-bottom:5px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; color: #fff;">
                    <span>${o.item_name}</span>
                    <span style="color: #39ff14;">${(o.price||0).toLocaleString()} Ks</span>
                </div>
                <div style="font-size: 11px; color: #aaa; margin-top: 5px;">
                    ID: ${o.target} | Time: ${o.time}
                </div>
            </div>`;
        });
        list.innerHTML = html;
    }, 300);
}
