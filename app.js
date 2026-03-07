function getUser(){
  try{ return JSON.parse(localStorage.getItem('dvs_user'))||null; }
  catch(e){ return null; }
}

function saveUser(u){
  localStorage.setItem('dvs_user', JSON.stringify(u));
}

function doLogin(){
  var raw = document.getElementById('loginUsername').value.trim();
  var err = document.getElementById('loginError');
  if(!raw){ err.textContent='Please enter a username!'; return; }
  if(raw.length < 2){ err.textContent='At least 2 characters!'; return; }
  if(!/^[a-zA-Z0-9_]+$/.test(raw)){ err.textContent='Letters, numbers and _ only!'; return; }
  var all = {};
  try{ all = JSON.parse(localStorage.getItem('dvs_accounts'))||{}; }catch(e){}
  var user = all[raw.toLowerCase()] || { username:raw, since:new Date().toLocaleDateString(), gamesPlayed:0, history:[] };
  saveUser(user);
  all[raw.toLowerCase()] = user;
  localStorage.setItem('dvs_accounts', JSON.stringify(all));
  document.getElementById('loginModal').classList.add('hidden');
  renderNav(user);
  renderPage(user);
}

function doGuest(){
  var user = { username:'Guest', since:'Today', gamesPlayed:0, history:[] };
  saveUser(user);
  document.getElementById('loginModal').classList.add('hidden');
  renderNav(user);
  renderPage(user);
}

function doLogout(){
  localStorage.removeItem('dvs_user');
  location.reload();
}

function openGame(name, url){
  var w = window.open('about:blank', '_blank');
  if(!w){ alert('Allow pop-ups for this site then try again!'); return; }
  w.document.write(
    '<!DOCTYPE html><html>' +
    '<head><title>' + name + '</title>' +
    '<style>' +
    '* { margin:0; padding:0; box-sizing:border-box; }' +
    'html, body { width:100%; height:100%; overflow:hidden; background:#000; }' +
    'iframe { position:fixed; inset:0; width:100%; height:100%; border:none; }' +
    '</style></head>' +
    '<body>' +
    '<iframe src="' + url + '" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>' +
    '</body></html>'
  );
  w.document.close();
}

function saveHistory(game){
  try{
    var u = getUser();
    if(!u) return;
    u.history = (u.history||[]).filter(function(h){ return h.id !== game.id; });
    u.history.unshift({ id:game.id, name:game.name, emoji:game.emoji, ts:Date.now() });
    if(u.history.length > 8) u.history = u.history.slice(0,8);
    u.gamesPlayed = (u.gamesPlayed||0) + 1;
    saveUser(u);
    var all = {};
    try{ all = JSON.parse(localStorage.getItem('dvs_accounts'))||{}; }catch(e){}
    all[(u.username||'guest').toLowerCase()] = u;
    localStorage.setItem('dvs_accounts', JSON.stringify(all));
  }catch(e){}
}

function renderNav(user){
  var av = document.getElementById('navAvatar');
  var un = document.getElementById('navUsername');
  var hn = document.getElementById('heroName');
  if(av) av.textContent = (user.username||'G')[0].toUpperCase();
  if(un) un.textContent = user.username||'Guest';
  if(hn) hn.textContent = user.username||'Player';
}

function makeCard(game){
  var a = document.createElement('a');
  a.href = '#';
  a.className = 'game-card';
  a.setAttribute('data-name', game.name.toLowerCase());
  var badge = game.hot
    ? '<span class="card-badge badge-hot">🔥 HOT</span>'
    : game.isNew
    ? '<span class="card-badge badge-new">✨ NEW</span>'
    : '';
  a.innerHTML =
    '<div class="thumb-fallback">' + game.emoji + '</div>' +
    '<div class="card-body">' +
      '<div class="card-name">' + game.name + '</div>' +
      '<div class="card-meta">👍 ' + game.rating + '  👥 ' + game.players + '</div>' +
      badge +
    '</div>';
  a.addEventListener('click', function(e){
    e.preventDefault();
    saveHistory(game);
    openGame(game.name, game.url);
  });
  return a;
}

function renderPage(user){
  var cont = document.getElementById('continueSection');
  var row = document.getElementById('continueRow');
  if(cont && row && user.history && user.history.length > 0){
    cont.style.display = 'block';
    row.innerHTML = '';
    user.history.forEach(function(h){
      var g = GAMES.find(function(g){ return g.id === h.id; });
      if(g) row.appendChild(makeCard(g));
    });
  }
  var hotRow = document.getElementById('hotRow');
  if(hotRow){
    hotRow.innerHTML = '';
    GAMES.filter(function(g){ return g.hot; }).forEach(function(g){
      hotRow.appendChild(makeCard(g));
    });
  }
  var grid = document.getElementById('allGrid');
  if(grid){
    grid.innerHTML = '';
    GAMES.forEach(function(g){ grid.appendChild(makeCard(g)); });
  }
}

function filterGames(){
  var q = (document.getElementById('searchInput').value||'').toLowerCase().trim();
  var cards = document.querySelectorAll('#allGrid .game-card');
  var visible = 0;
  cards.forEach(function(c){
    if(!q || c.getAttribute('data-name').includes(q)){
      c.style.display = '';
      visible++;
    } else {
      c.style.display = 'none';
    }
  });
  var noR = document.getElementById('noResults');
  if(noR) noR.style.display = (q && visible === 0) ? 'block' : 'none';
}

(function init(){
  var modal = document.getElementById('loginModal');
  var user = getUser();
  if(user){
    if(modal) modal.classList.add('hidden');
    renderNav(user);
    renderPage(user);
  } else {
    if(modal) modal.classList.remove('hidden');
  }
})();
