var currentGame = null;
var ADMIN_CODE = "DvRascals";
var BLOCKED_KEY = "dvs_blocked_games";
var BANNED_KEY = "dvs_banned";
var KICKED_KEY = "dvs_kicked";
var SESSION_KEY = "dvs_session_active";

// ── Storage ──
function getUser(){try{return JSON.parse(localStorage.getItem('dvs_user'))||null;}catch(e){return null;}}
function saveUser(u){localStorage.setItem('dvs_user',JSON.stringify(u));}
function getAllAccounts(){try{return JSON.parse(localStorage.getItem('dvs_accounts'))||{};}catch(e){return{};}}
function saveAllAccounts(a){localStorage.setItem('dvs_accounts',JSON.stringify(a));}
function getBlockedGames(){try{return JSON.parse(localStorage.getItem(BLOCKED_KEY))||[];}catch(e){return[];}}
function saveBlockedGames(b){localStorage.setItem(BLOCKED_KEY,JSON.stringify(b));}
function getBanned(){try{return JSON.parse(localStorage.getItem(BANNED_KEY))||[];}catch(e){return[];}}
function saveBanned(b){localStorage.setItem(BANNED_KEY,JSON.stringify(b));}
function getKicked(){try{return JSON.parse(localStorage.getItem(KICKED_KEY))||[];}catch(e){return[];}}
function saveKicked(k){localStorage.setItem(KICKED_KEY,JSON.stringify(k));}
function isAdmin(u){return u&&u.isAdmin===true;}

// ── SESSION PERSISTENCE FIX ──
// Use sessionStorage to track if user was already booted this tab session
// This prevents the modal flashing when switching tabs
function getSessionBooted(){return sessionStorage.getItem('dvs_booted')==='1';}
function setSessionBooted(){sessionStorage.setItem('dvs_booted','1');}
function clearSessionBooted(){sessionStorage.removeItem('dvs_booted');}

// ── SPACE BG ──
function showSpaceBg(){
  var bg = document.getElementById('bgWrap');
  if(bg) bg.style.opacity = '0.18';
}

// ── MUSIC ──
var _musicStarted = false;
function startMusic(){
  if(_musicStarted) return;
  var m = document.getElementById('bgMusic');
  if(!m) return;
  m.volume = 0.18;
  m.play().then(function(){_musicStarted=true;}).catch(function(){
    document.addEventListener('click',function once(){
      m.play().catch(function(){});
      _musicStarted=true;
      document.removeEventListener('click',once);
    },{once:true});
  });
}

// ── LOGIN ──
function doLogin(){
  var name = (document.getElementById('regName').value||'').trim();
  var email = (document.getElementById('regEmail').value||'').trim();
  var username = (document.getElementById('regUsername').value||'').trim();
  var secret = (document.getElementById('regSecret').value||'').trim();
  var err = document.getElementById('loginError');

  if(!name){err.textContent='Please enter your name!';return;}
  if(!email||!email.includes('@')){err.textContent='Please enter a valid email!';return;}
  if(!username||username.length<2){err.textContent='Username must be at least 2 chars!';return;}
  if(!/^[a-zA-Z0-9_]+$/.test(username)){err.textContent='Letters, numbers and _ only!';return;}

  var all = getAllAccounts();
  var key = username.toLowerCase();
  var emailLow = email.toLowerCase();

  var emailOwner = Object.values(all).find(function(u){
    return u.email && u.email.toLowerCase()===emailLow;
  });
  if(emailOwner && emailOwner.username.toLowerCase()!==key){
    err.textContent='That email is already used by @'+emailOwner.username; return;
  }

  if(getBanned().includes(key)){err.textContent='This account has been banned.';return;}

  var existing = all[key];
  if(existing && existing.email && existing.email.toLowerCase()!==emailLow){
    err.textContent='Username taken! Try another.'; return;
  }

  var user = existing || {
    username:username, name:name, email:email,
    since:new Date().toLocaleDateString(),
    gamesPlayed:0, history:[], friends:[], friendRequests:[],
    pfp:null, isAdmin:false, lastSeen:Date.now()
  };
  user.name = name;
  user.email = email;
  user.lastSeen = Date.now();
  if(secret===ADMIN_CODE) user.isAdmin = true;

  saveUser(user);
  all[key] = user;
  saveAllAccounts(all);
  setSessionBooted();

  document.getElementById('loginModal').classList.add('hidden');
  bootSignedIn(user);
}

