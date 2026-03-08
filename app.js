var currentGame = null;
var OWNER_CODE_STEP1 = "Lakayden young";
var OWNER_CODE_STEP2 = "BP28Lakayden";
var DEV_CODE = "DvsDeveloper2025";
var ADMIN_CODE = "DvRascals";
var MOD_CODE = "Monveiaoa";
var HELPER_CODE = "DvsHelper2025";
var currentUser = null;
var unsubNotifs = null;
var _blockedGames = [];
var _ownerStep1Passed = false;
var ROLE_RANK = {owner:5,developer:4,admin:3,mod:2,helper:1,user:0};

function getBlockedGames(){return _blockedGames;}
function saveBlockedGames(arr){
  _blockedGames=arr;
  db.collection('settings').doc('blockedGames').set({ids:arr});
}
function listenBlockedGames(){
  db.collection('settings').doc('blockedGames').onSnapshot(function(doc){
    _blockedGames=doc.exists?(doc.data().ids||[]):[];
    if(currentUser)renderUserPage(currentUser);else renderGuestGrid();
    var apg=document.getElementById('apGameList');if(apg)apg.innerHTML=renderAdminGameRows();
  });
}

// ── MUSIC ──
var _musicStarted=false;
function startMusic(){
  if(_musicStarted)return;
  var m=document.getElementById('bgMusic');if(!m)return;
  m.volume=0.18;m.loop=true;
  m.play().then(function(){_musicStarted=true;}).catch(function(){
    document.addEventListener('click',function once(){m.play().catch(function(){});_musicStarted=true;document.removeEventListener('click',once);},{once:true});
  });
}
function showSpaceBg(){var bg=document.getElementById('bgWrap');if(bg)bg.style.opacity='0.18';}

// ── AUTH ──
auth.onAuthStateChanged(function(firebaseUser){
  if(firebaseUser){
    db.collection('users').doc(firebaseUser.uid).get().then(function(doc){
      if(doc.exists){
        currentUser=doc.data();currentUser.uid=firebaseUser.uid;
        bootSignedIn(currentUser);
        listenForNotifications(firebaseUser.uid);
        listenForKick(firebaseUser.uid);
        setInterval(function(){updateLastSeen(firebaseUser.uid);},60000);
      } else {auth.signOut();showLoginModal();}
    });
  } else {currentUser=null;showLoginModal();}
  startMusic();
  listenBlockedGames();
});

function updateLastSeen(uid){
  db.collection('users').doc(uid).update({lastSeen:firebase.firestore.FieldValue.serverTimestamp()});
}

// ── NOTIFICATIONS ──
function listenForNotifications(uid){
  if(unsubNotifs)unsubNotifs();
  unsubNotifs=db.collection('users').doc(uid).collection('notifications')
    .where('read','==',false).orderBy('ts','desc').limit(20)
    .onSnapshot(function(snap){
      updateNotifBadge(snap.size);
      snap.docChanges().forEach(function(change){
        if(change.type==='added'){var n=change.doc.data();showNotifToast(n.message,n.type||'info');}
      });
    });
}
function updateNotifBadge(count){
  var b=document.getElementById('notifBadge');if(!b)return;
  b.textContent=count;b.style.display=count>0?'flex':'none';
}
function showNotifToast(message,type){
  var colors={info:'#00d4ff',message:'#2ed573',update:'#FFD700',warning:'#ff4757'};
  var color=colors[type]||colors.info;
  var t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a24;border:2px solid '+color+';color:#e8e8f0;padding:12px 20px;border-radius:12px;font-family:Nunito,sans-serif;font-weight:700;font-size:.88rem;z-index:9999;max-width:320px;width:90%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.5);';
  t.textContent=message;document.body.appendChild(t);
  setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .5s';setTimeout(function(){t.remove();},500);},4000);
}
function sendNotification(toUid,message,type){
  db.collection('users').doc(toUid).collection('notifications').add({
    message:message,type:type||'info',read:false,ts:firebase.firestore.FieldValue.serverTimestamp()
  });
}
function sendGlobalNotification(message,type,senderUid,senderUsername,senderPfp,senderRole){
  // Store in global announcements feed
  db.collection('announcements').add({
    message:message,
    type:type||'update',
    senderUid:senderUid||null,
    senderUsername:senderUsername||'Staff',
    senderPfp:senderPfp||null,
    senderRole:senderRole||'staff',
    ts:firebase.firestore.FieldValue.serverTimestamp()
  });
  // Also send as notification to every user
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){
      var ref=db.collection('users').doc(doc.id).collection('notifications').doc();
      batch.set(ref,{
        message:'📢 '+senderUsername+': '+message,
        type:type||'update',read:false,
        ts:firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    batch.commit();
  });
}

// ── ROLE HELPERS ──
function getUserRole(user){
  if(!user)return'user';
  if(user.role==='owner'||user.isOwner)return'owner';
  if(user.role==='developer'||user.isDeveloper)return'developer';
  if(user.role==='admin'||user.isAdmin)return'admin';
  if(user.role==='mod'||user.isMod)return'mod';
  if(user.role==='helper'||user.isHelper)return'helper';
  return'user';
}
function getRoleBadgeHtml(role){
  var b={
    owner:'<span style="font-size:.58rem;background:#FFD700;color:#000;padding:2px 8px;border-radius:4px;font-weight:900;">👑 OWNER</span>',
    developer:'<span style="font-size:.58rem;background:#e040fb;color:#fff;padding:2px 8px;border-radius:4px;font-weight:900;">⚙️ DEV</span>',
    admin:'<span style="font-size:.58rem;background:#00d4ff;color:#000;padding:2px 8px;border-radius:4px;font-weight:900;">🛡️ ADMIN</span>',
    mod:'<span style="font-size:.58rem;background:#8e24aa;color:#fff;padding:2px 8px;border-radius:4px;font-weight:900;">🔨 MOD</span>',
    helper:'<span style="font-size:.58rem;background:#43a047;color:#fff;padding:2px 8px;border-radius:4px;font-weight:900;">🤝 HELPER</span>'
  };
  return b[role]||'';
}

