var currentGame = null;
var OWNER_CODE = "UaoNsieEueoOw";
var ADMIN_CODE = "DvRascals";
var MOD_CODE = "Monveiaoa";
var currentUser = null;
var unsubNotifs = null;
var _blockedGames = [];

// ── GLOBAL BLOCKED GAMES via Firebase ──
function getBlockedGames(){ return _blockedGames; }

function saveBlockedGames(arr){
  _blockedGames = arr;
  db.collection('settings').doc('blockedGames').set({ ids: arr });
}

function listenBlockedGames(){
  db.collection('settings').doc('blockedGames').onSnapshot(function(doc){
    _blockedGames = doc.exists ? (doc.data().ids || []) : [];
    if(currentUser) renderUserPage(currentUser);
    else renderGuestGrid();
    var apg = document.getElementById('apGameList');
    if(apg) apg.innerHTML = renderAdminGameRows();
  });
}

// ── MUSIC ──
var _musicStarted = false;
function startMusic(){
  if(_musicStarted) return;
  var m = document.getElementById('bgMusic');
  if(!m) return;
  m.volume = 0.18; m.loop = true;
  m.play().then(function(){_musicStarted=true;}).catch(function(){
    document.addEventListener('click',function once(){
      m.play().catch(function(){});
      _musicStarted=true;
      document.removeEventListener('click',once);
    },{once:true});
  });
}

// ── SPACE BG ──
function showSpaceBg(){
  var bg = document.getElementById('bgWrap');
  if(bg) bg.style.opacity='0.18';
}

// ── AUTH STATE ──
auth.onAuthStateChanged(function(firebaseUser){
  if(firebaseUser){
    db.collection('users').doc(firebaseUser.uid).get().then(function(doc){
      if(doc.exists){
        currentUser = doc.data();
        currentUser.uid = firebaseUser.uid;
        bootSignedIn(currentUser);
        listenForNotifications(firebaseUser.uid);
        listenForKick(firebaseUser.uid);
        setInterval(function(){updateLastSeen(firebaseUser.uid);}, 60000);
      } else {
        auth.signOut();
        showLoginModal();
      }
    });
  } else {
    currentUser = null;
    showLoginModal();
  }
  startMusic();
  listenBlockedGames();
});

function updateLastSeen(uid){
  db.collection('users').doc(uid).update({lastSeen: firebase.firestore.FieldValue.serverTimestamp()});
}

// ── NOTIFICATIONS ──
function listenForNotifications(uid){
  if(unsubNotifs) unsubNotifs();
  unsubNotifs = db.collection('users').doc(uid)
    .collection('notifications')
    .where('read','==',false)
    .orderBy('ts','desc')
    .limit(20)
    .onSnapshot(function(snap){
      updateNotifBadge(snap.size);
      snap.docChanges().forEach(function(change){
        if(change.type==='added'){
          var n = change.doc.data();
          showNotifToast(n.message, n.type||'info');
        }
      });
    });
}

function updateNotifBadge(count){
  var badge = document.getElementById('notifBadge');
  if(!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function showNotifToast(message, type){
  var colors = {info:'#00d4ff', message:'#2ed573', update:'#FFD700', warning:'#ff4757'};
  var color = colors[type]||colors.info;
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a24;border:2px solid '+color+';color:#e8e8f0;padding:12px 20px;border-radius:12px;font-family:Nunito,sans-serif;font-weight:700;font-size:.88rem;z-index:9999;max-width:320px;width:90%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function(){
    toast.style.opacity='0'; toast.style.transition='opacity .5s';
    setTimeout(function(){toast.remove();},500);
  },4000);
}

function sendNotification(toUid, message, type){
  db.collection('users').doc(toUid).collection('notifications').add({
    message:message, type:type||'info', read:false,
    ts:firebase.firestore.FieldValue.serverTimestamp()
  });
}

function sendGlobalNotification(message, type){
  db.collection('users').get().then(function(snap){
    var batch = db.batch();
    snap.forEach(function(doc){
      var ref = db.collection('users').doc(doc.id).collection('notifications').doc();
      batch.set(ref,{message:message, type:type||'update', read:false, ts:firebase.firestore.FieldValue.serverTimestamp()});
    });
    batch.commit();
  });
}