function doGuest(){
  document.getElementById('loginModal').classList.add('hidden');
  setSessionBooted();
  bootGuest();
}

function doLogout(){
  var u = getUser();
  if(u){
    var all=getAllAccounts();
    u.lastSeen=Date.now();
    all[u.username.toLowerCase()]=u;
    saveAllAccounts(all);
  }
  localStorage.removeItem('dvs_user');
  clearSessionBooted();
  // Reset UI without reloading
  document.getElementById('userView').style.display='none';
  document.getElementById('guestView').style.display='none';
  document.getElementById('friendsNavBtn').style.display='none';
  document.getElementById('profileNavBtn').style.display='none';
  document.getElementById('creditsNavBtn').style.display='none';
  document.getElementById('adminNavBtn').style.display='none';
  document.getElementById('navLogoutBtn').style.display='none';
  document.getElementById('navMid').style.display='none';
  document.getElementById('navAvatar').innerHTML='G';
  document.getElementById('navUsername').textContent='Guest';
  document.getElementById('bgWrap').style.opacity='0';
  document.getElementById('loginModal').classList.remove('hidden');
}

// ── KICK CHECK ──
function checkKicked(){
  var u=getUser();
  if(!u)return;
  if(getKicked().includes(u.username.toLowerCase())){
    localStorage.removeItem('dvs_user');
    clearSessionBooted();
    alert('You have been kicked by an admin.');
    location.reload();
  }
}

// ── INIT — THE KEY FIX FOR TAB SWITCHING ──
(function init(){
  // Always check localStorage first — if user data exists, boot them in silently
  // This is what was causing the flash — we were re-checking on every page load
  var user = getUser();

  if(user){
    // Refresh from accounts store
    var all = getAllAccounts();
    var fresh = all[user.username.toLowerCase()];
    if(fresh){saveUser(fresh); user=fresh;}

    // Check banned
    if(getBanned().includes(user.username.toLowerCase())){
      localStorage.removeItem('dvs_user');
      clearSessionBooted();
      document.getElementById('loginModal').classList.remove('hidden');
      return;
    }

    // Boot signed in — NO modal shown, NO flash
    setSessionBooted();
    bootSignedIn(user);
    setInterval(checkKicked,5000);

  } else {
    // No saved user — show login
    document.getElementById('loginModal').classList.remove('hidden');
  }

  startMusic();
})();

function bootSignedIn(user){
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('guestView').style.display='none';
  document.getElementById('userView').style.display='block';
  document.getElementById('friendsNavBtn').style.display='flex';
  document.getElementById('profileNavBtn').style.display='flex';
  document.getElementById('creditsNavBtn').style.display='flex';
  document.getElementById('navLogoutBtn').style.display='block';
  document.getElementById('navMid').style.display='flex';

  // Show admin button in navbar if admin
  if(isAdmin(user)){
    document.getElementById('adminNavBtn').style.display='flex';
    document.getElementById('adminNavBtn').style.alignItems='center';
  } else {
    document.getElementById('adminNavBtn').style.display='none';
  }

  renderNav(user);
  renderUserPage(user);
  showSpaceBg();
  startMusic();
}