// ── LOGIN MODAL ──
function showLoginModal(){
  var m=document.getElementById('loginModal');if(m)m.classList.remove('hidden');
  var uv=document.getElementById('userView');if(uv)uv.style.display='none';
  var gv=document.getElementById('guestView');if(gv)gv.style.display='none';
}

function doLogin(){
  var name=(document.getElementById('regName').value||'').trim();
  var email=(document.getElementById('regEmail').value||'').trim();
  var username=(document.getElementById('regUsername').value||'').trim();
  var secret=(document.getElementById('regSecret').value||'').trim();
  var err=document.getElementById('loginError');
  err.style.color='#ff4757';

  if(!name){err.textContent='Please enter your name!';return;}
  if(!email||!email.includes('@')){err.textContent='Please enter a valid email!';return;}
  if(!username||username.length<2){err.textContent='Username must be at least 2 chars!';return;}
  if(!/^[a-zA-Z0-9_]+$/.test(username)){err.textContent='Letters, numbers and _ only!';return;}

  if(secret===OWNER_CODE_STEP1){
    _ownerStep1Passed=true;
    err.style.color='#2ed573';
    err.textContent='✅ Step 1 verified! Enter the second code and sign in again.';
    document.getElementById('regSecret').value='';
    return;
  }

  err.textContent='Signing in...';
  var role='user',isOwner=false,isDeveloper=false,isAdmin=false,isMod=false,isHelper=false;

  if(_ownerStep1Passed&&secret===OWNER_CODE_STEP2){
    role='owner';isOwner=true;_ownerStep1Passed=false;
  } else if(secret===DEV_CODE){
    role='developer';isDeveloper=true;
  } else if(secret===ADMIN_CODE){
    role='admin';isAdmin=true;
  } else if(secret===MOD_CODE){
    role='mod';isMod=true;
  } else if(secret===HELPER_CODE){
    role='helper';isHelper=true;
  } else if(secret&&secret!==''){
    err.textContent='Invalid staff code!';_ownerStep1Passed=false;return;
  }

  db.collection('users').where('usernameLower','==',username.toLowerCase()).get().then(function(snap){
    if(!snap.empty){
      var ed=snap.docs[0].data();
      if(ed.email&&ed.email.toLowerCase()!==email.toLowerCase()){err.textContent='Username taken!';return;}
      if(role!=='user'){
        db.collection('users').doc(snap.docs[0].id).update({
          role:role,isOwner:isOwner,isDeveloper:isDeveloper,isAdmin:isAdmin,isMod:isMod,isHelper:isHelper
        });
      }
      auth.signInWithEmailAndPassword(email,username+'_dvs_2025_'+email.split('@')[0]).catch(function(){
        signUpFirebase(name,email,username,role,isOwner,isDeveloper,isAdmin,isMod,isHelper);
      });
    } else {
      signUpFirebase(name,email,username,role,isOwner,isDeveloper,isAdmin,isMod,isHelper);
    }
  }).catch(function(e){err.textContent='Error: '+e.message;});
}