// ── ROLE HELPERS ──
function getUserRole(user){
  if(!user) return 'user';
  if(user.role==='owner'||user.isOwner) return 'owner';
  if(user.role==='admin'||user.isAdmin) return 'admin';
  if(user.role==='mod'||user.isMod) return 'mod';
  return 'user';
}

function getRoleBadgeHtml(role){
  var badges = {
    owner: '<span style="font-size:.58rem;background:#FFD700;color:#000;padding:2px 8px;border-radius:4px;font-weight:900;">👑 OWNER</span>',
    admin: '<span style="font-size:.58rem;background:#00d4ff;color:#000;padding:2px 8px;border-radius:4px;font-weight:900;">🛡️ ADMIN</span>',
    mod:   '<span style="font-size:.58rem;background:#8e24aa;color:#fff;padding:2px 8px;border-radius:4px;font-weight:900;">🔨 MOD</span>'
  };
  return badges[role]||'';
}

// ── SHOW LOGIN MODAL ──
function showLoginModal(){
  var modal = document.getElementById('loginModal');
  if(modal) modal.classList.remove('hidden');
  var uv = document.getElementById('userView');
  var gv = document.getElementById('guestView');
  if(uv) uv.style.display='none';
  if(gv) gv.style.display='none';
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

  err.textContent='Signing in...';

  // Determine role from secret code
  var role = 'user';
  var isOwner = false, isAdmin = false, isMod = false;
  if(secret===OWNER_CODE){ role='owner'; isOwner=true; }
  else if(secret===ADMIN_CODE){ role='admin'; isAdmin=true; }
  else if(secret===MOD_CODE){ role='mod'; isMod=true; }

  db.collection('users').where('usernameLower','==',username.toLowerCase()).get().then(function(snap){
    if(!snap.empty){
      var existingData = snap.docs[0].data();
      if(existingData.email && existingData.email.toLowerCase()!==email.toLowerCase()){
        err.textContent='Username taken! Try another.'; return;
      }
      var password = username+'_dvs_2025_'+email.split('@')[0];
      // Update role if code was entered
      if(role!=='user'){
        db.collection('users').doc(snap.docs[0].id).update({role:role,isOwner:isOwner,isAdmin:isAdmin,isMod:isMod});
      }
      auth.signInWithEmailAndPassword(email, password).catch(function(){
        signUpFirebase(name, email, username, role, isOwner, isAdmin, isMod);
      });
    } else {
      signUpFirebase(name, email, username, role, isOwner, isAdmin, isMod);
    }
  }).catch(function(e){ err.textContent='Error: '+e.message; });
}

function signUpFirebase(name, email, username, role, isOwner, isAdmin, isMod){
  var err = document.getElementById('loginError');
  var password = username+'_dvs_2025_'+email.split('@')[0];
  auth.createUserWithEmailAndPassword(email, password).then(function(cred){
    var uid = cred.user.uid;
    return db.collection('users').doc(uid).set({
      uid:uid, username:username, usernameLower:username.toLowerCase(),
      name:name, email:email, since:new Date().toLocaleDateString(),
      gamesPlayed:0, history:[], friends:[], friendRequests:[],
      pfp:null, role:role, isOwner:isOwner, isAdmin:isAdmin, isMod:isMod,
      banned:false,
      lastSeen:firebase.firestore.FieldValue.serverTimestamp(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
  }).then(function(){
    document.getElementById('loginModal').classList.add('hidden');
  }).catch(function(e){
    if(e.code==='auth/email-already-in-use'){
      auth.signInWithEmailAndPassword(email, username+'_dvs_2025_'+email.split('@')[0])
        .catch(function(e2){ err.textContent='Error: '+e2.message; });
    } else { err.textContent='Error: '+e.message; }
  });
}

function doGuest(){
  document.getElementById('loginModal').classList.add('hidden');
  bootGuest();
}

function doLogout(){
  if(unsubNotifs) unsubNotifs();
  auth.signOut().then(function(){
    currentUser = null;
    ['userView','guestView'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.style.display='none';
    });
    ['friendsNavBtn','profileNavBtn','creditsNavBtn','roleNavBtn','notifBtn','navLogoutBtn','navMid'].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.style.display='none';
    });
    document.getElementById('navAvatar').innerHTML='G';
    document.getElementById('navUsername').textContent='Guest';
    var bg=document.getElementById('bgWrap'); if(bg) bg.style.opacity='0';
    document.getElementById('loginModal').classList.remove('hidden');
  });
}

