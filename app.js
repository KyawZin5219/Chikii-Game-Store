// --- API Configurations ---
const API = 'http://127.0.0.1:8000'; // မိမိ Local (သို့) Server Backend လမ်းကြောင်း
const KEY = 'Ak9#Xm2$Pv5@Lz8R';

// Login ဖြုတ်လိုက်သဖြင့် ယာယီ User ID သုံးပါမည် (Mini App သုံးပါက Telegram User ID ပြောင်းထည့်နိုင်ပါသည်)
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
        document.querySelectorAll('.nav-tab')[1].classList.add('active'); // History tab active
    } else if (page === 'product') {
        document.getElementById('product-view').style.display = 'block';
    } else {
        document.getElementById('home-view').style.display = 'block';
        document.querySelectorAll('.nav-tab')[0].classList.add('active'); // Home tab active
    }
    window.scrollTo(0,0);
}

// --- Game Logic (MLBB Only) ---
function openGame(code, name) {
    currentCode = code;
    document.getElementById('view-title').innerText = name;
    document.getElementById('p-id').value = '';
    document.getElementById('p-zone').value = '';
    document.getElementById('ign-display').innerHTML = '';
    verifiedIGN = '';
    
    document.querySelectorAll('.region-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.region-tab').classList.add('active');
    
    loadProducts(code);
    goTo('product');
}

function changeRegion(code, el) {
    document.querySelectorAll('.region-tab').forEach(t => t.classList.remove('active')); 
    el.classList.add('active'); 
    loadProducts(code);
}

function loadProducts(code) {
    currentCode = code;
    const list = document.getElementById('diamond-list');
    list.innerHTML = `<div style="text-align:center; padding:30px; color: var(--accent);">Loading Items...</div>`;
    
    fetch(`${API}/api/products/${code}`, { headers: {'X-API-Key': KEY} })
    .then(r=>r.json()).then(data => {
        list.innerHTML = "";
        if(!data.items || !data.items.length) { list.innerHTML = `<div style="text-align:center;">No items.</div>`; return; }
        renderCategory("🎁 Top Up Items", data.items, list);
    }).catch(() => {
        list.innerHTML = `<div style="text-align:center; color:#ff3333;">Error loading products.</div>`;
    });
}

function renderCategory(title, items, container) {
    if(items.length === 0) return;
    const header = document.createElement('div');
    header.className = 'cat-header'; header.innerHTML = title; container.appendChild(header);

    const grid = document.createElement('div'); grid.className = 'product-grid';
    items.forEach(item => {
        let div = document.createElement('div'); div.className = 'product-item';
        div.innerHTML = `
            <img src="${item.img || 'https://cdn-icons-png.flaticon.com/512/3762/3762699.png'}" class="p-img">
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
    container.appendChild(grid);
}

// --- ID Checking ---
function handleCheckID() {
    const id = document.getElementById('p-id').value, zone = document.getElementById('p-zone').value;
    const disp = document.getElementById('ign-display');
    
    if(!id || !zone) return Swal.fire('Oops', 'ID နှင့် Zone အပြည့်အစုံထည့်ပါ', 'warning');
    disp.innerHTML = 'Checking...';
    
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
    }).catch(() => {
        disp.innerHTML = `❌ Error`;
    });
}

function handlePaste() { 
    navigator.clipboard.readText().then(t => { 
        let m = t.match(/\d+/g); 
        if(m) { 
            document.getElementById('p-id').value=m[0]; 
            if(m[1]) document.getElementById('p-zone').value=m[1]; 
            handleCheckID(); 
        } 
    }); 
}

// --- Checkout ---
function updateQty(change) { if(currentQty + change >= 1) { currentQty += change; updatePriceUI(); } }
function updatePriceUI() {
    document.getElementById('qty-text').innerText = currentQty;
    document.getElementById('selected-price').innerText = (basePrice * currentQty).toLocaleString() + " Ks";
}
function closeCheckout() { document.getElementById('checkout-bar').style.display = 'none'; }

function initiateBuy() {
    if(!verifiedIGN) return Swal.fire('Wait!', 'ကျေးဇူးပြု၍ VERIFY ID အရင်နှိပ်ပေးပါ', 'warning');
    
    const idVal = document.getElementById('p-id').value;
    const zoneVal = document.getElementById('p-zone').value;

    Swal.fire({title: 'Processing...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
    
    // Authorization (Token) ဖြုတ်ထားပါသည်
    fetch(`${API}/api/buy`, { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json', 'X-API-Key': KEY}, 
        body: JSON.stringify({ 
            user_id: currentUserId, sku: selectedSku, game_code: currentCode, 
            player_id: idVal, zone_id: zoneVal, ign: verifiedIGN, quantity: currentQty 
        }) 
    })
    .then(r=>r.json()).then(res => {
        if(res.success) { 
            Swal.fire('Success', 'ဝယ်ယူမှု အောင်မြင်ပါသည်', 'success'); 
            closeCheckout(); goTo('history');
        } else { 
            Swal.fire('Error', res.message || 'ဝယ်ယူမှု မအောင်မြင်ပါ', 'error'); 
        }
    }).catch(() => {
        Swal.fire('Error', 'Connection Error!', 'error'); 
    });
}

// --- Order History ---
function openWebHistory() {
    const list = document.getElementById('full-history-list');
    list.innerHTML = 'Loading history...';

    // Authorization (Token) ဖြုတ်ထားပါသည်
    fetch(`${API}/api/history/${currentUserId}`, { 
        headers: { 'X-API-Key': KEY } 
    })
    .then(r => r.json()).then(data => {
        if(!data.history || data.history.length === 0) {
            list.innerHTML = '<div style="text-align:center; color:#888; padding:20px;">မှတ်တမ်းမရှိသေးပါ။</div>'; return;
        }
        
        let html = "";
        data.history.forEach(o => {
            html += `
            <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; margin-bottom:5px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; color: #fff;">
                    <span>${o.item_name || 'Topup'}</span>
                    <span style="color: #39ff14;">${(o.price||0).toLocaleString()} Ks</span>
                </div>
                <div style="font-size: 11px; color: #aaa; margin-top: 5px;">
                    ID: ${o.target || o.raw_id} | Time: ${o.time}
                </div>
            </div>`;
        });
        list.innerHTML = html;
    }).catch(() => {
        list.innerHTML = '<div style="text-align:center; color:#ff3333; padding:20px;">မှတ်တမ်းဆွဲယူ၍ မရပါ။</div>';
    });
}