function signUpFirebase(name,email,username,role,isOwner,isDeveloper,isAdmin,isMod,isHelper){
  var err=document.getElementById('loginError');
  var pw=username+'_dvs_2025_'+email.split('@')[0];
  auth.createUserWithEmailAndPassword(email,pw).then(function(cred){
    return db.collection('users').doc(cred.user.uid).set({
      uid:cred.user.uid,username:username,usernameLower:username.toLowerCase(),
      name:name,email:email,since:new Date().toLocaleDateString(),
      gamesPlayed:0,history:[],friends:[],friendRequests:[],
      pfp:null,role:role,isOwner:isOwner,isDeveloper:isDeveloper,
      isAdmin:isAdmin,isMod:isMod,isHelper:isHelper,
      banned:false,tempBannedUntil:null,
      lastSeen:firebase.firestore.FieldValue.serverTimestamp(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
  }).then(function(){
    document.getElementById('loginModal').classList.add('hidden');
  }).catch(function(e){
    if(e.code==='auth/email-already-in-use'){
      auth.signInWithEmailAndPassword(email,username+'_dvs_2025_'+email.split('@')[0])
        .catch(function(e2){err.textContent='Error: '+e2.message;});
    } else {err.textContent='Error: '+e.message;}
  });
}

function doGuest(){document.getElementById('loginModal').classList.add('hidden');bootGuest();}

function doLogout(){
  if(unsubNotifs)unsubNotifs();
  auth.signOut().then(function(){
    currentUser=null;
    ['userView','guestView'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
    ['friendsNavBtn','profileNavBtn','creditsNavBtn','reportsNavBtn','roleNavBtn','notifBtn','updatesBtn','navLogoutBtn'].forEach(function(id){
      var el=document.getElementById(id);if(el)el.style.display='none';
    });
    var nm=document.getElementById('navMid');if(nm)nm.style.display='none';
    document.getElementById('navAvatar').innerHTML='G';
    document.getElementById('navUsername').textContent='Guest';
    var bg=document.getElementById('bgWrap');if(bg)bg.style.opacity='0';
    document.getElementById('loginModal').classList.remove('hidden');
  });
}

// ── BOOT ──
function bootSignedIn(user){
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('guestView').style.display='none';
  document.getElementById('userView').style.display='block';
  ['friendsNavBtn','profileNavBtn','creditsNavBtn','reportsNavBtn'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.style.display='flex';
  });
  document.getElementById('navLogoutBtn').style.display='block';
  document.getElementById('navMid').style.display='flex';
  document.getElementById('notifBtn').style.display='flex';
  document.getElementById('updatesBtn').style.display='flex';

  var role=getUserRole(user);
  if(role!=='user'){
    var btn=document.getElementById('roleNavBtn');
    if(btn){
      var icons={
        owner:'https://media.tenor.com/-7Au2y_VF78AAAAM/ksi-floating.gif',
        developer:'https://cdn-icons-png.flaticon.com/512/2721/2721287.png',
        admin:'https://i.makeagif.com/media/10-31-2024/fuCNo9.gif',
        mod:'https://i.pinimg.com/736x/59/fc/47/59fc473526de920eb1424428e0433799.jpg',
        helper:'https://cdn-icons-png.flaticon.com/512/1698/1698535.png'
      };
      var borders={owner:'#FFD700',developer:'#e040fb',admin:'#00d4ff',mod:'#8e24aa',helper:'#43a047'};
      btn.style.display='flex';btn.style.alignItems='center';
      var img=btn.querySelector('img');
      if(img){
        img.src=icons[role]||icons.admin;
        img.style.border='2px solid '+(borders[role]||'#FFD700');
        img.style.borderRadius='50%';
        img.style.width='30px';img.style.height='30px';img.style.objectFit='cover';
      }
      btn.onclick=function(){showRolePanel(role);};
    }
  }

  renderNav(user);
  renderUserPage(user);
  showSpaceBg();
  startMusic();
  listenAnnouncements();
}

function bootGuest(){
  document.getElementById('guestView').style.display='block';
  document.getElementById('userView').style.display='none';
  ['friendsNavBtn','profileNavBtn','creditsNavBtn','reportsNavBtn','roleNavBtn','notifBtn','updatesBtn'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.style.display='none';
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
  var hn=document.getElementById('heroName');if(hn)hn.textContent=user.name||user.username||'Player';
}

// ════════════════════════════════════════════════
// 📢 ANNOUNCEMENTS FEED (live)
// ════════════════════════════════════════════════
function listenAnnouncements(){
  db.collection('announcements').orderBy('ts','desc').limit(20)
    .onSnapshot(function(snap){
      var feed=document.getElementById('announcementsFeed');
      if(!feed)return;
      if(snap.empty){
        feed.innerHTML='<div style="color:var(--muted);font-size:.82rem;padding:12px 0;text-align:center;">No announcements yet.</div>';
        return;
      }
      feed.innerHTML='';
      snap.forEach(function(doc){
        var a=doc.data();
        feed.appendChild(makeAnnouncementCard(a));
      });
    });
}

function makeAnnouncementCard(a){
  var roleColors={owner:'#FFD700',developer:'#e040fb',admin:'#00d4ff',mod:'#8e24aa',helper:'#43a047'};
  var roleLabels={owner:'👑 Owner',developer:'⚙️ Developer',admin:'🛡️ Admin',mod:'🔨 Mod',helper:'🤝 Helper'};
  var color=roleColors[a.senderRole]||'#00d4ff';
  var label=roleLabels[a.senderRole]||'Staff';

  var div=document.createElement('div');
  div.style.cssText='background:#1a1a24;border:1.5px solid '+color+';border-radius:12px;padding:13px 14px;margin-bottom:10px;';
  div.innerHTML=
    '<div style="display:flex;align-items:center;gap:9px;margin-bottom:8px;">'+
      '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid '+color+';flex-shrink:0;background:'+color+';display:flex;align-items:center;justify-content:center;font-weight:900;color:#000;">'+
        (a.senderPfp?'<img src="'+a.senderPfp+'" style="width:100%;height:100%;object-fit:cover;">':(a.senderUsername||'S')[0].toUpperCase())+
      '</div>'+
      '<div>'+
        '<div style="font-weight:900;font-size:.88rem;">@'+a.senderUsername+' <span style="font-size:.62rem;background:'+color+';color:'+(a.senderRole==='owner'||a.senderRole==='developer'?'#000':'#000')+';padding:2px 7px;border-radius:4px;font-weight:900;">'+label+'</span></div>'+
        '<div style="font-size:.68rem;color:var(--muted);">'+timeAgo(a.ts)+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="font-size:.86rem;color:#e8e8f0;line-height:1.5;">'+escHtml(a.message)+'</div>';
  return div;
}

// ── UPDATES / CHANGELOG PANEL ──
function showUpdatesPanel(){
  var ex=document.getElementById('updatesPanel');if(ex){ex.remove();return;}
  var panel=document.createElement('div');
  panel.id='updatesPanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:600px;margin:0 auto;padding:16px 14px 80px;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:16px;">'+
      '<h2 style="color:#FFD700;font-size:1.2rem;font-weight:900;">📋 Update Log</h2>'+
      '<button onclick="document.getElementById(\'updatesPanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>'+
    '</div>'+

    // Pinned changelog entries
    makeChangelogEntry('v2.0 — Major Update','2025','#FFD700',[
      '👑 Owner / ⚙️ Dev / 🛡️ Admin / 🔨 Mod / 🤝 Helper roles added',
      '📋 Reports & Bug Forum tab added',
      '📢 Global Announcements with staff pfp and username',
      '📋 Update Log panel (you are here!)',
      '⏰ Temporary ban system',
      '👁️ Watch user (live monitoring)',
      '🔔 Helper ping system for Admins and Devs',
      '🌍 Real-time global game blocking via Firebase',
      '💬 Real-time friend chat',
      '🤝 Friends system with requests',
    ])+
    makeChangelogEntry('v1.5 — Firebase Update','2025','#e040fb',[
      '🌍 Switched from localStorage to Firebase global accounts',
      '📱 Cross-device login — play on phone, Chromebook, PC',
      '🔔 Real-time notifications system',
      '👤 Custom profile pictures (base64)',
      '🕹️ Continue Playing — last 12 games saved to cloud',
    ])+
    makeChangelogEntry('v1.0 — Launch','2025','#00d4ff',[
      '🎮 27 unblocked games verified and working',
      '🔥 Hot games section',
      '🔍 Game search',
      '🔲 about:blank trick for school filters',
      '⛶ Fullscreen and in-page play modes',
      '🌙 Dark theme with space background',
      '🎵 Background music player',
    ])+

    // Live announcements feed
    '<div style="font-weight:900;font-size:.95rem;margin:20px 0 10px;color:#FFD700;">📢 Staff Announcements</div>'+
    '<div id="announcementsFeed"><div style="color:#7878a0;font-size:.82rem;padding:12px 0;">Loading announcements...</div></div>'+
    '</div>';

  document.body.appendChild(panel);
  listenAnnouncements();
}

function makeChangelogEntry(title,date,color,items){
  return '<div style="background:#1a1a24;border:1.5px solid '+color+';border-radius:13px;padding:15px;margin-bottom:13px;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
      '<div style="font-weight:900;font-size:.95rem;color:'+color+';">'+title+'</div>'+
      '<div style="font-size:.72rem;color:#7878a0;">'+date+'</div>'+
    '</div>'+
    items.map(function(item){
      return '<div style="font-size:.82rem;color:#ccc;padding:4px 0;border-bottom:1px solid #1e1e2e;display:flex;gap:7px;align-items:flex-start;">'+
        '<span style="color:'+color+';flex-shrink:0;">•</span>'+item+'</div>';
    }).join('')+
  '</div>';
}

// ════════════════════════════════════════════════
// PANEL ROUTER
// ════════════════════════════════════════════════
function showRolePanel(role){
  var r=role||getUserRole(currentUser);
  if(r==='owner')showOwnerPanel();
  else if(r==='developer')showDevPanel();
  else if(r==='admin')showAdminPanel();
  else if(r==='mod')showModPanel();
  else if(r==='helper')showHelperPanel();
}

function iS(){return'width:100%;padding:9px 12px;background:#0f0f13;border:1.5px solid #2e2e3e;border-radius:9px;color:#e8e8f0;font-size:.86rem;font-family:Nunito,sans-serif;outline:none;box-sizing:border-box;';}
function bS(bg,fg){return'background:'+bg+';color:'+fg+';border:none;padding:6px 11px;border-radius:8px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.76rem;';}
function sCard(content){return'<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:12px;padding:14px;margin-bottom:14px;">'+content+'</div>';}
function sTitle(text,color){return'<div style="font-weight:900;font-size:.88rem;margin-bottom:10px;color:'+(color||'#e8e8f0')+';">'+text+'</div>';}
function pHeader(title,color,icon){
  return'<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:16px;">'+
    '<div style="display:flex;align-items:center;gap:10px;">'+
      '<img src="'+icon+'" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid '+color+';">'+
      '<h2 style="color:'+color+';font-size:1.2rem;font-weight:900;">'+title+'</h2>'+
    '</div>'+
    '<button onclick="document.getElementById(\'rolePanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>'+
  '</div>';
}
function panelWrap(content){
  var p=document.createElement('div');
  p.id='rolePanel';
  p.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  p.innerHTML='<div style="max-width:700px;margin:0 auto;padding:16px 14px 80px;">'+content+'</div>';
  return p;
}

// ════════════════════════════════════════════════
// 👑 OWNER PANEL
// ════════════════════════════════════════════════
function showOwnerPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=
    pHeader('👑 Owner Panel','#FFD700','https://media.tenor.com/-7Au2y_VF78AAAAM/ksi-floating.gif')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    sCard(sTitle('📢 Global Announcement','#FFD700')+
      '<input id="apAnnounce" placeholder="Message to ALL users..." style="'+iS()+'">'+
      '<button onclick="apSendAnnouncement()" style="'+bS('#FFD700','#000')+'margin-top:8px;width:100%;padding:9px;">📢 Send Global Announcement</button>'
    )+
    sCard(sTitle('💬 Message Specific User','#FFD700')+
      '<input id="ownerMsgU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<input id="ownerMsgT" placeholder="Message..." style="'+iS()+'">'+
      '<button onclick="ownerSendMessage()" style="'+bS('#00d4ff','#000')+'margin-top:8px;width:100%;padding:9px;">💬 Send Message</button>'
    )+
    sCard(sTitle('🎖️ Promote / Demote','#FFD700')+
      '<input id="ownerRoleU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
        '<button onclick="ownerSetRoleByUsername(\'developer\')" style="'+bS('#e040fb','#fff')+'flex:1;padding:8px;">Make Dev</button>'+
        '<button onclick="ownerSetRoleByUsername(\'admin\')" style="'+bS('#00d4ff','#000')+'flex:1;padding:8px;">Make Admin</button>'+
        '<button onclick="ownerSetRoleByUsername(\'mod\')" style="'+bS('#8e24aa','#fff')+'flex:1;padding:8px;">Make Mod</button>'+
        '<button onclick="ownerSetRoleByUsername(\'helper\')" style="'+bS('#43a047','#fff')+'flex:1;padding:8px;">Make Helper</button>'+
        '<button onclick="ownerSetRoleByUsername(\'user\')" style="'+bS('#555','#fff')+'flex:1;padding:8px;">Remove Role</button>'+
      '</div>'
    )+
    sCard(sTitle('⏰ Temporary Ban','#FFD700')+
      '<input id="tempBanU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<select id="tempBanDur" style="'+iS()+'margin-bottom:7px;">'+
        '<option value="1">1 Hour</option><option value="6">6 Hours</option>'+
        '<option value="24">24 Hours</option><option value="72">3 Days</option><option value="168">1 Week</option>'+
      '</select>'+
      '<button onclick="ownerTempBan()" style="'+bS('#ff6b35','#fff')+'width:100%;padding:9px;">⏰ Apply Temp Ban</button>'
    )+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>'+
    '<div style="background:#1a0000;border:2px solid #ff4757;border-radius:12px;padding:16px;margin-top:18px;">'+
      '<div style="font-weight:900;font-size:.9rem;color:#ff4757;margin-bottom:12px;">☢️ Danger Zone</div>'+
      '<button onclick="ownerBanAll()" style="'+bS('#ff4757','#fff')+'width:100%;padding:10px;margin-bottom:8px;">🚫 Ban ALL Non-Staff Users</button>'+
      '<button onclick="ownerUnbanAll()" style="'+bS('#2ed573','#000')+'width:100%;padding:10px;">✅ Unban ALL Users</button>'+
    '</div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('owner');
}

// ════════════════════════════════════════════════
// ⚙️ DEVELOPER PANEL
// ════════════════════════════════════════════════
function showDevPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=
    pHeader('⚙️ Developer Panel','#e040fb','https://cdn-icons-png.flaticon.com/512/2721/2721287.png')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    sCard(sTitle('📢 Global Announcement','#e040fb')+
      '<input id="apAnnounce" placeholder="Message to ALL users..." style="'+iS()+'">'+
      '<button onclick="apSendAnnouncement()" style="'+bS('#e040fb','#fff')+'margin-top:8px;width:100%;padding:9px;">📢 Send Global Announcement</button>'
    )+
    sCard(sTitle('💬 Message Specific User','#e040fb')+
      '<input id="ownerMsgU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<input id="ownerMsgT" placeholder="Message..." style="'+iS()+'">'+
      '<button onclick="ownerSendMessage()" style="'+bS('#00d4ff','#000')+'margin-top:8px;width:100%;padding:9px;">💬 Send Message</button>'
    )+
    sCard(sTitle('🎖️ Manage Roles (Mod & Below)','#e040fb')+
      '<input id="ownerRoleU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
        '<button onclick="ownerSetRoleByUsername(\'mod\')" style="'+bS('#8e24aa','#fff')+'flex:1;padding:8px;">Make Mod</button>'+
        '<button onclick="ownerSetRoleByUsername(\'helper\')" style="'+bS('#43a047','#fff')+'flex:1;padding:8px;">Make Helper</button>'+
        '<button onclick="ownerSetRoleByUsername(\'user\')" style="'+bS('#555','#fff')+'flex:1;padding:8px;">Remove Role</button>'+
      '</div>'
    )+
    sCard(sTitle('⏰ Temporary Ban (No Perm Ban)','#e040fb')+
      '<input id="tempBanU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<select id="tempBanDur" style="'+iS()+'margin-bottom:7px;">'+
        '<option value="1">1 Hour</option><option value="6">6 Hours</option>'+
        '<option value="24">24 Hours</option><option value="72">3 Days</option><option value="168">1 Week</option>'+
      '</select>'+
      '<button onclick="ownerTempBan()" style="'+bS('#ff6b35','#fff')+'width:100%;padding:9px;">⏰ Apply Temp Ban</button>'
    )+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('developer');
}

// ════════════════════════════════════════════════
// 🛡️ ADMIN PANEL
// ════════════════════════════════════════════════
function showAdminPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=
    pHeader('🛡️ Admin Panel','#00d4ff','https://i.makeagif.com/media/10-31-2024/fuCNo9.gif')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    sCard('<div style="font-size:.82rem;color:#7878a0;">ℹ️ Admins can ban/kick regular users, watch, view, kick off site, manage games. Cannot affect Mods, Devs, or Owners.</div>')+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('admin');
}

// ════════════════════════════════════════════════
// 🔨 MOD PANEL
// ════════════════════════════════════════════════
function showModPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=
    pHeader('🔨 Mod Panel','#8e24aa','https://i.pinimg.com/736x/59/fc/47/59fc473526de920eb1424428e0433799.jpg')+
    sCard('<div style="font-size:.82rem;color:#7878a0;">ℹ️ Mods can kick from game, kick off site, view users. Contact Admin or Dev for bans.</div>')+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('mod');
}

