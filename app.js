var currentGame = null;
var ADMIN_CODE = "DvRascals";
var BLOCKED_GAMES_KEY = "dvs_blocked_games";

function getUser(){ try{ return JSON.parse(localStorage.getItem('dvs_user'))||null; }catch(e){ return null; } }
function saveUser(u){ localStorage.setItem('dvs_user', JSON.stringify(u)); }
function getAllAccounts(){ try{ return JSON.parse(localStorage.getItem('dvs_accounts'))||{}; }catch(e){ return {}; } }
function saveAllAccounts(a){ localStorage.setItem('dvs_accounts', JSON.stringify(a)); }
function getBlockedGames(){ try{ return JSON.parse(localStorage.getItem(BLOCKED_GAMES_KEY))||[]; }catch(e){ return []; } }
function saveBlockedGames(b){ localStorage.setItem(BLOCKED_GAMES_KEY, JSON.stringify(b)); }
function isAdmin(user){ return user && user.isAdmin === true; }

function doLogin(){
  var name = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var username = document.getElementById('regUsername').value.trim();
  var secret = document.getElementById('regSecret').value.trim();
  var err = document.getElementById('loginError');

  if(!name){ err.textContent='Please enter your name!'; return; }
  if(!email || !email.includes('@')){ err.textContent='Please enter a valid email!'; return; }
  if(!username || username.length < 2){ err.textContent='Username must be at least 2 characters!'; return; }
  if(!/^[a-zA-Z0-9_]+$/.test(username)){ err.textContent='Username: letters, numbers and _ only!'; return; }

  var all = getAllAccounts();
  var key = username.toLowerCase();
  var emailKey = email.toLowerCase();
  var existingByEmail = Object.values(all).find(function(u){ return u.email && u.email.toLowerCase() === emailKey; });
  if(existingByEmail && existingByEmail.username.toLowerCase() !== key){
    err.textContent = 'That email is already linked to @' + existingByEmail.username;
    return;
  }

  var bannedList = JSON.parse(localStorage.getItem('dvs_banned')||'[]');
  if(bannedList.includes(key)){ err.textContent = 'This account has been banned.'; return; }

  var user = all[key] || {
    username: username,
    name: name,
    email: email,
    since: new Date().toLocaleDateString(),
    gamesPlayed: 0,
    history: [],
    friends: [],
    friendRequests: [],
    pfp: null,
    isAdmin: false
  };

  user.name = name;
  user.email = email;
  if(secret === ADMIN_CODE) user.isAdmin = true;

  saveUser(user);
  all[key] = user;
  saveAllAccounts(all);

  document.getElementById('loginModal').classList.add('hidden');
  bootSignedIn(user);
}

function doGuest(){
  document.getElementById('loginModal').classList.add('hidden');
  bootGuest();
}

function doLogout(){
  localStorage.removeItem('dvs_user');
  location.reload();
}

(function init(){
  var user = getUser();
  if(user){
    var all = getAllAccounts();
    var fresh = all[user.username.toLowerCase()];
    if(fresh){ saveUser(fresh); user = fresh; }
    var bannedList = JSON.parse(localStorage.getItem('dvs_banned')||'[]');
    if(bannedList.includes(user.username.toLowerCase())){ localStorage.removeItem('dvs_user'); location.reload(); return; }
    bootSignedIn(user);
  } else {
    document.getElementById('loginModal').classList.remove('hidden');
  }

  // Secret admin panel — only shows when clicking the logo
  var logo = document.getElementById('navLogo');
  if(logo){
    logo.addEventListener('click', function(){
      var u = getUser();
      if(u && isAdmin(u)) showAdminPanel();
    });
  }
})();

function bootSignedIn(user){
  document.getElementById('guestView').style.display = 'none';
  document.getElementById('userView').style.display = 'block';
  document.getElementById('friendsNavBtn').style.display = 'flex';
  document.getElementById('profileNavBtn').style.display = 'flex';
  document.getElementById('navMid').style.display = 'flex';
  renderNav(user);
  renderUserPage(user);
}