function bootGuest(){
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('guestView').style.display='block';
  document.getElementById('userView').style.display='none';
  document.getElementById('navUsername').textContent='Guest';
  document.getElementById('navAvatar').innerHTML='G';
  document.getElementById('navLogoutBtn').style.display='block';
  document.getElementById('friendsNavBtn').style.display='none';
  document.getElementById('profileNavBtn').style.display='none';
  document.getElementById('creditsNavBtn').style.display='none';
  document.getElementById('adminNavBtn').style.display='none';
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
  var ep=document.getElementById('adminPanel');
  if(ep)ep.remove();

  var all=getAllAccounts();
  var banned=getBanned();
  var blocked=getBlockedGames();
  var myKey=(getUser()||{username:''}).username.toLowerCase();
  var users=Object.values(all);

  var panel=document.createElement('div');
  panel.id='adminPanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';

  var userRowsHtml = users.length===0
    ? '<p style="color:#7878a0;padding:12px 0;">No registered users yet.</p>'
    : users.map(function(u){
        var k=u.username.toLowerCase();
        var isBanned=banned.includes(k);
        var isSelf=k===myKey;
        var statusColor=isBanned?'#ff4757':isSelf?'#2ed573':'#00d4ff';
        var statusLabel=isBanned?'BANNED':isSelf?'YOU':'ACTIVE';
        return '<div class="ap-row" data-username="'+k+'" data-name="'+(u.name||'').toLowerCase()+'">' +
          '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">' +
            '<div style="width:40px;height:40px;border-radius:50%;background:'+statusColor+';color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;overflow:hidden;">' +
              (u.pfp?'<img src="'+u.pfp+'" style="width:100%;height:100%;object-fit:cover;">':u.username[0].toUpperCase())+
            '</div>' +
            '<div style="min-width:0;flex:1;">' +
              '<div style="font-weight:900;font-size:.9rem;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'+
                '@'+u.username+
                ' <span style="font-size:.58rem;background:'+statusColor+';color:#000;padding:1px 7px;border-radius:4px;font-weight:900;">'+statusLabel+'</span>'+
                (u.isAdmin?'<span style="font-size:.58rem;background:#FFD700;color:#000;padding:1px 7px;border-radius:4px;font-weight:900;">ADMIN</span>':'')+
              '</div>'+
              '<div style="font-size:.72rem;color:#aaa;margin-top:1px;">'+u.name+' • '+u.email+'</div>'+
              '<div style="font-size:.67rem;color:#666;">Last seen: '+(u.lastSeen?timeAgo(u.lastSeen):'Never')+' • '+(u.gamesPlayed||0)+' games played</div>'+
            '</div>'+
          '</div>'+
          '<div style="display:flex;gap:5px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">' +
            (isSelf ? '' :
              (isBanned
                ? '<button onclick="apUnban(\''+u.username+'\')" style="background:#2ed573;color:#000;border:none;padding:6px 11px;border-radius:7px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.76rem;">Unban</button>'
                : '<button onclick="apBan(\''+u.username+'\')" style="background:#ff4757;color:#fff;border:none;padding:6px 11px;border-radius:7px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.76rem;">Ban</button>') +
              '<button onclick="apKick(\''+u.username+'\')" style="background:#ff6b35;color:#fff;border:none;padding:6px 11px;border-radius:7px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.76rem;">Kick</button>'
            ) +
          '</div>'+
        '</div>';
      }).join('');

  var gameRowsHtml = GAMES.map(function(g){
    var isBlocked=blocked.includes(g.id);
    return '<div style="display:flex;align-items:center;gap:10px;background:#13131c;border:1px solid #2e2e3e;border-radius:9px;padding:8px 12px;margin-bottom:7px;">' +
      '<img src="'+g.thumb+'" style="width:38px;height:38px;border-radius:7px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">' +
      '<div style="flex:1;font-weight:900;font-size:.88rem;">'+g.name+'</div>'+
      (isBlocked
        ? '<span style="color:#ff4757;font-size:.72rem;margin-right:5px;">🚫 BLOCKED</span><button onclick="apUnblockGame(\''+g.id+'\')" style="background:#2ed573;color:#000;border:none;padding:5px 9px;border-radius:6px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.72rem;">Unblock</button>'
        : '<button onclick="apBlockGame(\''+g.id+'\')" style="background:#ff6b35;color:#fff;border:none;padding:5px 9px;border-radius:6px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.72rem;">Block</button>') +
    '</div>';
  }).join('');

  panel.innerHTML =
    '<div style="max-width:680px;margin:0 auto;padding:16px 14px 60px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0 10px;z-index:10;border-bottom:1px solid #2e2e3e;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbxG68RG-Zgp8zo8TpQrPJgpBFbfGMsxqbRcPlkwcMbN9rZpgdpl1Zgkz7&s=10" style="width:32px;height:32px;border-radius:7px;object-fit:cover;border:2px solid #FFD700;">' +
          '<h2 style="color:#FFD700;font-size:1.2rem;font-weight:900;">Admin Panel</h2>' +
        '</div>'+
        '<button onclick="document.getElementById(\'adminPanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;font-size:.88rem;">✕ Close</button>' +
      '</div>' +
      '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">' +
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-size:1.6rem;font-weight:900;color:#FFD700;">'+users.length+'</div><div style="font-size:.7rem;color:#888;font-weight:700;">Total Users</div></div>' +
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-size:1.6rem;font-weight:900;color:#ff4757;">'+banned.length+'</div><div style="font-size:.7rem;color:#888;font-weight:700;">Banned</div></div>' +
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-size:1.6rem;font-weight:900;color:#ff6b35;">'+blocked.length+'</div><div style="font-size:.7rem;color:#888;font-weight:700;">Blocked Games</div></div>' +
      '</div>' +
      '<h3 style="font-size:.92rem;font-weight:900;margin-bottom:9px;">👥 All Registered Users ('+users.length+')</h3>' +
      '<input id="apSearchInput" type="text" placeholder="🔍 Search by username or name..." oninput="apFilterUsers(this.value)" style="width:100%;padding:9px 12px;background:#1a1a24;border:1.5px solid #2e2e3e;border-radius:9px;color:#e8e8f0;font-size:.86rem;font-family:Nunito,sans-serif;outline:none;margin-bottom:10px;">' +
      '<div id="apUserList">'+userRowsHtml+'</div>' +
      '<h3 style="font-size:.92rem;font-weight:900;margin:18px 0 9px;">🎮 Manage Games</h3>' +
      gameRowsHtml +
    '</div>';

  document.body.appendChild(panel);

  panel.querySelectorAll('.ap-row').forEach(function(r){
    r.style.cssText='display:flex;align-items:center;gap:9px;background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:9px 11px;margin-bottom:7px;flex-wrap:wrap;';
  });
}