// ════════════════════════════════════════════════
// 🤝 HELPER PANEL
// ════════════════════════════════════════════════
function showHelperPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=
    pHeader('🤝 Helper Panel','#43a047','https://cdn-icons-png.flaticon.com/512/1698/1698535.png')+
    sCard('<div style="font-size:.82rem;color:#7878a0;">ℹ️ Helpers can ping Admins and Developers when issues arise. Report issues via the Reports tab.</div>')+
    sCard(sTitle('🔔 Ping Staff','#43a047')+
      '<input id="helperPingMsg" placeholder="Describe the issue..." style="'+iS()+'margin-bottom:7px;">'+
      '<div style="display:flex;gap:7px;flex-wrap:wrap;">'+
        '<button onclick="helperPingAdmins()" style="'+bS('#00d4ff','#000')+'flex:1;padding:9px;">📣 Ping Admins</button>'+
        '<button onclick="helperPingDevs()" style="'+bS('#e040fb','#fff')+'flex:1;padding:9px;">📣 Ping Developers</button>'+
      '</div>'
    )+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users (View Only)</div>'+
    '<input id="apSearch" type="text" placeholder="🔍 Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('helper');
}

// ── Load + render users ──
function loadPanelUsers(viewerRole){
  db.collection('users').orderBy('createdAt','desc').get().then(function(snap){
    var users=[];snap.forEach(function(doc){users.push(Object.assign({uid:doc.id},doc.data()));});
    renderPanelUsers(users,viewerRole);
    var sd=document.getElementById('apStats');
    if(sd){
      sd.innerHTML=
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-size:1.6rem;font-weight:900;color:#FFD700;">'+users.length+'</div><div style="font-size:.7rem;color:#888;font-weight:700;">Total Users</div></div>'+
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-size:1.6rem;font-weight:900;color:#ff4757;">'+users.filter(function(u){return u.banned;}).length+'</div><div style="font-size:.7rem;color:#888;font-weight:700;">Banned</div></div>'+
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;"><div style="font-size:1.6rem;font-weight:900;color:#ff6b35;">'+_blockedGames.length+'</div><div style="font-size:.7rem;color:#888;font-weight:700;">Blocked Games</div></div>';
    }
  });
}