function bootGuest(){
  document.getElementById('guestView').style.display = 'block';
  document.getElementById('userView').style.display = 'none';
  document.getElementById('navUsername').textContent = 'Guest';
  document.getElementById('navAvatar').innerHTML = 'G';
  renderGuestGrid();
}

function renderNav(user){
  document.getElementById('navUsername').textContent = user.username||'Guest';
  var av = document.getElementById('navAvatar');
  if(user.pfp){
    av.innerHTML = '<img src="'+user.pfp+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
  } else {
    av.innerHTML = (user.username||'G')[0].toUpperCase();
  }
  document.getElementById('heroName').textContent = user.name || user.username || 'Player';
}

// ── ADMIN PANEL ──
function showAdminPanel(){
  var existing = document.getElementById('adminPanel');
  if(existing){ existing.remove(); return; }
  var all = getAllAccounts();
  var banned = JSON.parse(localStorage.getItem('dvs_banned')||'[]');
  var blocked = getBlockedGames();

  var panel = document.createElement('div');
  panel.id = 'adminPanel';
  panel.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.95);overflow-y:auto;padding:20px;font-family:Nunito,sans-serif;';

  var userRows = Object.values(all).map(function(u){
    var isBanned = banned.includes(u.username.toLowerCase());
    return '<div style="display:flex;align-items:center;gap:10px;background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:10px 14px;margin-bottom:8px;">' +
      '<div style="width:36px;height:36px;border-radius:50%;background:#00d4ff;color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;">'+(u.pfp?'<img src="'+u.pfp+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">':u.username[0].toUpperCase())+'</div>' +
      '<div style="flex:1;"><div style="font-weight:900;color:#e8e8f0;">@'+u.username+'</div><div style="font-size:.75rem;color:#7878a0;">'+u.name+' • '+u.email+'</div></div>' +
      (isBanned
        ? '<button onclick="adminUnban(\''+u.username+'\')" style="background:#2ed573;color:#000;border:none;padding:6px 14px;border-radius:8px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;">Unban</button>'
        : '<button onclick="adminBan(\''+u.username+'\')" style="background:#ff4757;color:#fff;border:none;padding:6px 14px;border-radius:8px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;">Ban</button>') +
      '</div>';
  }).join('');

  var gameRows = GAMES.map(function(g){
    var isBlocked = blocked.includes(g.id);
    return '<div style="display:flex;align-items:center;gap:10px;background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:10px 14px;margin-bottom:8px;">' +
      '<div style="font-size:1.2rem;">🎮</div>' +
      '<div style="flex:1;font-weight:900;color:#e8e8f0;">'+g.name+'</div>' +
      (isBlocked
        ? '<span style="color:#ff4757;font-size:.8rem;margin-right:8px;">🚫 BLOCKED</span><button onclick="adminUnblockGame(\''+g.id+'\')" style="background:#2ed573;color:#000;border:none;padding:6px 14px;border-radius:8px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;">Unblock</button>'
        : '<button onclick="adminBlockGame(\''+g.id+'\')" style="background:#ff6b35;color:#fff;border:none;padding:6px 14px;border-radius:8px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;">Block</button>') +
      '</div>';
  }).join('');

  panel.innerHTML =
    '<div style="max-width:600px;margin:0 auto;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">' +
      '<h2 style="color:#FFD700;font-size:1.4rem;">🛡️ Admin Panel</h2>' +
      '<button onclick="document.getElementById(\'adminPanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:8px 16px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>' +
    '</div>' +
    '<h3 style="color:#e8e8f0;margin-bottom:12px;font-size:1rem;">👥 Users ('+Object.keys(all).length+')</h3>' +
    userRows +
    '<h3 style="color:#e8e8f0;margin:20px 0 12px;font-size:1rem;">🎮 Games</h3>' +
    gameRows +
    '</div>';
  document.body.appendChild(panel);
}

function adminBan(username){
  var banned = JSON.parse(localStorage.getItem('dvs_banned')||'[]');
  if(!banned.includes(username.toLowerCase())) banned.push(username.toLowerCase());
  localStorage.setItem('dvs_banned', JSON.stringify(banned));
  showAdminPanel(); showAdminPanel();
}

