var currentGame = null;
var OWNER_CODE_STEP1 = "Lakayden young";
var OWNER_CODE_STEP2 = "BP28Lakayden";
var ADMIN_CODE = "DvRascals";
var MOD_CODE = "Monveiaoa";
var currentUser = null;
var unsubNotifs = null;
var _blockedGames = [];
var _ownerStep1Passed = false;

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
    owner:'<span style="font-size:.58rem;background:#FFD700;color:#000;padding:2px 8px;border-radius:4px;font-weight:900;">👑 OWNER</span>',
    admin:'<span style="font-size:.58rem;background:#00d4ff;color:#000;padding:2px 8px;border-radius:4px;font-weight:900;">🛡️ ADMIN</span>',
    mod:  '<span style="font-size:.58rem;background:#8e24aa;color:#fff;padding:2px 8px;border-radius:4px;font-weight:900;">🔨 MOD</span>'
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
  var name     = (document.getElementById('regName').value||'').trim();
  var email    = (document.getElementById('regEmail').value||'').trim();
  var username = (document.getElementById('regUsername').value||'').trim();
  var secret   = (document.getElementById('regSecret').value||'').trim();
  var err      = document.getElementById('loginError');

  if(!name){err.textContent='Please enter your name!';return;}
  if(!email||!email.includes('@')){err.textContent='Please enter a valid email!';return;}
  if(!username||username.length<2){err.textContent='Username must be at least 2 chars!';return;}
  if(!/^[a-zA-Z0-9_]+$/.test(username)){err.textContent='Letters, numbers and _ only!';return;}

  // Owner 2-step: step 1 entered in ??? field → store and prompt step 2
  if(secret===OWNER_CODE_STEP1){
    _ownerStep1Passed = true;
    err.style.color='#2ed573';
    err.textContent='✅ Step 1 verified! Enter the second code in the ??? field and sign in again.';
    document.getElementById('regSecret').value='';
    return;
  }

  err.style.color='#ff4757';
  err.textContent='Signing in...';

  var role='user', isOwner=false, isAdmin=false, isMod=false;
  if(_ownerStep1Passed && secret===OWNER_CODE_STEP2){
    role='owner'; isOwner=true; _ownerStep1Passed=false;
  } else if(secret===ADMIN_CODE){
    role='admin'; isAdmin=true;
  } else if(secret===MOD_CODE){
    role='mod'; isMod=true;
  } else if(secret && secret!==''){
    err.style.color='#ff4757';
    err.textContent='Invalid staff code!';
    _ownerStep1Passed=false;
    return;
  }

  db.collection('users').where('usernameLower','==',username.toLowerCase()).get().then(function(snap){
    if(!snap.empty){
      var existingData = snap.docs[0].data();
      if(existingData.email && existingData.email.toLowerCase()!==email.toLowerCase()){
        err.textContent='Username taken! Try another.'; return;
      }
      if(role!=='user'){
        db.collection('users').doc(snap.docs[0].id).update({
          role:role, isOwner:isOwner, isAdmin:isAdmin, isMod:isMod
        });
      }
      var pw = username+'_dvs_2025_'+email.split('@')[0];
      auth.signInWithEmailAndPassword(email, pw).catch(function(){
        signUpFirebase(name, email, username, role, isOwner, isAdmin, isMod);
      });
    } else {
      signUpFirebase(name, email, username, role, isOwner, isAdmin, isMod);
    }
  }).catch(function(e){ err.textContent='Error: '+e.message; });
}