// ── BOOT ──
function bootSignedIn(user){
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('guestView').style.display='none';
  document.getElementById('userView').style.display='block';
  document.getElementById('friendsNavBtn').style.display='flex';
  document.getElementById('profileNavBtn').style.display='flex';
  document.getElementById('creditsNavBtn').style.display='flex';
  document.getElementById('navLogoutBtn').style.display='block';
  document.getElementById('navMid').style.display='flex';
  document.getElementById('notifBtn').style.display='flex';

  var role = getUserRole(user);

  // Show role panel button with the right icon/color
  if(role==='owner'||role==='admin'||role==='mod'){
    var btn = document.getElementById('roleNavBtn');
    if(btn){
      btn.style.display='flex';
      btn.style.alignItems='center';
      var icons = {
        owner:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbxG68RG-Zgp8zo8TpQrPJgpBFbfGMsxqbRcPlkwcMbN9rZpgdpl1Zgkz7&s=10',
        admin:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbxG68RG-Zgp8zo8TpQrPJgpBFbfGMsxqbRcPlkwcMbN9rZpgdpl1Zgkz7&s=10',
        mod:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbxG68RG-Zgp8zo8TpQrPJgpBFbfGMsxqbRcPlkwcMbN9rZpgdpl1Zgkz7&s=10'
      };
      var borderColors = {owner:'#FFD700', admin:'#00d4ff', mod:'#8e24aa'};
      var img = btn.querySelector('img');
      if(img){
        img.src = icons[role];
        img.style.border = '2px solid '+(borderColors[role]||'#FFD700');
      }
      btn.onclick = function(){ showRolePanel(role); };
    }
  }

  renderNav(user);
  renderUserPage(user);
  showSpaceBg();
  startMusic();
}

function bootGuest(){
  document.getElementById('guestView').style.display='block';
  document.getElementById('userView').style.display='none';
  ['friendsNavBtn','profileNavBtn','creditsNavBtn','roleNavBtn','notifBtn'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.style.display='none';
  });
  document.getElementById('navLogoutBtn').style.display='block';
  document.getElementById('navAvatar').innerHTML='G';
  document.getElementById('navUsername').textContent='Guest';
  renderGuestGrid();
  startMusic();
}

function renderNav(user){
  document.getElementById('navUsername').textContent=user.username||'Guest';
  var av=document.getElementById('navAvatar');
  av.innerHTML=user.pfp
    ?'<img src="'+user.pfp+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">'
    :(user.username||'G')[0].toUpperCase();
  var hn=document.getElementById('heroName');
  if(hn) hn.textContent=user.name||user.username||'Player';
}

// ── ROLE PANEL ROUTER ──
function showRolePanel(role){
  var r = role || getUserRole(currentUser);
  if(r==='owner') showOwnerPanel();
  else if(r==='admin') showAdminPanel();
  else if(r==='mod') showModPanel();
}

// ════════════════════════════════════════
// 👑 OWNER PANEL
// ════════════════════════════════════════
function showOwnerPanel(){
  var existing=document.getElementById('rolePanel'); if(existing){existing.remove();return;}
  var panel=document.createElement('div');
  panel.id='rolePanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:700px;margin:0 auto;padding:16px 14px 80px;">'+
    panelHeader('👑 Owner Panel','#FFD700')+
    // Stats
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    // Announcement
    '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:12px;padding:14px;margin-bottom:14px;">'+
      '<div style="font-weight:900;font-size:.88rem;margin-bottom:8px;color:#FFD700;">📢 Global Announcement</div>'+
      '<input placeholder="Send a message to ALL users..." id="apAnnounce" style="'+inputStyle()+'">'+
      '<button onclick="apSendAnnouncement()" style="'+btnStyle('#FFD700','#000')+'margin-top:7px;width:100%;">📢 Send to All Users</button>'+
    '</div>'+
    // User management
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+inputStyle()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading users...</div></div>'+
    // Game management
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>'+
    // Danger zone
    '<div style="background:#1a0000;border:1px solid #ff4757;border-radius:12px;padding:14px;margin-top:18px;">'+
      '<div style="font-weight:900;font-size:.88rem;color:#ff4757;margin-bottom:10px;">☢️ Danger Zone (Owner Only)</div>'+
      '<button onclick="ownerBanAll()" style="'+btnStyle('#ff4757','#fff')+'width:100%;margin-bottom:8px;">🚫 Ban ALL Non-Staff Users</button>'+
      '<button onclick="ownerUnbanAll()" style="'+btnStyle('#2ed573','#000')+'width:100%;">✅ Unban ALL Users</button>'+
    '</div>'+
    '</div>';
  document.body.appendChild(panel);
  loadPanelUsers('owner');
}

