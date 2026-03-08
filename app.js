var currentGame = null;
var ADMIN_CODE = "DvRascals";
var BLOCKED_KEY = "dvs_blocked_games";
var BANNED_KEY = "dvs_banned";
var KICKED_KEY = "dvs_kicked";

function getUser(){ try{return JSON.parse(localStorage.getItem('dvs_user'))||null;}catch(e){return null;} }
function saveUser(u){ localStorage.setItem('dvs_user',JSON.stringify(u)); }
function getAllAccounts(){ try{return JSON.parse(localStorage.getItem('dvs_accounts'))||{};}catch(e){return{};} }
function saveAllAccounts(a){ localStorage.setItem('dvs_accounts',JSON.stringify(a)); }
function getBlockedGames(){ try{return JSON.parse(localStorage.getItem(BLOCKED_KEY))||[];}catch(e){return[];} }
function saveBlockedGames(b){ localStorage.setItem(BLOCKED_KEY,JSON.stringify(b)); }
function getBanned(){ try{return JSON.parse(localStorage.getItem(BANNED_KEY))||[];}catch(e){return[];} }
function saveBanned(b){ localStorage.setItem(BANNED_KEY,JSON.stringify(b)); }
function getKicked(){ try{return JSON.parse(localStorage.getItem(KICKED_KEY))||[];}catch(e){return[];} }
function saveKicked(k){ localStorage.setItem(KICKED_KEY,JSON.stringify(k)); }
function isAdmin(u){ return u && u.isAdmin===true; }

// ── MUSIC ──
var bgMusic = null;
function startMusic(){
  if(bgMusic) return;
  bgMusic = document.getElementById('bgMusic');
  if(bgMusic){
    bgMusic.volume = 0.25;
    bgMusic.loop = true;
    bgMusic.play().catch(function(){
      document.addEventListener('click', function once(){
        bgMusic.play();
        document.removeEventListener('click', once);
      });
    });
  }
}

// ── LOGIN ──
function doLogin(){
  var name = document.getElementById('regName').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var username = document.getElementById('regUsername').value.trim();
  var secret = document.getElementById('regSecret').value.trim();
  var err = document.getElementById('loginError');

  if(!name){err.textContent='Please enter your name!';return;}
  if(!email||!email.includes('@')){err.textContent='Please enter a valid email!';return;}
  if(!username||username.length<2){err.textContent='Username must be at least 2 chars!';return;}
  if(!/^[a-zA-Z0-9_]+$/.test(username)){err.textContent='Letters, numbers and _ only!';return;}

  var all = getAllAccounts();
  var key = username.toLowerCase();
  var emailLow = email.toLowerCase();

  var emailOwner = Object.values(all).find(function(u){ return u.email && u.email.toLowerCase()===emailLow; });
  if(emailOwner && emailOwner.username.toLowerCase()!==key){
    err.textContent='That email is already used by @'+emailOwner.username;
    return;
  }

  var banned = getBanned();
  if(banned.includes(key)){err.textContent='This account has been banned.';return;}

  var kicked = getKicked();
  if(kicked.includes(key)){
    saveKicked(kicked.filter(function(k){return k!==key;}));
  }

  var existing = all[key];
  if(existing && existing.email && existing.email.toLowerCase()!==emailLow){
    err.textContent='Username taken. Try another!';return;
  }

  var user = existing || {
    username: username, name: name, email: email,
    since: new Date().toLocaleDateString(),
    gamesPlayed:0, history:[], friends:[], friendRequests:[],
    pfp:null, isAdmin:false, lastSeen: Date.now()
  };
  user.name = name;
  user.email = email;
  user.lastSeen = Date.now();
  if(secret===ADMIN_CODE) user.isAdmin = true;

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
  var u = getUser();
  if(u){
    var all = getAllAccounts();
    u.lastSeen = Date.now();
    all[u.username.toLowerCase()] = u;
    saveAllAccounts(all);
  }
  localStorage.removeItem('dvs_user');
  location.reload();
}