function adminUnban(username){
  var banned = JSON.parse(localStorage.getItem('dvs_banned')||'[]');
  banned = banned.filter(function(b){ return b !== username.toLowerCase(); });
  localStorage.setItem('dvs_banned', JSON.stringify(banned));
  showAdminPanel(); showAdminPanel();
}

function adminBlockGame(gameId){
  var blocked = getBlockedGames();
  if(!blocked.includes(gameId)) blocked.push(gameId);
  saveBlockedGames(blocked);
  showAdminPanel(); showAdminPanel();
}

function adminUnblockGame(gameId){
  var blocked = getBlockedGames().filter(function(b){ return b !== gameId; });
  saveBlockedGames(blocked);
  showAdminPanel(); showAdminPanel();
}

// ── POPUP ──
function openPopup(game){
  var blocked = getBlockedGames();
  if(blocked.includes(game.id)){
    alert('🚫 This game has been blocked by an admin.\n\nCheck back later for updates!');
    return;
  }
  currentGame = game;
  var thumb = document.getElementById('popupThumb');
  if(game.thumb === 'ULTRAKILL_ICON'){
    thumb.src = 'ultrakill.png';
  } else {
    thumb.src = game.thumb;
  }
  thumb.onerror = function(){ this.style.display='none'; };
  document.getElementById('popupTitle').textContent = game.name;
  document.getElementById('popupDesc').textContent = game.desc;
  document.getElementById('gamePopup').classList.remove('hidden');
}

function closePopup(){
  document.getElementById('gamePopup').classList.add('hidden');
  currentGame = null;
}

function launchGame(mode){
  if(!currentGame) return;
  saveHistory(currentGame);
  var name = currentGame.name;
  var url = currentGame.url;

  if(mode === 'iframe'){
    closePopup();
    document.getElementById('inPageTitle').textContent = name;
    document.getElementById('inPageFrame').src = url;
    document.getElementById('inPageGame').classList.remove('hidden');
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('bnavBar').style.display = 'none';
  } else if(mode === 'blank' || mode === 'blankfull'){
    var w = window.open('about:blank','_blank');
    if(!w){ alert('Allow pop-ups for this site then try again!'); return; }
    w.document.write('<!DOCTYPE html><html><head><title>'+name+'</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}iframe{position:fixed;inset:0;width:100%;height:100%;border:none}</style></head><body><iframe src="'+url+'" allow="autoplay;fullscreen;gamepad" allowfullscreen></iframe></body></html>');
    w.document.close();
    closePopup();
  } else if(mode === 'fullscreen'){
    closePopup();
    document.getElementById('inPageTitle').textContent = name;
    document.getElementById('inPageFrame').src = url;
    document.getElementById('inPageGame').classList.remove('hidden');
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('bnavBar').style.display = 'none';
    setTimeout(function(){
      var el = document.getElementById('inPageFrame');
      if(el.requestFullscreen) el.requestFullscreen();
      else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }, 300);
  }
}

function closeInPage(){
  document.getElementById('inPageGame').classList.add('hidden');
  document.getElementById('inPageFrame').src = '';
  document.getElementById('navbar').style.display = 'flex';
  document.getElementById('bnavBar').style.display = 'flex';
}

function saveHistory(game){
  var u = getUser();
  if(!u) return;
  u.history = (u.history||[]).filter(function(h){ return h.id !== game.id; });
  u.history.unshift({ id:game.id, name:game.name, thumb:game.thumb === 'ULTRAKILL_ICON' ? 'ultrakill.png' : game.thumb, color:game.color, ts:Date.now() });
  if(u.history.length > 12) u.history = u.history.slice(0,12);
  u.gamesPlayed = (u.gamesPlayed||0) + 1;
  saveUser(u);
  var all = getAllAccounts();
  all[u.username.toLowerCase()] = u;
  saveAllAccounts(all);
  var row = document.getElementById('continueRow');
  var sec = document.getElementById('continueSection');
  if(row && sec){
    sec.style.display = 'block';
    row.innerHTML = '';
    u.history.forEach(function(h){ var g=GAMES.find(function(g){return g.id===h.id;}); if(g) row.appendChild(makeCard(g)); });
  }
}