function renderPanelUsers(users,viewerRole){
  var list=document.getElementById('apUserList');if(!list)return;
  var myUid=(currentUser||{}).uid||'';
  var myRank=ROLE_RANK[viewerRole]||0;

  list.innerHTML=users.map(function(u){
    var isBanned=u.banned===true;
    var isTempBanned=u.tempBannedUntil&&u.tempBannedUntil.toMillis&&u.tempBannedUntil.toMillis()>Date.now();
    var isSelf=u.uid===myUid;
    var uRole=getUserRole(u);
    var uRank=ROLE_RANK[uRole]||0;
    var statusColor=isBanned?'#ff4757':isTempBanned?'#ff6b35':isSelf?'#2ed573':'#00d4ff';
    var statusLabel=isBanned?'BANNED':isTempBanned?'TEMP BAN':isSelf?'YOU':'ACTIVE';
    var outranks=!isSelf&&myRank>uRank;

    var canBan=outranks&&(viewerRole==='owner'||viewerRole==='admin')&&uRole!=='mod'&&uRole!=='developer'&&uRole!=='admin';
    var canTempBan=outranks&&(viewerRole==='owner'||viewerRole==='developer');
    var canKick=outranks&&(viewerRole==='owner'||viewerRole==='developer'||viewerRole==='admin'||viewerRole==='mod');
    var canKickSite=outranks&&(viewerRole==='owner'||viewerRole==='developer'||viewerRole==='admin'||viewerRole==='mod');
    var canView=viewerRole!=='user';
    var canWatch=viewerRole==='owner'||viewerRole==='developer'||viewerRole==='admin';
    var canPromote=viewerRole==='owner'&&!isSelf;
    var devCanPromote=viewerRole==='developer'&&!isSelf&&uRank<ROLE_RANK['mod'];

    var btns='';
    if(canBan){btns+=isBanned?'<button onclick="apUnban(\''+u.uid+'\')" style="'+bS('#2ed573','#000')+'">Unban</button>':'<button onclick="apBan(\''+u.uid+'\')" style="'+bS('#ff4757','#fff')+'">Ban</button>';}
    if(canTempBan){btns+='<button onclick="quickTempBan(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#ff6b35','#fff')+'">Temp Ban</button>';}
    if(canKick){btns+='<button onclick="apKick(\''+u.uid+'\')" style="'+bS('#e65100','#fff')+'">Kick Game</button>';}
    if(canKickSite){btns+='<button onclick="apKickSite(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#c62828','#fff')+'">Kick Site</button>';}
    if(canView){btns+='<button onclick="panelViewUser(\''+u.uid+'\')" style="'+bS('#1e90ff','#fff')+'">View</button>';}
    if(canWatch){btns+='<button onclick="panelWatchUser(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#9c27b0','#fff')+'">Watch</button>';}
    if(canPromote){
      if(uRole==='user'){
        btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'helper\')" style="'+bS('#43a047','#fff')+'">Helper</button>';
        btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'mod\')" style="'+bS('#8e24aa','#fff')+'">Mod</button>';
        btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'admin\')" style="'+bS('#00d4ff','#000')+'">Admin</button>';
        btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'developer\')" style="'+bS('#e040fb','#fff')+'">Dev</button>';
      }
      if(uRole!=='user'&&uRole!=='owner'){btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'user\')" style="'+bS('#555','#fff')+'">Remove Role</button>';}
    }
    if(devCanPromote){
      if(uRole==='user'){
        btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'helper\')" style="'+bS('#43a047','#fff')+'">Helper</button>';
        btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'mod\')" style="'+bS('#8e24aa','#fff')+'">Mod</button>';
      }
      if(uRole==='helper'||uRole==='mod'){btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'user\')" style="'+bS('#555','#fff')+'">Remove Role</button>';}
    }

    return'<div class="ap-row" data-username="'+(u.usernameLower||'')+'" data-name="'+(u.name||'').toLowerCase()+'" style="display:flex;align-items:center;gap:9px;background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:9px 11px;margin-bottom:7px;flex-wrap:wrap;">'+
      '<div style="width:40px;height:40px;border-radius:50%;background:'+statusColor+';color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;overflow:hidden;">'+
        (u.pfp?'<img src="'+u.pfp+'" style="width:100%;height:100%;object-fit:cover;">':(u.username||'?')[0].toUpperCase())+
      '</div>'+
      '<div style="flex:1;min-width:0;">'+
        '<div style="font-weight:900;font-size:.88rem;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">@'+(u.username||'?')+
          ' <span style="font-size:.58rem;background:'+statusColor+';color:'+(isBanned||isTempBanned?'#fff':'#000')+';padding:1px 7px;border-radius:4px;font-weight:900;">'+statusLabel+'</span>'+
          getRoleBadgeHtml(uRole)+'</div>'+
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
// OWNER / DEV ACTIONS
// ════════════════════════════════════════════════
function ownerSendMessage(){
  var un=(document.getElementById('ownerMsgU').value||'').trim().toLowerCase();
  var msg=(document.getElementById('ownerMsgT').value||'').trim();
  if(!un||!msg){showNotifToast('Fill in both fields!','warning');return;}
  db.collection('users').where('usernameLower','==',un).get().then(function(snap){
    if(snap.empty){showNotifToast('User not found!','warning');return;}
    var role=getUserRole(currentUser);
    var prefix=role==='owner'?'👑 Owner @'+currentUser.username+': ':'⚙️ Dev @'+currentUser.username+': ';
    sendNotification(snap.docs[0].id,prefix+msg,'message');
    document.getElementById('ownerMsgU').value='';
    document.getElementById('ownerMsgT').value='';
    showNotifToast('Message sent to @'+un,'info');
  });
}