// ── KICK CHECK ──
function checkKicked(){
  var u = getUser();
  if(!u) return;
  var kicked = getKicked();
  if(kicked.includes(u.username.toLowerCase())){
    localStorage.removeItem('dvs_user');
    alert('You have been kicked by an admin.');
    location.reload();
  }
}

// ── INIT ──
(function init(){
  var user = getUser();
  if(user){
    var all = getAllAccounts();
    var fresh = all[user.username.toLowerCase()];
    if(fresh){saveUser(fresh); user=fresh;}
    var banned = getBanned();
    if(banned.includes(user.username.toLowerCase())){
      localStorage.removeItem('dvs_user');
      location.reload(); return;
    }
    bootSignedIn(user);
    setInterval(checkKicked, 5000);
  } else {
    document.getElementById('loginModal').classList.remove('hidden');
  }

  // Logo secret click — admin only
  var logo = document.getElementById('navLogo');
  if(logo){
    logo.addEventListener('click',function(){
      var u=getUser();
      if(u&&isAdmin(u)) showAdminPanel();
    });
  }

  startMusic();
})();

function bootSignedIn(user){
  document.getElementById('guestView').style.display='none';
  document.getElementById('userView').style.display='block';
  document.getElementById('friendsNavBtn').style.display='flex';
  document.getElementById('profileNavBtn').style.display='flex';
  document.getElementById('creditsNavBtn').style.display='flex';
  document.getElementById('navMid').style.display='flex';
  renderNav(user);
  renderUserPage(user);
  startMusic();
}

function bootGuest(){
  document.getElementById('guestView').style.display='block';
  document.getElementById('userView').style.display='none';
  document.getElementById('navUsername').textContent='Guest';
  document.getElementById('navAvatar').innerHTML='G';
  if(document.getElementById('friendsNavBtn')) document.getElementById('friendsNavBtn').style.display='none';
  if(document.getElementById('profileNavBtn')) document.getElementById('profileNavBtn').style.display='none';
  if(document.getElementById('creditsNavBtn')) document.getElementById('creditsNavBtn').style.display='none';
  renderGuestGrid();
  startMusic();
}

function renderNav(user){
  document.getElementById('navUsername').textContent=user.username||'Guest';
  var av=document.getElementById('navAvatar');
  if(user.pfp){
    av.innerHTML='<img src="'+user.pfp+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
  } else {
    av.innerHTML=(user.username||'G')[0].toUpperCase();
  }
  document.getElementById('heroName').textContent=user.name||user.username||'Player';
}

// ── ADMIN PANEL ──
function showAdminPanel(){
  var existing=document.getElementById('adminPanel');
  if(existing){existing.remove();return;}
  renderAdminPanel();
}