function makeCard(game){
  var blocked = getBlockedGames();
  var isBlocked = blocked.includes(game.id);
  var div = document.createElement('div');
  div.className = 'game-card' + (isBlocked ? ' card-blocked' : '');
  div.setAttribute('data-name', game.name.toLowerCase());
  var badge = game.hot ? '<span class="card-badge badge-hot">🔥 HOT</span>' : game.isNew ? '<span class="card-badge badge-new">✨ NEW</span>' : '';
  var blockedOverlay = isBlocked ? '<div class="blocked-overlay">🚫<div class="blocked-text">Blocked</div></div>' : '';
  var thumbHtml = '';
  if(game.thumb === 'ULTRAKILL_ICON'){
    thumbHtml = '<img src="ultrakill.png" alt="'+game.name+'" style="width:100%;height:100%;object-fit:cover;">';
  } else {
    thumbHtml = '<img src="'+game.thumb+'" alt="'+game.name+'" onerror="this.parentElement.style.background=\''+game.color+'\';this.style.display=\'none\'">';
  }
  div.innerHTML =
    '<div class="card-thumb" style="background:'+game.color+'">' +
      thumbHtml + badge + blockedOverlay +
    '</div>' +
    '<div class="card-body"><div class="card-name">'+game.name+'</div></div>';
  div.addEventListener('click', function(){ openPopup(game); });
  return div;
}

function makeGuestCard(game){
  var blocked = getBlockedGames();
  var isBlocked = blocked.includes(game.id);
  var div = document.createElement('div');
  div.className = 'c6x-card' + (isBlocked ? ' card-blocked' : '');
  var thumbHtml = game.thumb === 'ULTRAKILL_ICON'
    ? '<img src="ultrakill.png" alt="'+game.name+'" style="width:100%;height:100%;object-fit:cover;">'
    : '<img src="'+game.thumb+'" alt="'+game.name+'" onerror="this.parentElement.style.background=\''+game.color+'\';this.style.display=\'none\'">';
  var blockedOverlay = isBlocked ? '<div class="blocked-overlay">🚫<div class="blocked-text">Blocked</div></div>' : '';
  div.innerHTML =
    '<div class="c6x-thumb" style="background:'+game.color+'">' + thumbHtml + blockedOverlay + '</div>' +
    '<div class="c6x-name">'+game.name+'</div>';
  div.addEventListener('click', function(){ openPopup(game); });
  return div;
}

function renderUserPage(user){
  var cont = document.getElementById('continueSection');
  var row = document.getElementById('continueRow');
  if(cont && row && user.history && user.history.length > 0){
    cont.style.display = 'block';
    row.innerHTML = '';
    user.history.forEach(function(h){ var g=GAMES.find(function(g){return g.id===h.id;}); if(g) row.appendChild(makeCard(g)); });
  }
  var hotRow = document.getElementById('hotRow');
  if(hotRow){ hotRow.innerHTML=''; GAMES.filter(function(g){return g.hot;}).forEach(function(g){ hotRow.appendChild(makeCard(g)); }); }
  var grid = document.getElementById('allGrid');
  if(grid){ grid.innerHTML=''; GAMES.forEach(function(g){ grid.appendChild(makeCard(g)); }); }
}

function renderGuestGrid(){
  var grid = document.getElementById('guestGrid');
  if(!grid) return;
  grid.innerHTML = '';
  GAMES.forEach(function(g){ grid.appendChild(makeGuestCard(g)); });
}

function filterGames(){
  var q = (document.getElementById('searchInput').value||'').toLowerCase().trim();
  document.querySelectorAll('#allGrid .game-card, #guestGrid .c6x-card').forEach(function(c){
    c.style.display = (!q || (c.getAttribute('data-name')||'').includes(q)) ? '' : 'none';
  });
}