// ════════════════════════════════════════
// 🛡️ ADMIN PANEL
// ════════════════════════════════════════
function showAdminPanel(){
  var existing=document.getElementById('rolePanel'); if(existing){existing.remove();return;}
  var panel=document.createElement('div');
  panel.id='rolePanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:700px;margin:0 auto;padding:16px 14px 80px;">'+
    panelHeader('🛡️ Admin Panel','#00d4ff')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:12px;padding:14px;margin-bottom:14px;">'+
      '<div style="font-weight:900;font-size:.88rem;margin-bottom:8px;color:#00d4ff;">📢 Announcement</div>'+
      '<input placeholder="Send a message to all users..." id="apAnnounce" style="'+inputStyle()+'">'+
      '<button onclick="apSendAnnouncement()" style="'+btnStyle('#00d4ff','#000')+'margin-top:7px;width:100%;">📢 Send to All Users</button>'+
    '</div>'+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+inputStyle()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading users...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>'+
    '</div>';
  document.body.appendChild(panel);
  loadPanelUsers('admin');
}

// ════════════════════════════════════════
// 🔨 MOD PANEL
// ════════════════════════════════════════
function showModPanel(){
  var existing=document.getElementById('rolePanel'); if(existing){existing.remove();return;}
  var panel=document.createElement('div');
  panel.id='rolePanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:700px;margin:0 auto;padding:16px 14px 80px;">'+
    panelHeader('🔨 Mod Panel','#8e24aa')+
    '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:.82rem;color:#7878a0;">'+
      'As a Mod, you can kick players off games. For bans or game blocks, contact an Admin.'+
    '</div>'+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+inputStyle()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading users...</div></div>'+
    '</div>';
  document.body.appendChild(panel);
  loadPanelUsers('mod');
}

// ── Shared panel helpers ──
function panelHeader(title, color){
  return '<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:16px;">'+
    '<div style="display:flex;align-items:center;gap:10px;">'+
      '<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbxG68RG-Zgp8zo8TpQrPJgpBFbfGMsxqbRcPlkwcMbN9rZpgdpl1Zgkz7&s=10" style="width:30px;height:30px;border-radius:7px;border:2px solid '+color+';">'+
      '<h2 style="color:'+color+';font-size:1.2rem;font-weight:900;">'+title+'</h2>'+
    '</div>'+
    '<button onclick="document.getElementById(\'rolePanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>'+
  '</div>';
}

function inputStyle(){
  return 'width:100%;padding:9px 12px;background:#0f0f13;border:1.5px solid #2e2e3e;border-radius:9px;color:#e8e8f0;font-size:.86rem;font-family:Nunito,sans-serif;outline:none;box-sizing:border-box;';
}

function btnStyle(bg, color){
  return 'background:'+bg+';color:'+color+';border:none;padding:8px 14px;border-radius:8px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.82rem;';
}

function loadPanelUsers(viewerRole){
  db.collection('users').orderBy('createdAt','desc').get().then(function(snap){
    var users=[];
    snap.forEach(function(doc){users.push(Object.assign({uid:doc.id},doc.data()));});
    renderPanelUsers(users, viewerRole);

    // Stats (owner + admin only)
    var statsDiv=document.getElementById('apStats');
    if(statsDiv){
      statsDiv.innerHTML=
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;">'+
          '<div style="font-size:1.6rem;font-weight:900;color:#FFD700;">'+users.length+'</div>'+
          '<div style="font-size:.7rem;color:#888;font-weight:700;">Total Users</div>'+
        '</div>'+
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;">'+
          '<div style="font-size:1.6rem;font-weight:900;color:#ff4757;">'+users.filter(function(u){return u.banned;}).length+'</div>'+
          '<div style="font-size:.7rem;color:#888;font-weight:700;">Banned</div>'+
        '</div>'+
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;">'+
          '<div style="font-size:1.6rem;font-weight:900;color:#ff6b35;">'+_blockedGames.length+'</div>'+
          '<div style="font-size:.7rem;color:#888;font-weight:700;">Blocked Games</div>'+
        '</div>';
    }
  });
}