function apFilterUsers(q){
  document.querySelectorAll('#apUserList .ap-row').forEach(function(r){
    var un=r.getAttribute('data-username')||'';
    var nm=r.getAttribute('data-name')||'';
    r.style.display=(!q||un.includes(q.toLowerCase())||nm.includes(q.toLowerCase()))?'':'none';
  });
}
function apBan(username){var b=getBanned();if(!b.includes(username.toLowerCase()))b.push(username.toLowerCase());saveBanned(b);renderAdminPanel();}
function apUnban(username){saveBanned(getBanned().filter(function(b){return b!==username.toLowerCase();}));renderAdminPanel();}
function apKick(username){var k=getKicked();if(!k.includes(username.toLowerCase()))k.push(username.toLowerCase());saveKicked(k);renderAdminPanel();}
function apBlockGame(id){var b=getBlockedGames();if(!b.includes(id))b.push(id);saveBlockedGames(b);renderAdminPanel();}
function apUnblockGame(id){saveBlockedGames(getBlockedGames().filter(function(b){return b!==id;}));renderAdminPanel();}

function timeAgo(ts){
  var d=(Date.now()-ts)/1000;
  if(d<60)return'Just now';
  if(d<3600)return Math.floor(d/60)+'m ago';
  if(d<86400)return Math.floor(d/3600)+'h ago';
  return Math.floor(d/86400)+'d ago';
}

// ── POPUP ──
function openPopup(game){
  if(getBlockedGames().includes(game.id)){
    alert('🚫 This game is blocked by an admin.\nCheck back later!');return;
  }
  currentGame=game;
  var thumb=document.getElementById('popupThumb');
  thumb.src=game.thumb;
  thumb.style.display='block';
  thumb.onerror=function(){this.style.display='none';};
  document.getElementById('popupTitle').textContent=game.name;
  document.getElementById('popupDesc').textContent=game.desc;
  document.getElementById('gamePopup').classList.remove('hidden');
}