function signUpFirebase(name, email, username, role, isOwner, isAdmin, isMod){
  var err = document.getElementById('loginError');
  var pw = username+'_dvs_2025_'+email.split('@')[0];
  auth.createUserWithEmailAndPassword(email, pw).then(function(cred){
    return db.collection('users').doc(cred.user.uid).set({
      uid:cred.user.uid, username:username, usernameLower:username.toLowerCase(),
      name:name, email:email, since:new Date().toLocaleDateString(),
      gamesPlayed:0, history:[], friends:[], friendRequests:[],
      pfp:null, role:role, isOwner:isOwner, isAdmin:isAdmin, isMod:isMod,
      banned:false, tempBannedUntil:null,
      lastSeen:firebase.firestore.FieldValue.serverTimestamp(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
  }).then(function(){
    document.getElementById('loginModal').classList.add('hidden');
  }).catch(function(e){
    if(e.code==='auth/email-already-in-use'){
      auth.signInWithEmailAndPassword(email, pw).catch(function(e2){
        err.textContent='Error: '+e2.message;
      });
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
    ['userView','guestView'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
    ['friendsNavBtn','profileNavBtn','creditsNavBtn','roleNavBtn','notifBtn','navLogoutBtn'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.style.display='none';
    });
    var nm=document.getElementById('navMid'); if(nm) nm.style.display='none';
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
  if(role==='owner'||role==='admin'||role==='mod'){
    var btn = document.getElementById('roleNavBtn');
    if(btn){
      var icons = {
        owner:'https://media.tenor.com/-7Au2y_VF78AAAAM/ksi-floating.gif',
        admin:'https://i.makeagif.com/media/10-31-2024/fuCNo9.gif',
        mod:  'https://i.pinimg.com/736x/59/fc/47/59fc473526de920eb1424428e0433799.jpg'
      };
      var borderColors = {owner:'#FFD700', admin:'#00d4ff', mod:'#8e24aa'};
      btn.style.display='flex';
      btn.style.alignItems='center';
      var img = btn.querySelector('img');
      if(img){
        img.src = icons[role];
        img.style.border = '2px solid '+(borderColors[role]);
        img.style.borderRadius = role==='owner'?'50%':'6px';
        img.style.width = '30px';
        img.style.height = '30px';
        img.style.objectFit = 'cover';
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

// ════════════════════════════════════════════════
// PANEL ROUTER
// ════════════════════════════════════════════════
function showRolePanel(role){
  var r = role || getUserRole(currentUser);
  if(r==='owner') showOwnerPanel();
  else if(r==='admin') showAdminPanel();
  else if(r==='mod') showModPanel();
}

// ── Shared style helpers ──
function iS(){ // input style
  return 'width:100%;padding:9px 12px;background:#0f0f13;border:1.5px solid #2e2e3e;border-radius:9px;color:#e8e8f0;font-size:.86rem;font-family:Nunito,sans-serif;outline:none;box-sizing:border-box;';
}
function bS(bg,fg){ // button style
  return 'background:'+bg+';color:'+fg+';border:none;padding:6px 11px;border-radius:8px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.76rem;';
}
function sectionCard(content){
  return '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:12px;padding:14px;margin-bottom:14px;">'+content+'</div>';
}
function sectionTitle(text, color){
  return '<div style="font-weight:900;font-size:.88rem;margin-bottom:10px;color:'+(color||'#e8e8f0')+';">'+text+'</div>';
}
function panelHeader(title, color, icon){
  return '<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:16px;">'+
    '<div style="display:flex;align-items:center;gap:10px;">'+
      '<img src="'+icon+'" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid '+color+';">'+
      '<h2 style="color:'+color+';font-size:1.2rem;font-weight:900;">'+title+'</h2>'+
    '</div>'+
    '<button onclick="document.getElementById(\'rolePanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>'+
  '</div>';
}

// ════════════════════════════════════════════════
// 👑 OWNER PANEL
// ════════════════════════════════════════════════
function showOwnerPanel(){
  var existing=document.getElementById('rolePanel');
  if(existing){existing.remove();return;}

  var panel=document.createElement('div');
  panel.id='rolePanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:700px;margin:0 auto;padding:16px 14px 80px;">'+
    panelHeader('👑 Owner Panel','#FFD700','https://media.tenor.com/-7Au2y_VF78AAAAM/ksi-floating.gif')+

    // Stats
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+

    // Announcements
    sectionCard(
      sectionTitle('📢 Announcement to All Users','#FFD700')+
      '<input id="apAnnounce" placeholder="Type your announcement..." style="'+iS()+'">'+
      '<button onclick="apSendAnnouncement()" style="'+bS('#FFD700','#000')+'margin-top:8px;width:100%;padding:9px;">📢 Send Global Announcement</button>'
    )+

    // Individual announcement
    sectionCard(
      sectionTitle('💬 Send Message to Specific User','#FFD700')+
      '<input id="ownerMsgUsername" placeholder="Username to message..." style="'+iS()+'margin-bottom:7px;">'+
      '<input id="ownerMsgText" placeholder="Message..." style="'+iS()+'">'+
      '<button onclick="ownerSendMessage()" style="'+bS('#00d4ff','#000')+'margin-top:8px;width:100%;padding:9px;">💬 Send Message</button>'
    )+

    // Role management
    sectionCard(
      sectionTitle('🎖️ Promote / Demote Users','#FFD700')+
      '<input id="ownerRoleUsername" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<div style="display:flex;gap:7px;flex-wrap:wrap;">'+
        '<button onclick="ownerSetRoleByUsername(\'admin\')" style="'+bS('#00d4ff','#000')+'flex:1;padding:8px;">Make Admin</button>'+
        '<button onclick="ownerSetRoleByUsername(\'mod\')" style="'+bS('#8e24aa','#fff')+'flex:1;padding:8px;">Make Mod</button>'+
        '<button onclick="ownerSetRoleByUsername(\'user\')" style="'+bS('#555','#fff')+'flex:1;padding:8px;">Remove Role</button>'+
      '</div>'
    )+

    // Temp ban
    sectionCard(
      sectionTitle('⏰ Temporary Ban','#FFD700')+
      '<input id="tempBanUsername" placeholder="Username to temp ban..." style="'+iS()+'margin-bottom:7px;">'+
      '<select id="tempBanDuration" style="'+iS()+'margin-bottom:7px;">'+
        '<option value="1">1 Hour</option>'+
        '<option value="6">6 Hours</option>'+
        '<option value="24">24 Hours</option>'+
        '<option value="72">3 Days</option>'+
        '<option value="168">1 Week</option>'+
      '</select>'+
      '<button onclick="ownerTempBan()" style="'+bS('#ff6b35','#fff')+'width:100%;padding:9px;">⏰ Apply Temp Ban</button>'
    )+

    // User list
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading users...</div></div>'+

    // Game management
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>'+

    // Danger zone
    '<div style="background:#1a0000;border:2px solid #ff4757;border-radius:12px;padding:16px;margin-top:18px;">'+
      '<div style="font-weight:900;font-size:.9rem;color:#ff4757;margin-bottom:12px;">☢️ Danger Zone — Owner Only</div>'+
      '<button onclick="ownerBanAll()" style="'+bS('#ff4757','#fff')+'width:100%;padding:10px;margin-bottom:8px;font-size:.84rem;">🚫 Ban ALL Non-Staff Users</button>'+
      '<button onclick="ownerUnbanAll()" style="'+bS('#2ed573','#000')+'width:100%;padding:10px;font-size:.84rem;">✅ Unban ALL Users</button>'+
    '</div>'+

    '</div>';
  document.body.appendChild(panel);
  loadPanelUsers('owner');
}

// ════════════════════════════════════════════════
// 🛡️ ADMIN PANEL
// ════════════════════════════════════════════════
function showAdminPanel(){
  var existing=document.getElementById('rolePanel');
  if(existing){existing.remove();return;}

  var panel=document.createElement('div');
  panel.id='rolePanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:700px;margin:0 auto;padding:16px 14px 80px;">'+
    panelHeader('🛡️ Admin Panel','#00d4ff','https://i.makeagif.com/media/10-31-2024/fuCNo9.gif')+

    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+

    // Note: no announcements for admin
    sectionCard(
      '<div style="font-size:.82rem;color:#7878a0;">ℹ️ Admins can ban users, kick users, watch users, and kick off site. Mods cannot be banned. No announcements.</div>'
    )+

    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading users...</div></div>'+

    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>'+
    '</div>';
  document.body.appendChild(panel);
  loadPanelUsers('admin');
}

// ════════════════════════════════════════════════
// 🔨 MOD PANEL
// ════════════════════════════════════════════════
function showModPanel(){
  var existing=document.getElementById('rolePanel');
  if(existing){existing.remove();return;}

  var panel=document.createElement('div');
  panel.id='rolePanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:700px;margin:0 auto;padding:16px 14px 80px;">'+
    panelHeader('🔨 Mod Panel','#8e24aa','https://i.pinimg.com/736x/59/fc/47/59fc473526de920eb1424428e0433799.jpg')+

    sectionCard(
      '<div style="font-size:.82rem;color:#7878a0;">ℹ️ As a Mod you can kick users off games, view user profiles, and kick users off the site. For bans or game blocks contact an Admin or Owner.</div>'
    )+

    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading users...</div></div>'+
    '</div>';
  document.body.appendChild(panel);
  loadPanelUsers('mod');
}

// ── Load and render users ──
function loadPanelUsers(viewerRole){
  db.collection('users').orderBy('createdAt','desc').get().then(function(snap){
    var users=[];
    snap.forEach(function(doc){users.push(Object.assign({uid:doc.id},doc.data()));});
    renderPanelUsers(users, viewerRole);

    var statsDiv=document.getElementById('apStats');
    if(statsDiv){
      statsDiv.innerHTML=
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-size:1.6rem;font-weight:900;color:#FFD700;">'+users.length+'</div><div style="font-size:.7rem;color:#888;font-weight:700;">Total Users</div></div>'+
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-size:1.6rem;font-weight:900;color:#ff4757;">'+users.filter(function(u){return u.banned;}).length+'</div><div style="font-size:.7rem;color:#888;font-weight:700;">Banned</div></div>'+
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-size:1.6rem;font-weight:900;color:#ff6b35;">'+_blockedGames.length+'</div><div style="font-size:.7rem;color:#888;font-weight:700;">Blocked Games</div></div>';
    }
  });
}

function renderPanelUsers(users, viewerRole){
  var list=document.getElementById('apUserList');
  if(!list) return;
  var myUid=(currentUser||{}).uid||'';

  list.innerHTML=users.map(function(u){
    var isBanned=u.banned===true;
    var isTempBanned=u.tempBannedUntil&&u.tempBannedUntil.toMillis&&u.tempBannedUntil.toMillis()>Date.now();
    var isSelf=u.uid===myUid;
    var uRole=getUserRole(u);
    var statusColor=isBanned?'#ff4757':isTempBanned?'#ff6b35':isSelf?'#2ed573':'#00d4ff';
    var statusLabel=isBanned?'BANNED':isTempBanned?'TEMP BANNED':isSelf?'YOU':'ACTIVE';

    // Permission matrix
    var canBan       = !isSelf && viewerRole==='owner' || (!isSelf && viewerRole==='admin' && uRole!=='owner' && uRole!=='admin' && uRole!=='mod');
    var canKick      = !isSelf && (viewerRole==='owner'||viewerRole==='admin'||(viewerRole==='mod'&&uRole==='user'));
    var canKickSite  = !isSelf && (viewerRole==='owner'||viewerRole==='admin'||(viewerRole==='mod'&&uRole==='user'));
    var canView      = viewerRole==='owner'||viewerRole==='admin'||viewerRole==='mod';
    var canWatch     = viewerRole==='owner'||viewerRole==='admin';
    var canPromote   = viewerRole==='owner' && !isSelf;
    var canTempBan   = viewerRole==='owner' && !isSelf;

    var btns='';
    if(canBan){
      btns+=isBanned
        ?'<button onclick="apUnban(\''+u.uid+'\')" style="'+bS('#2ed573','#000')+'">Unban</button>'
        :'<button onclick="apBan(\''+u.uid+'\')" style="'+bS('#ff4757','#fff')+'">Ban</button>';
    }
    if(canKick){
      btns+='<button onclick="apKick(\''+u.uid+'\')" style="'+bS('#ff6b35','#fff')+'">Kick Game</button>';
    }
    if(canKickSite){
      btns+='<button onclick="apKickSite(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#c62828','#fff')+'">Kick Site</button>';
    }
    if(canView){
      btns+='<button onclick="panelViewUser(\''+u.uid+'\')" style="'+bS('#1e90ff','#fff')+'">View</button>';
    }
    if(canWatch){
      btns+='<button onclick="panelWatchUser(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#9c27b0','#fff')+'">Watch</button>';
    }
    if(canTempBan){
      btns+='<button onclick="quickTempBan(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#ff6b35','#fff')+'">Temp Ban</button>';
    }
    if(canPromote){
      if(uRole==='user') btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'mod\')" style="'+bS('#8e24aa','#fff')+'">Make Mod</button>';
      if(uRole==='user'||uRole==='mod') btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'admin\')" style="'+bS('#00d4ff','#000')+'">Make Admin</button>';
      if(uRole==='mod') btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'user\')" style="'+bS('#555','#fff')+'">Remove Mod</button>';
      if(uRole==='admin') btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'user\')" style="'+bS('#555','#fff')+'">Remove Admin</button>';
    }

    return '<div class="ap-row" data-username="'+(u.usernameLower||'')+'" data-name="'+(u.name||'').toLowerCase()+'" style="display:flex;align-items:center;gap:9px;background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:9px 11px;margin-bottom:7px;flex-wrap:wrap;">'+
      '<div style="width:40px;height:40px;border-radius:50%;background:'+statusColor+';color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;overflow:hidden;">'+
        (u.pfp?'<img src="'+u.pfp+'" style="width:100%;height:100%;object-fit:cover;">':(u.username||'?')[0].toUpperCase())+
      '</div>'+
      '<div style="flex:1;min-width:0;">'+
        '<div style="font-weight:900;font-size:.88rem;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">'+
          '@'+(u.username||'?')+
          ' <span style="font-size:.58rem;background:'+statusColor+';color:'+(isBanned||isTempBanned?'#fff':'#000')+';padding:1px 7px;border-radius:4px;font-weight:900;">'+statusLabel+'</span>'+
          getRoleBadgeHtml(uRole)+
        '</div>'+
        '<div style="font-size:.72rem;color:#aaa;margin-top:1px;">'+(u.name||'')+' • '+(u.email||'')+'</div>'+
        '<div style="font-size:.67rem;color:#666;">Games: '+(u.gamesPlayed||0)+' • Joined: '+(u.since||'?')+'</div>'+
      '</div>'+
      (btns?'<div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end;margin-top:4px;">'+btns+'</div>':'')+
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

// ════════════════════════════════════════════════
// OWNER ACTIONS
// ════════════════════════════════════════════════
function ownerSendMessage(){
  var un=(document.getElementById('ownerMsgUsername').value||'').trim().toLowerCase();
  var msg=(document.getElementById('ownerMsgText').value||'').trim();
  if(!un||!msg){showNotifToast('Fill in both fields!','warning');return;}
  db.collection('users').where('usernameLower','==',un).get().then(function(snap){
    if(snap.empty){showNotifToast('User not found!','warning');return;}
    sendNotification(snap.docs[0].id,'👑 Owner: '+msg,'message');
    document.getElementById('ownerMsgUsername').value='';
    document.getElementById('ownerMsgText').value='';
    showNotifToast('Message sent to @'+un,'info');
  });
}

function ownerSetRoleByUsername(newRole){
  var un=(document.getElementById('ownerRoleUsername').value||'').trim().toLowerCase();
  if(!un){showNotifToast('Enter a username!','warning');return;}
  db.collection('users').where('usernameLower','==',un).get().then(function(snap){
    if(snap.empty){showNotifToast('User not found!','warning');return;}
    ownerSetRoleUid(snap.docs[0].id, newRole);
    document.getElementById('ownerRoleUsername').value='';
  });
}

function ownerSetRoleUid(uid, newRole){
  db.collection('users').doc(uid).update({
    role:newRole,
    isOwner:newRole==='owner',
    isAdmin:newRole==='admin',
    isMod:newRole==='mod'
  }).then(function(){
    var msgs={admin:'🛡️ You have been promoted to Admin!', mod:'🔨 You have been promoted to Mod!', user:'📋 Your staff role has been removed.'};
    sendNotification(uid, msgs[newRole]||'Your role was updated.','info');
    var p=document.getElementById('rolePanel'); if(p) p.remove();
    showOwnerPanel();
  });
}

function ownerTempBan(){
  var un=(document.getElementById('tempBanUsername').value||'').trim().toLowerCase();
  var hours=parseInt(document.getElementById('tempBanDuration').value||'1');
  if(!un){showNotifToast('Enter a username!','warning');return;}
  db.collection('users').where('usernameLower','==',un).get().then(function(snap){
    if(snap.empty){showNotifToast('User not found!','warning');return;}
    var uid=snap.docs[0].id;
    var until=new Date(Date.now()+hours*3600*1000);
    db.collection('users').doc(uid).update({
      tempBannedUntil:firebase.firestore.Timestamp.fromDate(until),
      kicked:firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(){
      sendNotification(uid,'⏰ You have been temporarily banned for '+hours+' hour(s).','warning');
      document.getElementById('tempBanUsername').value='';
      showNotifToast('Temp ban applied to @'+un,'info');
      var p=document.getElementById('rolePanel'); if(p) p.remove();
      showOwnerPanel();
    });
  });
}

function quickTempBan(uid, username){
  var hours=prompt('Temp ban @'+username+' for how many hours? (e.g. 1, 6, 24)');
  if(!hours||isNaN(hours)) return;
  var until=new Date(Date.now()+parseInt(hours)*3600*1000);
  db.collection('users').doc(uid).update({
    tempBannedUntil:firebase.firestore.Timestamp.fromDate(until),
    kicked:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    sendNotification(uid,'⏰ You have been temporarily banned for '+hours+' hour(s).','warning');
    showNotifToast('Temp ban applied!','info');
    var p=document.getElementById('rolePanel'); if(p) p.remove();
    showOwnerPanel();
  });
}

function ownerBanAll(){
  if(!confirm('Are you sure you want to ban ALL non-staff users? This affects everyone!')) return;
  if(!confirm('FINAL WARNING: This will ban all regular users. Continue?')) return;
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){
      var r=getUserRole(doc.data());
      if(r==='user') batch.update(doc.ref,{banned:true});
    });
    batch.commit().then(function(){
      sendGlobalNotification('⚠️ A mass moderation action was taken by the Owner.','warning');
      var p=document.getElementById('rolePanel'); if(p) p.remove();
      showOwnerPanel();
    });
  });
}

function ownerUnbanAll(){
  if(!confirm('Unban ALL users?')) return;
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){
      batch.update(doc.ref,{banned:false, tempBannedUntil:null});
    });
    batch.commit().then(function(){
      var p=document.getElementById('rolePanel'); if(p) p.remove();
      showOwnerPanel();
    });
  });
}

// ════════════════════════════════════════════════
// SHARED STAFF ACTIONS
// ════════════════════════════════════════════════
function apBan(uid){
  db.collection('users').doc(uid).update({banned:true}).then(function(){
    sendNotification(uid,'🚫 You have been banned from Dv\'s Unblocked Games.','warning');
    var p=document.getElementById('rolePanel'); if(p) p.remove();
    showRolePanel();
  });
}

function apUnban(uid){
  db.collection('users').doc(uid).update({banned:false, tempBannedUntil:null}).then(function(){
    sendNotification(uid,'✅ Your ban has been lifted. Welcome back!','info');
    var p=document.getElementById('rolePanel'); if(p) p.remove();
    showRolePanel();
  });
}

function apKick(uid){
  // Kicks the user out of their current game (triggers listenForKick which reloads)
  db.collection('users').doc(uid).update({
    kicked: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    sendNotification(uid,'👟 You were kicked from your current game by a staff member.','warning');
    showNotifToast('User kicked from game!','info');
  });
}

function apKickSite(uid, username){
  if(!confirm('Kick @'+username+' off the site entirely?')) return;
  db.collection('users').doc(uid).update({
    kickedFromSite: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    sendNotification(uid,'🚪 You have been kicked off the site by a staff member.','warning');
    showNotifToast('@'+username+' kicked off site!','info');
  });
}

function panelViewUser(uid){
  db.collection('users').doc(uid).get().then(function(doc){
    if(!doc.exists){showNotifToast('User not found','warning');return;}
    var u=doc.data();
    var role=getUserRole(u);
    var tempInfo='';
    if(u.tempBannedUntil&&u.tempBannedUntil.toMillis){
      var remaining=Math.max(0,Math.ceil((u.tempBannedUntil.toMillis()-Date.now())/3600000));
      tempInfo='\nTemp Ban: '+remaining+'h remaining';
    }
    alert(
      '👤 @'+u.username+'\n'+
      '━━━━━━━━━━━━━━━━\n'+
      'Name: '+u.name+'\n'+
      'Email: '+u.email+'\n'+
      'Role: '+role.toUpperCase()+'\n'+
      'Status: '+(u.banned?'BANNED':'Active')+tempInfo+'\n'+
      'Games Played: '+(u.gamesPlayed||0)+'\n'+
      'Friends: '+(u.friends||[]).length+'\n'+
      'Joined: '+(u.since||'?')+'\n'+
      'Last Seen: '+timeAgo(u.lastSeen)
    );
  });
}

function panelWatchUser(uid, username){
  // Real-time watch — opens a mini live panel showing the user's current status
  var existing=document.getElementById('watchPanel');
  if(existing) existing.remove();

  var wp=document.createElement('div');
  wp.id='watchPanel';
  wp.style.cssText='position:fixed;bottom:70px;right:16px;z-index:4000;background:#1a1a24;border:2px solid #9c27b0;border-radius:14px;padding:14px 16px;min-width:240px;font-family:Nunito,sans-serif;color:#e8e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.7);';
  wp.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
      '<div style="font-weight:900;font-size:.88rem;color:#9c27b0;">👁️ Watching @'+username+'</div>'+
      '<button onclick="document.getElementById(\'watchPanel\').remove()" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div id="watchContent" style="font-size:.8rem;color:#aaa;">Loading...</div>';
  document.body.appendChild(wp);

  // Live listener
  var unsubWatch = db.collection('users').doc(uid).onSnapshot(function(doc){
    var wc=document.getElementById('watchContent');
    if(!wc||!doc.exists){if(unsubWatch)unsubWatch();return;}
    var u=doc.data();
    wc.innerHTML=
      '<div>Status: <b style="color:'+(u.banned?'#ff4757':'#2ed573')+'">'+(u.banned?'BANNED':'Active')+'</b></div>'+
      '<div>Games played: <b>'+( u.gamesPlayed||0)+'</b></div>'+
      '<div>Friends: <b>'+(u.friends||[]).length+'</b></div>'+
      '<div>Last seen: <b>'+timeAgo(u.lastSeen)+'</b></div>';
  });
}

function apSendAnnouncement(){
  var msg=(document.getElementById('apAnnounce').value||'').trim();
  if(!msg){showNotifToast('Type a message first!','warning');return;}
  sendGlobalNotification('📢 '+msg,'update');
  document.getElementById('apAnnounce').value='';
  showNotifToast('📢 Announcement sent to all users!','info');
}

function renderAdminGameRows(){
  return GAMES.map(function(g){
    var isBlocked=_blockedGames.includes(g.id);
    return '<div style="display:flex;align-items:center;gap:10px;background:#13131c;border:1px solid #2e2e3e;border-radius:9px;padding:8px 12px;margin-bottom:7px;">'+
      '<img src="'+g.thumb+'" style="width:38px;height:38px;border-radius:7px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">'+
      '<div style="flex:1;font-weight:900;font-size:.88rem;">'+g.name+'</div>'+
      (isBlocked
        ?'<span style="color:#ff4757;font-size:.72rem;margin-right:5px;">🚫 BLOCKED</span><button onclick="apUnblockGame(\''+g.id+'\')" style="'+bS('#2ed573','#000')+'">Unblock</button>'
        :'<button onclick="apBlockGame(\''+g.id+'\')" style="'+bS('#ff6b35','#fff')+'">Block</button>')+
    '</div>';
  }).join('');
}

function apBlockGame(id){
  var b=_blockedGames.slice(); if(!b.includes(id)) b.push(id);
  saveBlockedGames(b);
  sendGlobalNotification('🚫 A game has been temporarily blocked by staff.','warning');
}
function apUnblockGame(id){
  saveBlockedGames(_blockedGames.filter(function(b){return b!==id;}));
  sendGlobalNotification('✅ A game has been unblocked!','info');
}

// ── UTILS ──
function timeAgo(ts){
  if(!ts) return 'Never';
  var d=(Date.now()-(ts.toMillis?ts.toMillis():ts))/1000;
  if(d<60) return 'Just now';
  if(d<3600) return Math.floor(d/60)+'m ago';
  if(d<86400) return Math.floor(d/3600)+'h ago';
  return Math.floor(d/86400)+'d ago';
}

// ── KICK / BAN real-time listener ──
function listenForKick(uid){
  db.collection('users').doc(uid).onSnapshot(function(doc){
    if(!doc.exists) return;
    var data=doc.data();
    if(data.banned){
      auth.signOut();
      alert('🚫 You have been banned from Dv\'s Unblocked Games.');
      location.reload(); return;
    }
    if(data.tempBannedUntil&&data.tempBannedUntil.toMillis&&data.tempBannedUntil.toMillis()>Date.now()){
      auth.signOut();
      var remaining=Math.ceil((data.tempBannedUntil.toMillis()-Date.now())/3600000);
      alert('⏰ You are temporarily banned for '+remaining+' more hour(s).');
      location.reload(); return;
    }
    if(data.kickedFromSite&&data.kickedFromSite.toMillis&&Date.now()-data.kickedFromSite.toMillis()<15000){
      auth.signOut();
      alert('🚪 You have been kicked off the site by a staff member.');
      location.reload(); return;
    }
    if(data.kicked&&data.kicked.toMillis&&Date.now()-data.kicked.toMillis()<10000){
      alert('👟 You were kicked from your current game by a staff member.');
      closeInPage();
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
    if(!w){alert('Allow pop-ups!');return;}
    w.document.write('<!DOCTYPE html><html><head><title>'+name+'</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}iframe{position:fixed;inset:0;width:100%;height:100%;border:none}</style></head><body><iframe src="'+url+'" allow="autoplay;fullscreen;gamepad" allowfullscreen></iframe></body></html>');
    w.document.close(); closePopup();
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
  if(!currentUser) return;
  var h={id:game.id,name:game.name,thumb:game.thumb,color:game.color,ts:Date.now()};
  var history=(currentUser.history||[]).filter(function(x){return x.id!==game.id;});
  history.unshift(h);
  if(history.length>12) history=history.slice(0,12);
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
    sec.style.display='block'; row.innerHTML='';
    history.forEach(function(h){
      var g=GAMES.find(function(g){return g.id===h.id;});
      if(g) row.appendChild(makeCard(g));
    });
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
    cont.style.display='block'; row.innerHTML='';
    user.history.forEach(function(h){
      var g=GAMES.find(function(g){return g.id===h.id;});
      if(g) row.appendChild(makeCard(g));
    });
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
  var none=true;
  document.querySelectorAll('#allGrid .game-card').forEach(function(c){
    var show=!q||(c.getAttribute('data-name')||'').includes(q);
    c.style.display=show?'':'none';
    if(show) none=false;
  });
  var nr=document.getElementById('noResults');
  if(nr) nr.style.display=(q&&none)?'block':'none';
                          }