function renderPanelUsers(users, viewerRole){
  var list=document.getElementById('apUserList');
  if(!list)return;
  var myUid=(currentUser||{}).uid||'';

  list.innerHTML=users.map(function(u){
    var isBanned=u.banned===true;
    var isSelf=u.uid===myUid;
    var uRole=getUserRole(u);
    var statusColor=isBanned?'#ff4757':isSelf?'#2ed573':'#00d4ff';
    var statusLabel=isBanned?'BANNED':isSelf?'YOU':'ACTIVE';

    // Owner can see/do everything
    // Admin can ban/kick regular users and mods (not owners)
    // Mod can only kick regular users
    var canBan = !isSelf && (
      viewerRole==='owner' ||
      (viewerRole==='admin' && uRole!=='owner' && uRole!=='admin')
    );
    var canKick = !isSelf && (
      viewerRole==='owner' ||
      viewerRole==='admin' ||
      (viewerRole==='mod' && uRole==='user')
    );
    var canViewProfile = viewerRole==='owner';
    var canPromote = viewerRole==='owner' && !isSelf;

    var actionBtns = '';
    if(canBan){
      actionBtns += isBanned
        ?'<button onclick="apUnban(\''+u.uid+'\')" style="'+btnStyle('#2ed573','#000')+'">Unban</button>'
        :'<button onclick="apBan(\''+u.uid+'\')" style="'+btnStyle('#ff4757','#fff')+'">Ban</button>';
    }
    if(canKick){
      actionBtns += '<button onclick="apKick(\''+u.uid+'\')" style="'+btnStyle('#ff6b35','#fff')+'">Kick</button>';
    }
    if(canViewProfile){
      actionBtns += '<button onclick="ownerViewUser(\''+u.uid+'\')" style="'+btnStyle('#1e90ff','#fff')+'">View</button>';
    }
    if(canPromote){
      if(uRole==='user') actionBtns += '<button onclick="ownerSetRole(\''+u.uid+'\',\'mod\')" style="'+btnStyle('#8e24aa','#fff')+'">Make Mod</button>';
      if(uRole==='mod')  actionBtns += '<button onclick="ownerSetRole(\''+u.uid+'\',\'user\')" style="'+btnStyle('#555','#fff')+'">Remove Mod</button>';
    }

    return '<div class="ap-row" data-username="'+(u.usernameLower||'')+'" data-name="'+(u.name||'').toLowerCase()+'" style="display:flex;align-items:center;gap:9px;background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:9px 11px;margin-bottom:7px;flex-wrap:wrap;">'+
      '<div style="width:40px;height:40px;border-radius:50%;background:'+statusColor+';color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;overflow:hidden;">'+
        (u.pfp?'<img src="'+u.pfp+'" style="width:100%;height:100%;object-fit:cover;">':(u.username||'?')[0].toUpperCase())+
      '</div>'+
      '<div style="flex:1;min-width:0;">'+
        '<div style="font-weight:900;font-size:.9rem;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">'+
          '@'+(u.username||'?')+
          ' <span style="font-size:.58rem;background:'+statusColor+';color:#000;padding:1px 7px;border-radius:4px;font-weight:900;">'+statusLabel+'</span>'+
          getRoleBadgeHtml(uRole)+
        '</div>'+
        '<div style="font-size:.72rem;color:#aaa;margin-top:1px;">'+(u.name||'')+' • '+(u.email||'')+'</div>'+
        '<div style="font-size:.67rem;color:#666;">Games: '+(u.gamesPlayed||0)+' • Joined: '+(u.since||'?')+'</div>'+
      '</div>'+
      (actionBtns?'<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;">'+actionBtns+'</div>':'')+
    '</div>';
  }).join('');
}