function closePopup(){
  document.getElementById('gamePopup').classList.add('hidden');
  currentGame=null;
}

function launchGame(mode){
  if(!currentGame)return;
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
      if(el.requestFullscreen)el.requestFullscreen();
      else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();
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
  var u=getUser();if(!u)return;
  u.history=(u.history||[]).filter(function(h){return h.id!==game.id;});
  u.history.unshift({id:game.id,name:game.name,thumb:game.thumb,color:game.color,ts:Date.now()});
  if(u.history.length>12)u.history=u.history.slice(0,12);
  u.gamesPlayed=(u.gamesPlayed||0)+1;
  u.lastSeen=Date.now();
  saveUser(u);
  var all=getAllAccounts();
  all[u.username.toLowerCase()]=u;
  saveAllAccounts(all);
  var row=document.getElementById('continueRow');
  var sec=document.getElementById('continueSection');
  if(row&&sec){
    sec.style.display='block';row.innerHTML='';
    u.history.forEach(function(h){var g=GAMES.find(function(g){return g.id===h.id;});if(g)row.appendChild(makeCard(g));});
  }
}

function makeCard(game){
  var isBlocked=getBlockedGames().includes(game.id);
  var div=document.createElement('div');
  div.className='game-card'+(isBlocked?' card-blocked':'');
  div.setAttribute('data-name',game.name.toLowerCase());
  var badge=game.hot?'<span class="card-badge badge-hot">🔥 HOT</span>':game.isNew?'<span class="card-badge badge-new">✨ NEW</span>':'';
  var bo=isBlocked?'<div class="blocked-overlay">🚫<div class="blocked-text">Blocked</div></div>':'';
  div.innerHTML='<div class="card-thumb" style="background:'+game.color+'"><img src="'+game.thumb+'" alt="'+game.name+'" onerror="this.parentElement.style.background=\''+game.color+'\';this.style.display=\'none\'">'+badge+bo+'</div><div class="card-body"><div class="card-name">'+game.name+'</div></div>';
  div.addEventListener('click',function(){openPopup(game);});
  return div;
}

function makeGuestCard(game){
  var isBlocked=getBlockedGames().includes(game.id);
  var div=document.createElement('div');
  div.className='c6x-card'+(isBlocked?' card-blocked':'');
  var bo=isBlocked?'<div class="blocked-overlay">🚫<div class="blocked-text">Blocked</div></div>':'';
  div.innerHTML='<div class="c6x-thumb" style="background:'+game.color+'"><img src="'+game.thumb+'" alt="'+game.name+'" onerror="this.parentElement.style.background=\''+game.color+'\';this.style.display=\'none\'">'+bo+'</div><div class="c6x-name">'+game.name+'</div>';
  div.addEventListener('click',function(){openPopup(game);});
  return div;
}

function renderUserPage(user){
  var cont=document.getElementById('continueSection');
  var row=document.getElementById('continueRow');
  if(cont&&row&&user.history&&user.history.length>0){
    cont.style.display='block';row.innerHTML='';
    user.history.forEach(function(h){var g=GAMES.find(function(g){return g.id===h.id;});if(g)row.appendChild(makeCard(g));});
  }
  var hotRow=document.getElementById('hotRow');
  if(hotRow){hotRow.innerHTML='';GAMES.filter(function(g){return g.hot;}).forEach(function(g){hotRow.appendChild(makeCard(g));});}
  var grid=document.getElementById('allGrid');
  if(grid){grid.innerHTML='';GAMES.forEach(function(g){grid.appendChild(makeCard(g));});}
}

function renderGuestGrid(){
  var grid=document.getElementById('guestGrid');
  if(!grid)return;
  grid.innerHTML='';
  GAMES.forEach(function(g){grid.appendChild(makeGuestCard(g));});
}

function filterGames(){
  var q=(document.getElementById('searchInput').value||'').toLowerCase().trim();
  document.querySelectorAll('#allGrid .game-card').forEach(function(c){
    c.style.display=(!q||(c.getAttribute('data-name')||'').includes(q))?'':'none';
  });
}