function renderAdminPanel(){
  var existing=document.getElementById('adminPanel');
  if(existing) existing.remove();

  var all=getAllAccounts();
  var banned=getBanned();
  var kicked=getKicked();
  var blocked=getBlockedGames();
  var myKey=(getUser()||{username:''}).username.toLowerCase();

  var users=Object.values(all);
  var totalUsers=users.length;

  var panel=document.createElement('div');
  panel.id='adminPanel';
  panel.style.cssText='position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,0.97);overflow-y:auto;padding:0;font-family:Nunito,sans-serif;color:#e8e8f0;';

  var searchId='apSearch_'+Date.now();

  var userRowsHtml=users.map(function(u){
    var k=u.username.toLowerCase();
    var isBanned=banned.includes(k);
    var isKicked=kicked.includes(k);
    var isSelf=k===myKey;
    var lastSeenStr=u.lastSeen?timeAgo(u.lastSeen):'Never';
    var emailShow=u.email||'—';
    var statusDot=isBanned?'🔴':isSelf?'🟢':'🟡';
    return '<div class="ap-row" data-username="'+u.username.toLowerCase()+'" data-name="'+(u.name||'').toLowerCase()+'">' +
      '<div style="display:flex;align-items:center;gap:10px;flex:1;">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:#00d4ff;color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;overflow:hidden;">'+(u.pfp?'<img src="'+u.pfp+'" style="width:100%;height:100%;object-fit:cover;">':u.username[0].toUpperCase())+'</div>' +
        '<div style="min-width:0;">' +
          '<div style="font-weight:900;">'+statusDot+' @'+u.username+'</div>' +
          '<div style="font-size:.72rem;color:#aaa;">'+u.name+' • '+emailShow+'</div>' +
          '<div style="font-size:.68rem;color:#666;">Last seen: '+lastSeenStr+' • Games: '+(u.gamesPlayed||0)+'</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">' +
        (isSelf?'<span style="color:#FFD700;font-size:.8rem;padding:6px;">YOU</span>':
          (isBanned
            ?'<button onclick="apUnban(\''+u.username+'\')" style="background:#2ed573;color:#000;border:none;padding:6px 10px;border-radius:7px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.78rem;">Unban</button>'
            :'<button onclick="apBan(\''+u.username+'\')" style="background:#ff4757;color:#fff;border:none;padding:6px 10px;border-radius:7px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.78rem;">Ban</button>') +
          '<button onclick="apKick(\''+u.username+'\')" style="background:#ff6b35;color:#fff;border:none;padding:6px 10px;border-radius:7px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.78rem;">Kick</button>') +
      '</div>' +
    '</div>';
  }).join('');

  var gameRowsHtml=GAMES.map(function(g){
    var isBlocked=blocked.includes(g.id);
    return '<div style="display:flex;align-items:center;gap:10px;background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:9px 12px;margin-bottom:7px;">' +
      '<img src="'+g.thumb+'" style="width:40px;height:40px;border-radius:8px;object-fit:cover;" onerror="this.style.display=\'none\'">' +
      '<div style="flex:1;font-weight:900;font-size:.9rem;">'+g.name+'</div>' +
      (isBlocked
        ?'<span style="color:#ff4757;font-size:.75rem;margin-right:6px;">🚫 BLOCKED</span><button onclick="apUnblockGame(\''+g.id+'\')" style="background:#2ed573;color:#000;border:none;padding:5px 10px;border-radius:7px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.75rem;">Unblock</button>'
        :'<button onclick="apBlockGame(\''+g.id+'\')" style="background:#ff6b35;color:#fff;border:none;padding:5px 10px;border-radius:7px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.75rem;">Block</button>') +
    '</div>';
  }).join('');

  panel.innerHTML=
    '<div style="max-width:650px;margin:0 auto;padding:20px 16px 60px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0;z-index:10;">' +
      '<h2 style="color:#FFD700;font-size:1.3rem;">🛡️ Admin Panel</h2>' +
      '<button onclick="document.getElementById(\'adminPanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">' +
      '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;">' +
        '<div style="font-size:1.6rem;font-weight:900;color:#FFD700;">'+totalUsers+'</div>' +
        '<div style="font-size:.72rem;color:#888;">Total Users</div>' +
      '</div>' +
      '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;">' +
        '<div style="font-size:1.6rem;font-weight:900;color:#ff4757;">'+banned.length+'</div>' +
        '<div style="font-size:.72rem;color:#888;">Banned</div>' +
      '</div>' +
    '</div>' +
    '<h3 style="margin-bottom:10px;font-size:1rem;color:#e8e8f0;">👥 Users</h3>' +
    '<input id="'+searchId+'" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="width:100%;padding:9px 12px;background:#1a1a24;border:1.5px solid #2e2e3e;border-radius:9px;color:#e8e8f0;font-size:.88rem;font-family:Nunito,sans-serif;outline:none;margin-bottom:12px;">' +
    '<div id="apUserList">'+userRowsHtml+'</div>' +
    '<h3 style="margin:18px 0 10px;font-size:1rem;color:#e8e8f0;">🎮 Games</h3>' +
    gameRowsHtml+
    '</div>';

  panel.querySelector('.ap-row') && (panel.style.cssText += '');
  document.body.appendChild(panel);

  // Style rows
  panel.querySelectorAll('.ap-row').forEach(function(r){
    r.style.cssText='display:flex;align-items:center;gap:10px;background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:10px 12px;margin-bottom:8px;flex-wrap:wrap;';
  });
}

