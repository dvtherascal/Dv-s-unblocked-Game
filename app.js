// ── Storage helpers ──
function getUser(){ try{ return JSON.parse(localStorage.getItem('dvs_user'))||null; }catch(e){ return null; } }
function saveUser(u){ localStorage.setItem('dvs_user', JSON.stringify(u)); }
function getAllAccounts(){ try{ return JSON.parse(localStorage.getItem('dvs_accounts'))||{}; }catch(e){ return {}; } }
function saveAllAccounts(a){ localStorage.setItem('dvs_accounts', JSON.stringify(a)); }

// ── Current game being previewed ──
var currentGame = null;

// ── LOGIN ──
function doLogin(){
  var name = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var username = document.getElementById('regUsername').value.trim();
  var err = document.getElementById('loginError');

  if(!name){ err.textContent='Please enter your name!'; return; }
  if(!email || !email.includes('@')){ err.textContent='Please enter a valid email!'; return; }
  if(!username || username.length < 2){ err.textContent='Username must be at least 2 characters!'; return; }
  if(!/^[a-zA-Z0-9_]+$/.test(username)){ err.textContent='Username: letters, numbers and _ only!'; return; }

  var all = getAllAccounts();
  var key = username.toLowerCase();

  // Check if email already used by different username
  var emailKey = email.toLowerCase();
  var existingByEmail = Object.values(all).find(function(u){ return u.email && u.email.toLowerCase() === emailKey; });
  if(existingByEmail && existingByEmail.username.toLowerCase() !== key){
    err.textContent = 'That email is already linked to @' + existingByEmail.username;
    return;
  }

  var user = all[key] || {
    username: username,
    name: name,
    email: email,
    since: new Date().toLocaleDateString(),
    gamesPlayed: 0,
    history: [],
    friends: [],
    friendRequests: []
  };

  // Update name/email if returning user
  user.name = name;
  user.email = email;

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

// ── BOOT ──
(function init(){
  var user = getUser();
  if(user){
    // Refresh from accounts store in case friends updated
    var all = getAllAccounts();
    var fresh = all[user.username.toLowerCase()];
    if(fresh){ saveUser(fresh); user = fresh; }
    bootSignedIn(user);
  } else {
    document.getElementById('loginModal').classList.remove('hidden');
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
  document.getElementById('navAvatar').textContent = 'G';
  renderGuestGrid();
}

// ── NAV ──
function renderNav(user){
  document.getElementById('navAvatar').textContent = (user.username||'G')[0].toUpperCase();
  document.getElementById('navUsername').textContent = user.username||'Guest';
  document.getElementById('heroName').textContent = user.name || user.username || 'Player';
}

// ── GAME POPUP ──
function openPopup(game){
  currentGame = game;
  document.getElementById('popupThumb').src = game.thumb;
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
  }
  else if(mode === 'blank' || mode === 'blankfull'){
    var w = window.open('about:blank','_blank');
    if(!w){ alert('Allow pop-ups for this site then try again!'); return; }
    var fs = mode === 'blankfull' ? 'style="position:fixed;inset:0;width:100%;height:100%;border:none"' : 'style="width:100%;height:100%;border:none"';
    w.document.write(
      '<!DOCTYPE html><html><head><title>'+name+'</title>' +
      '<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}</style>' +
      '</head><body>' +
      '<iframe src="'+url+'" '+fs+' allow="autoplay;fullscreen;gamepad" allowfullscreen></iframe>' +
      '</body></html>'
    );
    w.document.close();
    closePopup();
  }
  else if(mode === 'fullscreen'){
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

// ── HISTORY ──
function saveHistory(game){
  var u = getUser();
  if(!u) return;
  u.history = (u.history||[]).filter(function(h){ return h.id !== game.id; });
  u.history.unshift({ id:game.id, name:game.name, thumb:game.thumb, color:game.color, ts:Date.now() });
  if(u.history.length > 12) u.history = u.history.slice(0,12);
  u.gamesPlayed = (u.gamesPlayed||0) + 1;
  saveUser(u);
  var all = getAllAccounts();
  all[u.username.toLowerCase()] = u;
  saveAllAccounts(all);
  // refresh continue row
  var row = document.getElementById('continueRow');
  var sec = document.getElementById('continueSection');
  if(row && sec){ sec.style.display='block'; row.innerHTML=''; u.history.forEach(function(h){ var g=GAMES.find(function(g){return g.id===h.id;}); if(g) row.appendChild(makeCard(g)); }); }
}

// ── CARD BUILDER ──
function makeCard(game){
  var div = document.createElement('div');
  div.className = 'game-card';
  div.setAttribute('data-name', game.name.toLowerCase());
  var badge = game.hot ? '<span class="card-badge badge-hot">🔥 HOT</span>' : game.isNew ? '<span class="card-badge badge-new">✨ NEW</span>' : '';
  div.innerHTML =
    '<div class="card-thumb" style="background:'+game.color+'">' +
      '<img src="'+game.thumb+'" alt="'+game.name+'" onerror="this.style.display=\'none\'">' +
      badge +
    '</div>' +
    '<div class="card-body">' +
      '<div class="card-name">'+game.name+'</div>' +
    '</div>';
  div.addEventListener('click', function(){ openPopup(game); });
  return div;
}

// ── GUEST CARD (Classroom 6x style) ──
function makeGuestCard(game){
  var div = document.createElement('div');
  div.className = 'c6x-card';
  div.innerHTML =
    '<div class="c6x-thumb" style="background:'+game.color+'">' +
      '<img src="'+game.thumb+'" alt="'+game.name+'" onerror="this.style.display=\'none\'">' +
    '</div>' +
    '<div class="c6x-name">'+game.name+'</div>';
  div.addEventListener('click', function(){
    currentGame = game;
    openPopup(game);
  });
  return div;
}

// ── RENDER ──
function renderUserPage(user){
  var cont = document.getElementById('continueSection');
  var row = document.getElementById('continueRow');
  if(cont && row && user.history && user.history.length > 0){
    cont.style.display = 'block';
    row.innerHTML = '';
    user.history.forEach(function(h){
      var g = GAMES.find(function(g){ return g.id===h.id; });
      if(g) row.appendChild(makeCard(g));
    });
  }
  var hotRow = document.getElementById('hotRow');
  if(hotRow){ hotRow.innerHTML=''; GAMES.filter(function(g){ return g.hot; }).forEach(function(g){ hotRow.appendChild(makeCard(g)); }); }
  var grid = document.getElementById('allGrid');
  if(grid){ grid.innerHTML=''; GAMES.forEach(function(g){ grid.appendChild(makeCard(g)); }); }
}

function renderGuestGrid(){
  var grid = document.getElementById('guestGrid');
  if(!grid) return;
  grid.innerHTML = '';
  GAMES.forEach(function(g){ grid.appendChild(makeGuestCard(g)); });
}

// ── SEARCH ──
function filterGames(){
  var q = (document.getElementById('searchInput').value||'').toLowerCase().trim();
  document.querySelectorAll('#allGrid .game-card, #guestGrid .c6x-card').forEach(function(c){
    c.style.display = (!q || (c.getAttribute('data-name')||'').includes(q)) ? '' : 'none';
  });
  var noR = document.getElementById('noResults');
  if(noR){
    var vis = document.querySelectorAll('#allGrid .game-card:not([style*="none"])').length;
    noR.style.display = (q && vis===0) ? 'block' : 'none';
  }
}