function ownerSetRoleByUsername(newRole){
  var un=(document.getElementById('ownerRoleU').value||'').trim().toLowerCase();
  if(!un){showNotifToast('Enter a username!','warning');return;}
  db.collection('users').where('usernameLower','==',un).get().then(function(snap){
    if(snap.empty){showNotifToast('User not found!','warning');return;}
    ownerSetRoleUid(snap.docs[0].id,newRole);
    document.getElementById('ownerRoleU').value='';
  });
}

function ownerSetRoleUid(uid,newRole){
  db.collection('users').doc(uid).update({
    role:newRole,isOwner:newRole==='owner',isDeveloper:newRole==='developer',
    isAdmin:newRole==='admin',isMod:newRole==='mod',isHelper:newRole==='helper'
  }).then(function(){
    var msgs={developer:'⚙️ You have been promoted to Developer!',admin:'🛡️ You have been promoted to Admin!',mod:'🔨 You have been promoted to Mod!',helper:'🤝 You have been made a Helper!',user:'📋 Your staff role has been removed.'};
    sendNotification(uid,msgs[newRole]||'Your role was updated.','info');
    var p=document.getElementById('rolePanel');if(p)p.remove();
    showRolePanel();
  });
}

function ownerTempBan(){
  var un=(document.getElementById('tempBanU').value||'').trim().toLowerCase();
  var hrs=parseInt(document.getElementById('tempBanDur').value||'1');
  if(!un){showNotifToast('Enter a username!','warning');return;}
  db.collection('users').where('usernameLower','==',un).get().then(function(snap){
    if(snap.empty){showNotifToast('User not found!','warning');return;}
    var uid=snap.docs[0].id;
    var until=new Date(Date.now()+hrs*3600*1000);
    db.collection('users').doc(uid).update({
      tempBannedUntil:firebase.firestore.Timestamp.fromDate(until),
      kicked:firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(){
      sendNotification(uid,'⏰ You have been temporarily banned for '+hrs+' hour(s).','warning');
      document.getElementById('tempBanU').value='';
      showNotifToast('Temp ban applied!','info');
      var p=document.getElementById('rolePanel');if(p)p.remove();
      showRolePanel();
    });
  });
}

function quickTempBan(uid,username){
  var hrs=prompt('Temp ban @'+username+' for how many hours?');
  if(!hrs||isNaN(hrs))return;
  var until=new Date(Date.now()+parseInt(hrs)*3600*1000);
  db.collection('users').doc(uid).update({
    tempBannedUntil:firebase.firestore.Timestamp.fromDate(until),
    kicked:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    sendNotification(uid,'⏰ Temporarily banned for '+hrs+' hour(s).','warning');
    showNotifToast('Temp ban applied!','info');
    var p=document.getElementById('rolePanel');if(p)p.remove();
    showRolePanel();
  });
}

function ownerBanAll(){
  if(!confirm('Ban ALL non-staff users?'))return;
  if(!confirm('FINAL WARNING. Continue?'))return;
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){if(getUserRole(doc.data())==='user')batch.update(doc.ref,{banned:true});});
    batch.commit().then(function(){
      sendGlobalNotification('⚠️ A mass moderation action was taken.','warning',currentUser.uid,currentUser.username,currentUser.pfp||null,getUserRole(currentUser));
      var p=document.getElementById('rolePanel');if(p)p.remove();showOwnerPanel();
    });
  });
}
function ownerUnbanAll(){
  if(!confirm('Unban ALL users?'))return;
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){batch.update(doc.ref,{banned:false,tempBannedUntil:null});});
    batch.commit().then(function(){var p=document.getElementById('rolePanel');if(p)p.remove();showOwnerPanel();});
  });
}