function apFilterUsers(q){
  document.querySelectorAll('#apUserList .ap-row').forEach(function(r){
    var un=r.getAttribute('data-username')||'';
    var nm=r.getAttribute('data-name')||'';
    r.style.display=(!q||un.includes(q.toLowerCase())||nm.includes(q.toLowerCase()))?'':'none';
  });
}

// ── OWNER EXCLUSIVE ACTIONS ──
function ownerViewUser(uid){
  db.collection('users').doc(uid).get().then(function(doc){
    if(!doc.exists)return;
    var u=doc.data();
    var role=getUserRole(u);
    alert(
      '👤 @'+u.username+'\n'+
      'Name: '+u.name+'\n'+
      'Email: '+u.email+'\n'+
      'Role: '+role.toUpperCase()+'\n'+
      'Games Played: '+(u.gamesPlayed||0)+'\n'+
      'Friends: '+(u.friends||[]).length+'\n'+
      'Joined: '+(u.since||'?')+'\n'+
      'Status: '+(u.banned?'BANNED':'Active')
    );
  });
}

function ownerSetRole(uid, newRole){
  db.collection('users').doc(uid).update({
    role: newRole,
    isMod: newRole==='mod',
    isAdmin: false,
    isOwner: false
  }).then(function(){
    sendNotification(uid, newRole==='mod'
      ? '🔨 You have been promoted to Mod!'
      : '📋 Your role has been updated.', 'info');
    // Refresh panel
    var p=document.getElementById('rolePanel'); if(p) p.remove();
    showOwnerPanel();
  });
}

function ownerBanAll(){
  if(!confirm('Ban ALL non-staff users? This cannot be undone easily!')) return;
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){
      var d=doc.data();
      var r=getUserRole(d);
      if(r==='user') batch.update(doc.ref,{banned:true});
    });
    batch.commit().then(function(){
      sendGlobalNotification('⚠️ A mass action was performed by the Owner.','warning');
      var p=document.getElementById('rolePanel'); if(p) p.remove();
      showOwnerPanel();
    });
  });
}

function ownerUnbanAll(){
  if(!confirm('Unban ALL users?')) return;
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){ batch.update(doc.ref,{banned:false}); });
    batch.commit().then(function(){
      var p=document.getElementById('rolePanel'); if(p) p.remove();
      showOwnerPanel();
    });
  });
}

// ── SHARED ADMIN ACTIONS ──
function apBan(uid){
  db.collection('users').doc(uid).update({banned:true}).then(function(){
    sendNotification(uid,'You have been banned from Dv\'s Unblocked Games.','warning');
    var p=document.getElementById('rolePanel'); if(p) p.remove();
    showRolePanel();
  });
}
function apUnban(uid){
  db.collection('users').doc(uid).update({banned:false}).then(function(){
    var p=document.getElementById('rolePanel'); if(p) p.remove();
    showRolePanel();
  });
}
function apKick(uid){
  db.collection('users').doc(uid).update({
    kicked: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    sendNotification(uid,'You have been kicked by a staff member.','warning');
  });
}

function apBlockGame(id){
  var b=_blockedGames.slice();
  if(!b.includes(id)) b.push(id);
  saveBlockedGames(b);
  sendGlobalNotification('🚫 A game has been temporarily blocked by staff.','warning');
}
function apUnblockGame(id){
  saveBlockedGames(_blockedGames.filter(function(b){return b!==id;}));
  sendGlobalNotification('✅ A game has been unblocked!','info');
}

function apSendAnnouncement(){
  var msg=(document.getElementById('apAnnounce').value||'').trim();
  if(!msg){alert('Type a message first!');return;}
  sendGlobalNotification('📢 '+msg,'update');
  document.getElementById('apAnnounce').value='';
  showNotifToast('Announcement sent to all users!','info');
}