function apFilterUsers(q){
  var rows=document.querySelectorAll('#apUserList .ap-row');
  q=q.toLowerCase().trim();
  rows.forEach(function(r){
    var un=r.getAttribute('data-username')||'';
    var nm=r.getAttribute('data-name')||'';
    r.style.display=(!q||un.includes(q)||nm.includes(q))?'':'none';
  });
}

function apBan(username){
  var banned=getBanned();
  if(!banned.includes(username.toLowerCase())) banned.push(username.toLowerCase());
  saveBanned(banned);
  renderAdminPanel();
}
function apUnban(username){
  saveBanned(getBanned().filter(function(b){return b!==username.toLowerCase();}));
  renderAdminPanel();
}
function apKick(username){
  var kicked=getKicked();
  if(!kicked.includes(username.toLowerCase())) kicked.push(username.toLowerCase());
  saveKicked(kicked);
  renderAdminPanel();
}
function apBlockGame(id){
  var b=getBlockedGames();
  if(!b.includes(id)) b.push(id);
  saveBlockedGames(b);
  renderAdminPanel();
}
function apUnblockGame(id){
  saveBlockedGames(getBlockedGames().filter(function(b){return b!==id;}));
  renderAdminPanel();
}

function timeAgo(ts){
  var d=(Date.now()-ts)/1000;
  if(d<60) return 'Just now';
  if(d<3600) return Math.floor(d/60)+'m ago';
  if(d<86400) return Math.floor(d/3600)+'h ago';
  return Math.floor(d/86400)+'d ago';
}

// ── POPUP ──
function openPopup(game){
  var blocked=getBlockedGames();
  if(blocked.includes(game.id)){
    alert('🚫 This game has been blocked by an admin.\nCheck back later!');
    return;
  }
  currentGame=game;
  var thumb=document.getElementById('popupThumb');
  thumb.src=game.thumb;
  thumb.onerror=function(){this.style.display='none';};
  thumb.style.display='block';
  document.getElementById('popupTitle').textContent=game.name;
  document.getElementById('popupDesc').textContent=game.desc;
  document.getElementById('gamePopup').classList.remove('hidden');
}

function closePopup(){
  document.getElementById('gamePopup').classList.add('hidden');
  currentGame=null;
}

function launchGame(mode){
  if(!currentGame) return;
  saveHistory(currentGame);
  var name=currentGame.name, url=currentGame.url;

  if(mode==='iframe'){
    closePopup();
    document.getElementById('inPageTitle').textContent=name;
    document.getElementById('inPageFrame').src=url;
    document.getElementById('inPageGame').classList.remove('hidden');
    document.getElementById('navbar').style.display='none';
    document.getElementById('bnavBar').style.display='none';
  } else if(mode==='blank'||mode==='blankfull'){
    var w=window.open('about:blank','_blank');
    if(!w){alert('Allow pop-ups then try again!');return;}
    w.document.write('<!DOCTYPE html><html><head><title>'+name+'</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}iframe{position:fixed;inset:0;width:100%;height:100%;border:none}</style></head><body><iframe src="'+url+'" allow="autoplay;fullscreen;gamepad" allowfullscreen></iframe></body></html>');
    w.document.close();
    closePopup();
  } else if(mode==='fullscreen'){
    closePopup();
    document.getElementById('inPageTitle').textContent=name;
    document.getElementById('inPageFrame').src=url;
    document.getElementById('inPageGame').classList.remove('hidden');
    document.getElementById('navbar').style.display='none';
    document.getElementById('bnavBar').style.display='none';
    setTimeout(function(){
      var el=document.getElementById('inPageFrame');
      if(el.requestFullscreen) el.requestFullscreen();
      else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    },300);
  }
}

function closeInPage(){
  document.getElementById('inPageGame').classList.add('hidden');
  document.getElementById('inPageFrame').src='';
  document.getElementById('navbar').style.display='flex';
  document.getElementById('bnavBar').style.display='flex';
}