// ════════════════════════════════════════════════
// HELPER ACTIONS
// ════════════════════════════════════════════════
function helperPingAdmins(){
  var msg=(document.getElementById('helperPingMsg').value||'').trim();
  if(!msg){showNotifToast('Describe the issue first!','warning');return;}
  db.collection('users').where('role','in',['admin','developer','owner']).get().then(function(snap){
    snap.forEach(function(doc){sendNotification(doc.id,'🤝 Helper @'+currentUser.username+' needs attention: '+msg,'warning');});
    document.getElementById('helperPingMsg').value='';
    showNotifToast('Admins have been pinged!','info');
  });
}
function helperPingDevs(){
  var msg=(document.getElementById('helperPingMsg').value||'').trim();
  if(!msg){showNotifToast('Describe the issue first!','warning');return;}
  db.collection('users').where('role','in',['developer','owner']).get().then(function(snap){
    snap.forEach(function(doc){sendNotification(doc.id,'🤝 Helper @'+currentUser.username+' flagged a dev issue: '+msg,'warning');});
    document.getElementById('helperPingMsg').value='';
    showNotifToast('Developers pinged!','info');
  });
}

// ════════════════════════════════════════════════
// SHARED STAFF ACTIONS
// ════════════════════════════════════════════════
function apBan(uid){
  db.collection('users').doc(uid).update({banned:true}).then(function(){
    sendNotification(uid,'🚫 You have been banned from Dv\'s Unblocked Games.','warning');
    var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
  });
}
function apUnban(uid){
  db.collection('users').doc(uid).update({banned:false,tempBannedUntil:null}).then(function(){
    sendNotification(uid,'✅ Your ban has been lifted. Welcome back!','info');
    var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
  });
}
function apKick(uid){
  db.collection('users').doc(uid).update({kicked:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){
    sendNotification(uid,'👟 You were kicked from your current game by a staff member.','warning');
  });
}
function apKickSite(uid,username){
  if(!confirm('Kick @'+username+' off the site?'))return;
  db.collection('users').doc(uid).update({kickedFromSite:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){
    sendNotification(uid,'🚪 You have been kicked off the site.','warning');
    showNotifToast('@'+username+' kicked off site!','info');
  });
}
function panelViewUser(uid){
  db.collection('users').doc(uid).get().then(function(doc){
    if(!doc.exists)return;
    var u=doc.data();
    var tempInfo='';
    if(u.tempBannedUntil&&u.tempBannedUntil.toMillis){var rem=Math.max(0,Math.ceil((u.tempBannedUntil.toMillis()-Date.now())/3600000));tempInfo='\nTemp Ban: '+rem+'h remaining';}
    alert('👤 @'+u.username+'\n━━━━━━━━━━━━━\nName: '+u.name+'\nEmail: '+u.email+'\nRole: '+getUserRole(u).toUpperCase()+'\nStatus: '+(u.banned?'BANNED':'Active')+tempInfo+'\nGames: '+(u.gamesPlayed||0)+'\nFriends: '+(u.friends||[]).length+'\nJoined: '+(u.since||'?')+'\nLast Seen: '+timeAgo(u.lastSeen));
  });
}
function panelWatchUser(uid,username){
  var ex=document.getElementById('watchPanel');if(ex)ex.remove();
  var wp=document.createElement('div');
  wp.id='watchPanel';
  wp.style.cssText='position:fixed;bottom:70px;right:16px;z-index:4000;background:#1a1a24;border:2px solid #9c27b0;border-radius:14px;padding:14px 16px;min-width:240px;font-family:Nunito,sans-serif;color:#e8e8f0;box-shadow:0 4px 24px rgba(0,0,0,.7);';
  wp.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><div style="font-weight:900;font-size:.88rem;color:#9c27b0;">👁️ Watching @'+username+'</div><button onclick="document.getElementById(\'watchPanel\').remove()" style="background:none;border:none;color:#aaa;cursor:pointer;">✕</button></div><div id="watchContent" style="font-size:.8rem;color:#aaa;">Loading...</div>';
  document.body.appendChild(wp);
  var unsub=db.collection('users').doc(uid).onSnapshot(function(doc){
    var wc=document.getElementById('watchContent');if(!wc||!doc.exists){if(unsub)unsub();return;}
    var u=doc.data();
    wc.innerHTML='<div>Status: <b style="color:'+(u.banned?'#ff4757':'#2ed573')+'">'+(u.banned?'BANNED':'Active')+'</b></div>'+
      '<div>Games: <b>'+(u.gamesPlayed||0)+'</b></div><div>Friends: <b>'+(u.friends||[]).length+'</b></div>'+
      '<div>Last seen: <b>'+timeAgo(u.lastSeen)+'</b></div>';
  });
}