function renderAdminGameRows(){
  return GAMES.map(function(g){
    var isBlocked=_blockedGames.includes(g.id);
    return '<div style="display:flex;align-items:center;gap:10px;background:#13131c;border:1px solid #2e2e3e;border-radius:9px;padding:8px 12px;margin-bottom:7px;">'+
      '<img src="'+g.thumb+'" style="width:38px;height:38px;border-radius:7px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">'+
      '<div style="flex:1;font-weight:900;font-size:.88rem;">'+g.name+'</div>'+
      (isBlocked
        ?'<span style="color:#ff4757;font-size:.72rem;margin-right:5px;">🚫 BLOCKED</span><button onclick="apUnblockGame(\''+g.id+'\')" style="'+btnStyle('#2ed573','#000')+'">Unblock</button>'
        :'<button onclick="apBlockGame(\''+g.id+'\')" style="'+btnStyle('#ff6b35','#fff')+'">Block</button>')+
    '</div>';
  }).join('');
}

function timeAgo(ts){
  if(!ts)return'Never';
  var d=(Date.now()-(ts.toMillis?ts.toMillis():ts))/1000;
  if(d<60)return'Just now';
  if(d<3600)return Math.floor(d/60)+'m ago';
  if(d<86400)return Math.floor(d/3600)+'h ago';
  return Math.floor(d/86400)+'d ago';
}

// ── KICK / BAN real-time listener ──
function listenForKick(uid){
  db.collection('users').doc(uid).onSnapshot(function(doc){
    if(!doc.exists)return;
    var data=doc.data();
    if(data.banned){
      auth.signOut();
      alert('You have been banned from Dv\'s Unblocked Games.');
      location.reload();
    }
    if(data.kicked&&data.kicked.toMillis&&Date.now()-data.kicked.toMillis()<10000){
      auth.signOut();
      alert('You have been kicked by a staff member.');
      location.reload();
    }
  });
}

// ── POPUP ──
function openPopup(game){
  if(_blockedGames.includes(game.id)){alert('🚫 This game is blocked by staff. Check back later!');return;}
  currentGame=game;
  var thumb=document.getElementById('popupThumb');
  thumb.src=game.thumb; thumb.style.display='block';
  thumb.onerror=function(){this.style.display='none';};
  document.getElementById('popupTitle').textContent=game.name;
  document.getElementById('popupDesc').textContent=game.desc;
  document.getElementById('gamePopup').classList.remove('hidden');
}

function closePopup(){document.getElementById('gamePopup').classList.add('hidden');currentGame=null;}

function launchGame(mode){
  if(!currentGame)return;
  saveHistory(currentGame);
  var name=currentGame.name,url=currentGame.url;
  if(mode==='iframe'){
    closePopup();
    document.getElementById('inPageTitle').textContent=name;
    document.getElementById('inPageFrame').src=url;
    document.getElementById('inPageGame').classList.remove('hidden');
    document.getElementById('navbar').style.display='none';
    document.getElementById('bnavBar').style.display='none';
  } else if(mode==='blank'||mode==='blankfull'){
    var w=window.open('about:blank','_blank');
    if(!w){alert('Allow pop-ups!');return;}
    w.document.write('<!DOCTYPE html><html><head><title>'+name+'</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}iframe{position:fixed;inset:0;width:100%;height:100%;border:none}</style></head><body><iframe src="'+url+'" allow="autoplay;fullscreen;gamepad" allowfullscreen></iframe></body></html>');
    w.document.close();closePopup();
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
  if(!currentUser)return;
  var h={id:game.id,name:game.name,thumb:game.thumb,color:game.color,ts:Date.now()};
  var history=(currentUser.history||[]).filter(function(x){return x.id!==game.id;});
  history.unshift(h);
  if(history.length>12)history=history.slice(0,12);
  currentUser.history=history;
  currentUser.gamesPlayed=(currentUser.gamesPlayed||0)+1;
  db.collection('users').doc(currentUser.uid).update({
    history:history,
    gamesPlayed:firebase.firestore.FieldValue.increment(1),
    lastSeen:firebase.firestore.FieldValue.serverTimestamp()
  });
  var row=document.getElementById('continueRow');
  var sec=document.getElementById('continueSection');
  if(row&&sec){
    sec.style.display='block';row.innerHTML='';
    history.forEach(function(h){var g=GAMES.find(function(g){return g.id===h.id;});if(g)row.appendChild(makeCard(g));});
  }
}

function makeCard(game){
  var isBlocked=_blockedGames.includes(game.id);
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
  var isBlocked=_blockedGames.includes(game.id);
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