function saveHistory(game){
  var u=getUser();
  if(!u) return;
  u.history=(u.history||[]).filter(function(h){return h.id!==game.id;});
  u.history.unshift({id:game.id,name:game.name,thumb:game.thumb,color:game.color,ts:Date.now()});
  if(u.history.length>12) u.history=u.history.slice(0,12);
  u.gamesPlayed=(u.gamesPlayed||0)+1;
  u.lastSeen=Date.now();
  saveUser(u);
  var all=getAllAccounts();
  all[u.username.toLowerCase()]=u;
  saveAllAccounts(all);
  var row=document.getElementById('continueRow');
  var sec=document.getElementById('continueSection');
  if(row&&sec){
    sec.style.display='block';
    row.innerHTML='';
    u.history.forEach(function(h){var g=GAMES.find(function(g){return g.id===h.id;});if(g)row.appendChild(makeCard(g));});
  }
}

// ── CARDS ──
function makeCard(game){
  var blocked=getBlockedGames();
  var isBlocked=blocked.includes(game.id);
  var div=document.createElement('div');
  div.className='game-card'+(isBlocked?' card-blocked':'');
  div.setAttribute('data-name',game.name.toLowerCase());
  var badge=game.hot?'<span class="card-badge badge-hot">🔥 HOT</span>':game.isNew?'<span class="card-badge badge-new">✨ NEW</span>':'';
  var blockedOverlay=isBlocked?'<div class="blocked-overlay">🚫<div class="blocked-text">Blocked</div></div>':'';
  div.innerHTML=
    '<div class="card-thumb" style="background:'+game.color+'">' +
      '<img src="'+game.thumb+'" alt="'+game.name+'" onerror="this.parentElement.style.background=\''+game.color+'\';this.style.display=\'none\'">' +
      badge+blockedOverlay+
    '</div>' +
    '<div class="card-body"><div class="card-name">'+game.name+'</div></div>';
  div.addEventListener('click',function(){openPopup(game);});
  return div;
}

function makeGuestCard(game){
  var blocked=getBlockedGames();
  var isBlocked=blocked.includes(game.id);
  var div=document.createElement('div');
  div.className='c6x-card'+(isBlocked?' card-blocked':'');
  var blockedOverlay=isBlocked?'<div class="blocked-overlay">🚫<div class="blocked-text">Blocked</div></div>':'';
  div.innerHTML=
    '<div class="c6x-thumb" style="background:'+game.color+'">' +
      '<img src="'+game.thumb+'" alt="'+game.name+'" onerror="this.parentElement.style.background=\''+game.color+'\';this.style.display=\'none\'">' +
      blockedOverlay+
    '</div>' +
    '<div class="c6x-name">'+game.name+'</div>';
  div.addEventListener('click',function(){openPopup(game);});
  return div;
}

function renderUserPage(user){
  var cont=document.getElementById('continueSection');
  var row=document.getElementById('continueRow');
  if(cont&&row&&user.history&&user.history.length>0){
    cont.style.display='block';
    row.innerHTML='';
    user.history.forEach(function(h){var g=GAMES.find(function(g){return g.id===h.id;});if(g)row.appendChild(makeCard(g));});
  }
  var hotRow=document.getElementById('hotRow');
  if(hotRow){hotRow.innerHTML='';GAMES.filter(function(g){return g.hot;}).forEach(function(g){hotRow.appendChild(makeCard(g));});}
  var grid=document.getElementById('allGrid');
  if(grid){grid.innerHTML='';GAMES.forEach(function(g){grid.appendChild(makeCard(g));});}
}

function renderGuestGrid(){
  var grid=document.getElementById('guestGrid');
  if(!grid) return;
  grid.innerHTML='';
  GAMES.forEach(function(g){grid.appendChild(makeGuestCard(g));});
}

function filterGames(){
  var q=(document.getElementById('searchInput').value||'').toLowerCase().trim();
  document.querySelectorAll('#allGrid .game-card').forEach(function(c){
    c.style.display=(!q||(c.getAttribute('data-name')||'').includes(q))?'':'none';
  });
}