function apSendAnnouncement(){
  var msg=(document.getElementById('apAnnounce').value||'').trim();
  if(!msg){showNotifToast('Type a message first!','warning');return;}
  var role=getUserRole(currentUser);
  sendGlobalNotification(
    msg,'update',
    currentUser.uid,
    currentUser.username,
    currentUser.pfp||null,
    role
  );
  document.getElementById('apAnnounce').value='';
  showNotifToast('📢 Announcement sent with your profile!','info');
}

function renderAdminGameRows(){
  return GAMES.map(function(g){
    var isBlocked=_blockedGames.includes(g.id);
    return'<div style="display:flex;align-items:center;gap:10px;background:#13131c;border:1px solid #2e2e3e;border-radius:9px;padding:8px 12px;margin-bottom:7px;">'+
      '<img src="'+g.thumb+'" style="width:38px;height:38px;border-radius:7px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">'+
      '<div style="flex:1;font-weight:900;font-size:.88rem;">'+g.name+'</div>'+
      (isBlocked
        ?'<span style="color:#ff4757;font-size:.72rem;margin-right:5px;">🚫 BLOCKED</span><button onclick="apUnblockGame(\''+g.id+'\')" style="'+bS('#2ed573','#000')+'">Unblock</button>'
        :'<button onclick="apBlockGame(\''+g.id+'\')" style="'+bS('#ff6b35','#fff')+'">Block</button>')+
    '</div>';
  }).join('');
}
function apBlockGame(id){
  var b=_blockedGames.slice();if(!b.includes(id))b.push(id);
  saveBlockedGames(b);
  sendGlobalNotification('🚫 A game has been blocked by staff.','warning',currentUser.uid,currentUser.username,currentUser.pfp||null,getUserRole(currentUser));
}
function apUnblockGame(id){
  saveBlockedGames(_blockedGames.filter(function(b){return b!==id;}));
  sendGlobalNotification('✅ A game has been unblocked!','info',currentUser.uid,currentUser.username,currentUser.pfp||null,getUserRole(currentUser));
}

// ── UTILS ──
function timeAgo(ts){
  if(!ts)return'Never';
  var d=(Date.now()-(ts.toMillis?ts.toMillis():ts))/1000;
  if(d<60)return'Just now';if(d<3600)return Math.floor(d/60)+'m ago';
  if(d<86400)return Math.floor(d/3600)+'h ago';return Math.floor(d/86400)+'d ago';
}
function escHtml(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── KICK / BAN LISTENER ──
function listenForKick(uid){
  db.collection('users').doc(uid).onSnapshot(function(doc){
    if(!doc.exists)return;
    var d=doc.data();
    if(d.banned){auth.signOut();alert('🚫 You have been banned.');location.reload();return;}
    if(d.tempBannedUntil&&d.tempBannedUntil.toMillis&&d.tempBannedUntil.toMillis()>Date.now()){
      auth.signOut();
      var rem=Math.ceil((d.tempBannedUntil.toMillis()-Date.now())/3600000);
      alert('⏰ You are temporarily banned for '+rem+' more hour(s).');
      location.reload();return;
    }
    if(d.kickedFromSite&&d.kickedFromSite.toMillis&&Date.now()-d.kickedFromSite.toMillis()<15000){
      auth.signOut();alert('🚪 You have been kicked off the site.');location.reload();return;
    }
    if(d.kicked&&d.kicked.toMillis&&Date.now()-d.kicked.toMillis()<10000){
      alert('👟 You were kicked from your current game.');closeInPage();
    }
  });
}

// ── POPUP & GAME ──
function openPopup(game){
  if(_blockedGames.includes(game.id)){alert('🚫 This game is blocked by staff.');return;}
  currentGame=game;
  var thumb=document.getElementById('popupThumb');
  thumb.src=game.thumb;thumb.style.display='block';
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
  history.unshift(h);if(history.length>12)history=history.slice(0,12);
  currentUser.history=history;currentUser.gamesPlayed=(currentUser.gamesPlayed||0)+1;
  db.collection('users').doc(currentUser.uid).update({
    history:history,gamesPlayed:firebase.firestore.FieldValue.increment(1),
    lastSeen:firebase.firestore.FieldValue.serverTimestamp()
  });
  var row=document.getElementById('continueRow');var sec=document.getElementById('continueSection');
  if(row&&sec){sec.style.display='block';row.innerHTML='';
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
  var cont=document.getElementById('continueSection');var row=document.getElementById('continueRow');
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
  var grid=document.getElementById('guestGrid');if(!grid)return;
  grid.innerHTML='';GAMES.forEach(function(g){grid.appendChild(makeGuestCard(g));});
}
function filterGames(){
  var q=(document.getElementById('searchInput').value||'').toLowerCase().trim();
  var none=true;
  document.querySelectorAll('#allGrid .game-card').forEach(function(c){
    var show=!q||(c.getAttribute('data-name')||'').includes(q);
    c.style.display=show?'':'none';if(show)none=false;
  });
  var nr=document.getElementById('noResults');
  if(nr)nr.style.display=(q&&none)?'block':'none';
    }
