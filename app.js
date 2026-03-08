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
var ANNOUNCEMENT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── PERSISTENCE (auto-login) ──
function saveSession(uid){try{localStorage.setItem('dvs_uid',uid);localStorage.setItem('dvs_ts',Date.now());}catch(e){}}
function loadSession(){try{var uid=localStorage.getItem('dvs_uid');var ts=parseInt(localStorage.getItem('dvs_ts')||'0');if(uid&&Date.now()-ts<48*3600*1000)return uid;}catch(e){}return null;}
function clearSession(){try{localStorage.removeItem('dvs_uid');localStorage.removeItem('dvs_ts');}catch(e){}}

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
function showSpaceBg(){
  var bg=document.getElementById('bgWrap');
  if(bg){bg.style.opacity='0.18';}
}

// ── AUTH ──
auth.onAuthStateChanged(function(firebaseUser){
  if(firebaseUser){
    saveSession(firebaseUser.uid);
    db.collection('users').doc(firebaseUser.uid).get().then(function(doc){
      if(doc.exists){
        currentUser=doc.data();currentUser.uid=firebaseUser.uid;
        bootSignedIn(currentUser);
        listenForNotifications(firebaseUser.uid);
        listenForKick(firebaseUser.uid);
        setInterval(function(){updateLastSeen(firebaseUser.uid);},60000);
      } else {auth.signOut();clearSession();showLoginModal();}
    });
  } else {
    // Try auto-login from saved session
    var savedUid=loadSession();
    if(savedUid){
      db.collection('users').doc(savedUid).get().then(function(doc){
        if(doc.exists){
          // Re-authenticate silently — Firebase already persists auth state,
          // this is just a fallback UX indicator
          currentUser=doc.data();currentUser.uid=savedUid;
          bootSignedIn(currentUser);
          listenForNotifications(savedUid);
          listenForKick(savedUid);
          setInterval(function(){updateLastSeen(savedUid);},60000);
        } else {clearSession();showLoginModal();}
      });
    } else {
      currentUser=null;showLoginModal();
    }
  }
  startMusic();
  listenBlockedGames();
});

function updateLastSeen(uid){
  db.collection('users').doc(uid).update({
    lastSeen:firebase.firestore.FieldValue.serverTimestamp()
  });
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
  t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a24;border:2px solid '+color+';color:#e8e8f0;padding:12px 20px;border-radius:12px;font-family:Nunito,sans-serif;font-weight:700;font-size:.88rem;z-index:9999;max-width:320px;width:90%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.5);transition:opacity .5s;';
  t.textContent=message;document.body.appendChild(t);
  setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.remove();},500);},4000);
}
function sendNotification(toUid,message,type){
  db.collection('users').doc(toUid).collection('notifications').add({
    message:message,type:type||'info',read:false,ts:firebase.firestore.FieldValue.serverTimestamp()
  });
}
function sendGlobalNotification(message,type,senderUid,senderUsername,senderPfp,senderRole){
  var expiresAt=new Date(Date.now()+ANNOUNCEMENT_TTL_MS);
  db.collection('announcements').add({
    message:message,type:type||'update',
    senderUid:senderUid||null,senderUsername:senderUsername||'Staff',
    senderPfp:senderPfp||null,senderRole:senderRole||'staff',
    ts:firebase.firestore.FieldValue.serverTimestamp(),
    expiresAt:firebase.firestore.Timestamp.fromDate(expiresAt)
  });
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
  var colors={owner:'#FFD700',developer:'#e040fb',admin:'#00d4ff',mod:'#8e24aa',helper:'#43a047'};
  var labels={owner:'OWNER',developer:'DEV',admin:'ADMIN',mod:'MOD',helper:'HELPER'};
  var icons={
    owner:'<svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 3h10v2H7v-2z"/></svg>',
    developer:'<svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>',
    admin:'<svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>',
    mod:'<svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M15 13H9v2h6v-2zm2-8h-1V3h-2v2H10V3H8v2H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H7V10h10v11z"/></svg>',
    helper:'<svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>'
  };
  if(!colors[role])return'';
  return'<span style="font-size:.58rem;background:'+colors[role]+';color:'+(role==='owner'||role==='developer'||role==='admin'?'#000':'#fff')+';padding:2px 7px;border-radius:4px;font-weight:900;display:inline-flex;align-items:center;gap:3px;">'+icons[role]+labels[role]+'</span>';
}

// ── LOGIN ──
function showLoginModal(){
  var m=document.getElementById('loginModal');if(m)m.classList.remove('hidden');
  var uv=document.getElementById('userView');if(uv)uv.style.display='none';
  var gv=document.getElementById('guestView');if(gv)gv.style.display='none';
}

function validateEmail(email){
  // Strong format check — blocks obvious fakes
  var re=/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if(!re.test(email))return false;
  // Block disposable/fake patterns
  var blocked=['mailinator','guerrillamail','tempmail','throwam','sharklasers','yopmail','trashmail','fakeinbox','dispostable','maildrop'];
  var domain=email.split('@')[1].toLowerCase();
  for(var i=0;i<blocked.length;i++){if(domain.includes(blocked[i]))return false;}
  return true;
}

function doLogin(){
  var name=(document.getElementById('regName').value||'').trim();
  var email=(document.getElementById('regEmail').value||'').trim();
  var username=(document.getElementById('regUsername').value||'').trim();
  var secret=(document.getElementById('regSecret').value||'').trim();
  var err=document.getElementById('loginError');
  err.style.color='#ff4757';

  if(!name){err.textContent='Please enter your name!';return;}
  if(!validateEmail(email)){err.textContent='Please enter a valid email address!';return;}
  if(!username||username.length<2){err.textContent='Username must be at least 2 chars!';return;}
  if(!/^[a-zA-Z0-9_]+$/.test(username)){err.textContent='Letters, numbers and _ only!';return;}

  if(secret===OWNER_CODE_STEP1){
    _ownerStep1Passed=true;
    err.style.color='#2ed573';
    err.textContent='✅ Step 1 verified! Enter the second code and sign in again.';
    document.getElementById('regSecret').value='';return;
  }

  err.textContent='Signing in...';
  var role='user',isOwner=false,isDeveloper=false,isAdmin=false,isMod=false,isHelper=false;
  if(_ownerStep1Passed&&secret===OWNER_CODE_STEP2){role='owner';isOwner=true;_ownerStep1Passed=false;}
  else if(secret===DEV_CODE){role='developer';isDeveloper=true;}
  else if(secret===ADMIN_CODE){role='admin';isAdmin=true;}
  else if(secret===MOD_CODE){role='mod';isMod=true;}
  else if(secret===HELPER_CODE){role='helper';isHelper=true;}
  else if(secret&&secret!==''){err.textContent='Invalid staff code!';_ownerStep1Passed=false;return;}

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
    } else {signUpFirebase(name,email,username,role,isOwner,isDeveloper,isAdmin,isMod,isHelper);}
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
      banned:false,tempBannedUntil:null,currentGame:null,
      lastSeen:firebase.firestore.FieldValue.serverTimestamp(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
  }).then(function(){document.getElementById('loginModal').classList.add('hidden');})
  .catch(function(e){
    if(e.code==='auth/email-already-in-use'){
      auth.signInWithEmailAndPassword(email,username+'_dvs_2025_'+email.split('@')[0])
        .catch(function(e2){err.textContent='Error: '+e2.message;});
    } else {err.textContent='Error: '+e.message;}
  });
}

function doGuest(){document.getElementById('loginModal').classList.add('hidden');bootGuest();}

function doLogout(){
  if(unsubNotifs)unsubNotifs();
  clearSession();
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
      var borders={owner:'#FFD700',developer:'#e040fb',admin:'#00d4ff',mod:'#8e24aa',helper:'#43a047'};
      btn.style.display='flex';btn.style.alignItems='center';
      var svgEl=btn.querySelector('.role-svg');
      if(svgEl){svgEl.style.border='2px solid '+(borders[role]||'#FFD700');}
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
// 📢 ANNOUNCEMENTS (with 24hr auto-expire)
// ════════════════════════════════════════════════
function listenAnnouncements(){
  var cutoff=new Date(Date.now()-ANNOUNCEMENT_TTL_MS);
  db.collection('announcements')
    .where('ts','>',firebase.firestore.Timestamp.fromDate(cutoff))
    .orderBy('ts','desc').limit(20)
    .onSnapshot(function(snap){
      var feed=document.getElementById('announcementsFeed');
      if(!feed)return;
      if(snap.empty){
        feed.innerHTML='<div style="color:var(--muted,#7878a0);font-size:.82rem;padding:12px 0;text-align:center;">No announcements in the last 24 hours.</div>';
        return;
      }
      feed.innerHTML='';
      snap.forEach(function(doc){feed.appendChild(makeAnnouncementCard(doc.data()));});

      // Update banner on index
      var banner=document.getElementById('latestAnnouncementBanner');
      if(banner&&!snap.empty){
        var a=snap.docs[0].data();
        updateAnnouncementBanner(a);
      }
    });

  // Auto-purge old announcements (owner/dev only, fire-and-forget)
  db.collection('announcements').where('expiresAt','<',firebase.firestore.Timestamp.fromDate(new Date())).get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){batch.delete(doc.ref);});
    if(!snap.empty)batch.commit();
  });
}

function updateAnnouncementBanner(a){
  var banner=document.getElementById('latestAnnouncementBanner');if(!banner)return;
  var roleColors={owner:'#FFD700',developer:'#e040fb',admin:'#00d4ff',mod:'#8e24aa',helper:'#43a047'};
  var color=roleColors[a.senderRole]||'#FFD700';
  banner.style.borderColor=color;
  var label=banner.querySelector('.ann-label');if(label)label.style.color=color;
  var av=document.getElementById('latestAnnouncerAvatar');
  if(av){
    av.style.borderColor=color;av.style.background=color;
    av.innerHTML=a.senderPfp?'<img src="'+a.senderPfp+'" style="width:100%;height:100%;object-fit:cover;">':(a.senderUsername||'S')[0].toUpperCase();
  }
  var nm=document.getElementById('latestAnnouncerName');if(nm){nm.textContent='@'+a.senderUsername;nm.style.color=color;}
  var msg=document.getElementById('latestAnnouncementMsg');if(msg)msg.textContent=a.message;
  banner.style.display='block';
  var dot=document.getElementById('updatesDot');if(dot)dot.style.display='block';
}

function makeAnnouncementCard(a){
  var roleColors={owner:'#FFD700',developer:'#e040fb',admin:'#00d4ff',mod:'#8e24aa',helper:'#43a047'};
  var roleLabels={owner:'Owner',developer:'Developer',admin:'Admin',mod:'Mod',helper:'Helper'};
  var color=roleColors[a.senderRole]||'#00d4ff';
  var div=document.createElement('div');
  div.style.cssText='background:#1a1a24;border:1.5px solid '+color+';border-radius:12px;padding:13px 14px;margin-bottom:10px;';
  div.innerHTML=
    '<div style="display:flex;align-items:center;gap:9px;margin-bottom:8px;">'+
      '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2px solid '+color+';flex-shrink:0;background:'+color+';display:flex;align-items:center;justify-content:center;font-weight:900;color:#000;font-size:.8rem;">'+
        (a.senderPfp?'<img src="'+a.senderPfp+'" style="width:100%;height:100%;object-fit:cover;">':(a.senderUsername||'S')[0].toUpperCase())+
      '</div>'+
      '<div><div style="font-weight:900;font-size:.88rem;">@'+escHtml(a.senderUsername)+
        ' <span style="font-size:.62rem;background:'+color+';color:#000;padding:2px 7px;border-radius:4px;font-weight:900;">'+roleLabels[a.senderRole]+'</span></div>'+
        '<div style="font-size:.68rem;color:#7878a0;">'+timeAgo(a.ts)+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="font-size:.86rem;color:#e8e8f0;line-height:1.5;">'+escHtml(a.message)+'</div>';
  return div;
}

// ════════════════════════════════════════════════
// 📋 UPDATE LOG PANEL
// ════════════════════════════════════════════════
function showUpdatesPanel(){
  var ex=document.getElementById('updatesPanel');if(ex){ex.remove();return;}
  var panel=document.createElement('div');
  panel.id='updatesPanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:600px;margin:0 auto;padding:16px 14px 80px;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:16px;">'+
      '<div style="display:flex;align-items:center;gap:8px;">'+
        svgIcon('clipboard','#FFD700',22)+
        '<h2 style="color:#FFD700;font-size:1.2rem;font-weight:900;margin:0;">Update Log</h2>'+
      '</div>'+
      '<button onclick="document.getElementById(\'updatesPanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>'+
    '</div>'+
    makeChangelogEntry('v2.1 — Final Update','2025','#FFD700',[
      'Announcements auto-expire after 24 hours',
      'Group chats — create rooms with any users',
      'Space background fixed on all tabs',
      'All icons replaced with SVGs',
      'Auto-login — stays signed in for 48 hours',
      'View: see exactly what game a user is playing live',
      'Watch: full live panel with kick option',
      'Admins can view and moderate all chats',
      'Email validation with disposable email blocking',
    ])+
    makeChangelogEntry('v2.0 — Major Update','2025','#e040fb',[
      'Owner / Dev / Admin / Mod / Helper roles',
      'Reports & Bug Forum tab',
      'Global Announcements with staff pfp',
      'Temporary ban system',
      'Real-time game blocking via Firebase',
      'Real-time friend chat',
    ])+
    makeChangelogEntry('v1.0 — Launch','2025','#00d4ff',[
      '27 unblocked games verified and working',
      'Hot games section + game search',
      'about:blank trick for school filters',
      'Dark theme with space background',
      'Background music',
    ])+
    '<div style="font-weight:900;font-size:.95rem;margin:20px 0 10px;color:#FFD700;display:flex;align-items:center;gap:7px;">'+
      svgIcon('announcement','#FFD700',18)+' Staff Announcements (last 24h)'+
    '</div>'+
    '<div id="announcementsFeed"><div style="color:#7878a0;font-size:.82rem;padding:12px 0;">Loading...</div></div>'+
    '</div>';
  document.body.appendChild(panel);
  listenAnnouncements();
}

function makeChangelogEntry(title,date,color,items){
  return'<div style="background:#1a1a24;border:1.5px solid '+color+';border-radius:13px;padding:15px;margin-bottom:13px;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
      '<div style="font-weight:900;font-size:.95rem;color:'+color+';">'+title+'</div>'+
      '<div style="font-size:.72rem;color:#7878a0;">'+date+'</div>'+
    '</div>'+
    items.map(function(item){
      return'<div style="font-size:.82rem;color:#ccc;padding:4px 0;border-bottom:1px solid #1e1e2e;display:flex;gap:7px;align-items:flex-start;"><span style="color:'+color+';flex-shrink:0;">•</span>'+item+'</div>';
    }).join('')+
  '</div>';
}

// ════════════════════════════════════════════════
// SVG ICON HELPER
// ════════════════════════════════════════════════
function svgIcon(name,color,size){
  size=size||20;color=color||'currentColor';
  var paths={
    home:'<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
    friends:'<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
    profile:'<path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>',
    credits:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>',
    reports:'<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/>',
    bell:'<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>',
    clipboard:'<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>',
    announcement:'<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>',
    chat:'<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 14v-2.27l7.19-7.19 2.27 2.27L8.27 14H6zm11.19-9.34l-1.13 1.13-2.27-2.27 1.13-1.13c.39-.39 1.02-.39 1.41 0l.86.86c.39.39.39 1.02 0 1.41z"/>',
    shield:'<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>',
    logout:'<path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>',
    search:'<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>',
    groupchat:'<path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>',
    eye:'<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>',
    kick:'<path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>',
    trash:'<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>',
    game:'<path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>',
    ban:'<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.68L5.68 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.68L18.32 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>',
    star:'<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>',
    code:'<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>',
    users:'<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
    add:'<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>',
    send:'<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>',
    back:'<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>'
  };
  return'<svg width="'+size+'" height="'+size+'" fill="'+color+'" viewBox="0 0 24 24">'+(paths[name]||'')+'</svg>';
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
function sTitle(text,color,icon){
  return'<div style="font-weight:900;font-size:.88rem;margin-bottom:10px;color:'+(color||'#e8e8f0')+';display:flex;align-items:center;gap:6px;">'+(icon?svgIcon(icon,color,16):'')+text+'</div>';
}
function pHeader(title,color,iconName){
  return'<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:16px;">'+
    '<div style="display:flex;align-items:center;gap:10px;">'+
      '<div style="width:34px;height:34px;border-radius:50%;border:2px solid '+color+';display:flex;align-items:center;justify-content:center;background:#1a1a24;">'+
        svgIcon(iconName,color,18)+
      '</div>'+
      '<h2 style="color:'+color+';font-size:1.2rem;font-weight:900;margin:0;">'+title+'</h2>'+
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
    pHeader('Owner Panel','#FFD700','star')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    sCard(sTitle('Global Announcement','#FFD700','announcement')+
      '<input id="apAnnounce" placeholder="Message to ALL users (disappears after 24h)..." style="'+iS()+'">'+
      '<button onclick="apSendAnnouncement()" style="'+bS('#FFD700','#000')+'margin-top:8px;width:100%;padding:9px;">Send Global Announcement</button>'
    )+
    sCard(sTitle('Message Specific User','#FFD700','chat')+
      '<input id="ownerMsgU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<input id="ownerMsgT" placeholder="Message..." style="'+iS()+'">'+
      '<button onclick="ownerSendMessage()" style="'+bS('#00d4ff','#000')+'margin-top:8px;width:100%;padding:9px;">Send Message</button>'
    )+
    sCard(sTitle('Promote / Demote','#FFD700','shield')+
      '<input id="ownerRoleU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
        '<button onclick="ownerSetRoleByUsername(\'developer\')" style="'+bS('#e040fb','#fff')+'flex:1;padding:8px;">Dev</button>'+
        '<button onclick="ownerSetRoleByUsername(\'admin\')" style="'+bS('#00d4ff','#000')+'flex:1;padding:8px;">Admin</button>'+
        '<button onclick="ownerSetRoleByUsername(\'mod\')" style="'+bS('#8e24aa','#fff')+'flex:1;padding:8px;">Mod</button>'+
        '<button onclick="ownerSetRoleByUsername(\'helper\')" style="'+bS('#43a047','#fff')+'flex:1;padding:8px;">Helper</button>'+
        '<button onclick="ownerSetRoleByUsername(\'user\')" style="'+bS('#555','#fff')+'flex:1;padding:8px;">Remove</button>'+
      '</div>'
    )+
    sCard(sTitle('Temporary Ban','#FFD700','ban')+
      '<input id="tempBanU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<select id="tempBanDur" style="'+iS()+'margin-bottom:7px;">'+
        '<option value="1">1 Hour</option><option value="6">6 Hours</option>'+
        '<option value="24">24 Hours</option><option value="72">3 Days</option><option value="168">1 Week</option>'+
      '</select>'+
      '<button onclick="ownerTempBan()" style="'+bS('#ff6b35','#fff')+'width:100%;padding:9px;">Apply Temp Ban</button>'
    )+
    sCard(sTitle('View & Moderate Chats','#FFD700','chat')+
      '<button onclick="staffViewChats()" style="'+bS('#e040fb','#fff')+'width:100%;padding:9px;">Open Chat Monitor</button>'
    )+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;display:flex;align-items:center;gap:6px;">'+svgIcon('users','#e8e8f0',16)+' All Users</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;display:flex;align-items:center;gap:6px;">'+svgIcon('game','#e8e8f0',16)+' Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>'+
    '<div style="background:#1a0000;border:2px solid #ff4757;border-radius:12px;padding:16px;margin-top:18px;">'+
      '<div style="font-weight:900;font-size:.9rem;color:#ff4757;margin-bottom:12px;display:flex;align-items:center;gap:6px;">'+svgIcon('ban','#ff4757',16)+' Danger Zone</div>'+
      '<button onclick="ownerBanAll()" style="'+bS('#ff4757','#fff')+'width:100%;padding:10px;margin-bottom:8px;">Ban ALL Non-Staff Users</button>'+
      '<button onclick="ownerUnbanAll()" style="'+bS('#2ed573','#000')+'width:100%;padding:10px;">Unban ALL Users</button>'+
    '</div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('owner');
}

// ════════════════════════════════════════════════
// ⚙️ DEV PANEL
// ════════════════════════════════════════════════
function showDevPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=
    pHeader('Developer Panel','#e040fb','code')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    sCard(sTitle('Global Announcement','#e040fb','announcement')+
      '<input id="apAnnounce" placeholder="Message to ALL users (disappears after 24h)..." style="'+iS()+'">'+
      '<button onclick="apSendAnnouncement()" style="'+bS('#e040fb','#fff')+'margin-top:8px;width:100%;padding:9px;">Send Global Announcement</button>'
    )+
    sCard(sTitle('Message Specific User','#e040fb','chat')+
      '<input id="ownerMsgU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<input id="ownerMsgT" placeholder="Message..." style="'+iS()+'">'+
      '<button onclick="ownerSendMessage()" style="'+bS('#00d4ff','#000')+'margin-top:8px;width:100%;padding:9px;">Send Message</button>'
    )+
    sCard(sTitle('Manage Roles (Mod & Below)','#e040fb','shield')+
      '<input id="ownerRoleU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
        '<button onclick="ownerSetRoleByUsername(\'mod\')" style="'+bS('#8e24aa','#fff')+'flex:1;padding:8px;">Mod</button>'+
        '<button onclick="ownerSetRoleByUsername(\'helper\')" style="'+bS('#43a047','#fff')+'flex:1;padding:8px;">Helper</button>'+
        '<button onclick="ownerSetRoleByUsername(\'user\')" style="'+bS('#555','#fff')+'flex:1;padding:8px;">Remove</button>'+
      '</div>'
    )+
    sCard(sTitle('Temporary Ban','#e040fb','ban')+
      '<input id="tempBanU" placeholder="Username..." style="'+iS()+'margin-bottom:7px;">'+
      '<select id="tempBanDur" style="'+iS()+'margin-bottom:7px;">'+
        '<option value="1">1 Hour</option><option value="6">6 Hours</option>'+
        '<option value="24">24 Hours</option><option value="72">3 Days</option><option value="168">1 Week</option>'+
      '</select>'+
      '<button onclick="ownerTempBan()" style="'+bS('#ff6b35','#fff')+'width:100%;padding:9px;">Apply Temp Ban</button>'
    )+
    sCard(sTitle('View & Moderate Chats','#e040fb','chat')+
      '<button onclick="staffViewChats()" style="'+bS('#e040fb','#fff')+'width:100%;padding:9px;">Open Chat Monitor</button>'
    )+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;display:flex;align-items:center;gap:6px;">'+svgIcon('users','#e8e8f0',16)+' All Users</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;display:flex;align-items:center;gap:6px;">'+svgIcon('game','#e8e8f0',16)+' Manage Games</div>'+
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
    pHeader('Admin Panel','#00d4ff','shield')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    sCard('<div style="font-size:.82rem;color:#7878a0;">Admins can ban/kick regular users, watch, view live game, kick off site, manage games. Cannot affect Mods, Devs, or Owners.</div>')+
    sCard(sTitle('View & Moderate Chats','#00d4ff','chat')+
      '<button onclick="staffViewChats()" style="'+bS('#00d4ff','#000')+'width:100%;padding:9px;">Open Chat Monitor</button>'
    )+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;display:flex;align-items:center;gap:6px;">'+svgIcon('users','#e8e8f0',16)+' All Users</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;display:flex;align-items:center;gap:6px;">'+svgIcon('game','#e8e8f0',16)+' Manage Games</div>'+
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
    pHeader('Mod Panel','#8e24aa','shield')+
    sCard('<div style="font-size:.82rem;color:#7878a0;">Mods can kick from game, kick off site, view users and their live game. Contact Admin or Dev for bans.</div>')+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;display:flex;align-items:center;gap:6px;">'+svgIcon('users','#e8e8f0',16)+' All Users</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
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
    pHeader('Helper Panel','#43a047','users')+
    sCard('<div style="font-size:.82rem;color:#7878a0;">Helpers can ping Admins and Developers. Report issues via the Reports tab.</div>')+
    sCard(sTitle('Ping Staff','#43a047','announcement')+
      '<input id="helperPingMsg" placeholder="Describe the issue..." style="'+iS()+'margin-bottom:7px;">'+
      '<div style="display:flex;gap:7px;">'+
        '<button onclick="helperPingAdmins()" style="'+bS('#00d4ff','#000')+'flex:1;padding:9px;">Ping Admins</button>'+
        '<button onclick="helperPingDevs()" style="'+bS('#e040fb','#fff')+'flex:1;padding:9px;">Ping Developers</button>'+
      '</div>'
    )+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">All Users (View Only)</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'margin-bottom:10px;">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('helper');
}

// ════════════════════════════════════════════════
// STAFF: CHAT MONITOR
// ════════════════════════════════════════════════
function staffViewChats(){
  var ex=document.getElementById('chatMonitorPanel');if(ex){ex.remove();return;}
  var panel=document.createElement('div');
  panel.id='chatMonitorPanel';
  panel.style.cssText='position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,0.98);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:650px;margin:0 auto;padding:16px 14px 80px;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.98);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:14px;">'+
      '<div style="display:flex;align-items:center;gap:9px;">'+svgIcon('eye','#00d4ff',22)+'<h2 style="color:#00d4ff;font-size:1.1rem;font-weight:900;margin:0;">Chat Monitor</h2></div>'+
      '<button onclick="document.getElementById(\'chatMonitorPanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>'+
    '</div>'+
    '<div id="chatMonitorList"><div style="color:#7878a0;padding:12px;">Loading all chats...</div></div>'+
    '</div>';
  document.body.appendChild(panel);

  // Load all chats (1-on-1 and group)
  db.collection('chats').orderBy('lastMsgTs','desc').limit(50).get().then(function(snap){
    var list=document.getElementById('chatMonitorList');
    if(!list)return;
    if(snap.empty){list.innerHTML='<div style="color:#7878a0;padding:12px;">No chats found.</div>';return;}
    list.innerHTML='';
    snap.forEach(function(doc){
      var chat=doc.data();
      var div=document.createElement('div');
      div.style.cssText='background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:11px 13px;margin-bottom:8px;cursor:pointer;';
      div.innerHTML=
        '<div style="display:flex;align-items:center;justify-content:space-between;">'+
          '<div style="font-weight:900;font-size:.88rem;">'+(chat.name||'Direct Chat')+
            (chat.isGroup?' <span style="font-size:.62rem;background:#e040fb;color:#fff;padding:1px 6px;border-radius:4px;">GROUP</span>':'')+
          '</div>'+
          '<div style="font-size:.7rem;color:#7878a0;">'+timeAgo(chat.lastMsgTs)+'</div>'+
        '</div>'+
        '<div style="font-size:.74rem;color:#aaa;margin-top:3px;">'+
          (chat.memberNames?(chat.memberNames.slice(0,5).map(function(n){return'@'+n;}).join(', ')):'...')+
        '</div>';
      div.onclick=function(){staffOpenChat(doc.id,chat.name||'Direct Chat');};
      list.appendChild(div);
    });
  });
}

function staffOpenChat(chatId,chatName){
  var ex=document.getElementById('staffChatView');if(ex)ex.remove();
  var panel=document.createElement('div');
  panel.id='staffChatView';
  panel.style.cssText='position:fixed;inset:0;z-index:5000;background:rgba(0,0,0,0.99);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:620px;margin:0 auto;padding:16px 14px 80px;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.99);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:14px;">'+
      '<div style="display:flex;align-items:center;gap:9px;">'+svgIcon('eye','#00d4ff',20)+'<h2 style="color:#00d4ff;font-size:1rem;font-weight:900;margin:0;">'+escHtml(chatName)+'</h2></div>'+
      '<button onclick="document.getElementById(\'staffChatView\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">← Back</button>'+
    '</div>'+
    '<div id="staffMsgs"><div style="color:#7878a0;padding:12px;">Loading messages...</div></div>'+
    '</div>';
  document.body.appendChild(panel);

  db.collection('chats').doc(chatId).collection('messages')
    .orderBy('ts','asc').limit(200)
    .onSnapshot(function(snap){
      var container=document.getElementById('staffMsgs');if(!container)return;
      container.innerHTML='';
      snap.forEach(function(msgDoc){
        var m=msgDoc.data();
        var row=document.createElement('div');
        row.style.cssText='display:flex;align-items:flex-start;gap:9px;padding:7px 0;border-bottom:1px solid #1a1a24;';
        row.innerHTML=
          '<div style="flex:1;">'+
            '<div style="font-size:.78rem;font-weight:900;color:#00d4ff;">@'+escHtml(m.senderUsername||'?')+
              ' <span style="color:#7878a0;font-weight:400;">'+timeAgo(m.ts)+'</span></div>'+
            '<div style="font-size:.84rem;color:#e8e8f0;margin-top:2px;">'+escHtml(m.text||'')+'</div>'+
          '</div>'+
          '<button onclick="staffDeleteMsg(\''+chatId+'\',\''+msgDoc.id+'\')" style="'+bS('#ff4757','#fff')+'padding:4px 8px;flex-shrink:0;">'+
            svgIcon('trash','#fff',13)+
          '</button>';
        container.appendChild(row);
      });
    });
}

function staffDeleteMsg(chatId,msgId){
  if(!confirm('Delete this message?'))return;
  db.collection('chats').doc(chatId).collection('messages').doc(msgId).delete().then(function(){
    showNotifToast('Message deleted.','info');
  });
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

    var canBan=outranks&&(viewerRole==='owner'||viewerRole==='admin')&&uRank<2;
    var canTempBan=outranks&&(viewerRole==='owner'||viewerRole==='developer');
    var canKick=outranks&&(viewerRole==='owner'||viewerRole==='developer'||viewerRole==='admin'||viewerRole==='mod');
    var canKickSite=outranks&&(viewerRole==='owner'||viewerRole==='developer'||viewerRole==='admin'||viewerRole==='mod');
    var canView=viewerRole!=='user';
    var canWatch=viewerRole==='owner'||viewerRole==='developer'||viewerRole==='admin';
    var canPromote=viewerRole==='owner'&&!isSelf;
    var devCanPromote=viewerRole==='developer'&&!isSelf&&uRank<ROLE_RANK['mod'];

    var btns='';
    if(canBan){btns+=isBanned
      ?'<button onclick="apUnban(\''+u.uid+'\')" style="'+bS('#2ed573','#000')+'">'+svgIcon('shield','#000',11)+' Unban</button>'
      :'<button onclick="apBan(\''+u.uid+'\')" style="'+bS('#ff4757','#fff')+'">'+svgIcon('ban','#fff',11)+' Ban</button>';
    }
    if(canTempBan){btns+='<button onclick="quickTempBan(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#ff6b35','#fff')+'">'+svgIcon('ban','#fff',11)+' Temp</button>';}
    if(canKick){btns+='<button onclick="apKick(\''+u.uid+'\')" style="'+bS('#e65100','#fff')+'">'+svgIcon('kick','#fff',11)+' Kick</button>';}
    if(canKickSite){btns+='<button onclick="apKickSite(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#c62828','#fff')+'">'+svgIcon('logout','#fff',11)+' Site</button>';}
    if(canView){btns+='<button onclick="panelViewUser(\''+u.uid+'\')" style="'+bS('#1e90ff','#fff')+'">'+svgIcon('game','#fff',11)+' View</button>';}
    if(canWatch){btns+='<button onclick="panelWatchUser(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#9c27b0','#fff')+'">'+svgIcon('eye','#fff',11)+' Watch</button>';}
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
      if(uRole==='helper'||uRole==='mod'){btns+='<button onclick="ownerSetRoleUid(\''+u.uid+'\',\'user\')" style="'+bS('#555','#fff')+'">Remove</button>';}
    }

    // Current game indicator
    var gameTag='';
    if(u.currentGame){gameTag='<div style="font-size:.67rem;color:#2ed573;display:flex;align-items:center;gap:3px;">'+svgIcon('game','#2ed573',11)+' Playing: '+escHtml(u.currentGame)+'</div>';}

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
        gameTag+
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
// VIEW — shows live game the user is currently playing
// ════════════════════════════════════════════════
function panelViewUser(uid){
  var ex=document.getElementById('viewPanel');if(ex)ex.remove();
  var vp=document.createElement('div');
  vp.id='viewPanel';
  vp.style.cssText='position:fixed;bottom:70px;left:16px;z-index:4000;background:#1a1a24;border:2px solid #1e90ff;border-radius:14px;padding:14px 16px;min-width:260px;max-width:320px;font-family:Nunito,sans-serif;color:#e8e8f0;box-shadow:0 4px 24px rgba(0,0,0,.8);';
  vp.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
      '<div style="font-weight:900;font-size:.88rem;color:#1e90ff;display:flex;align-items:center;gap:6px;">'+svgIcon('game','#1e90ff',16)+' Live View</div>'+
      '<button onclick="document.getElementById(\'viewPanel\').remove()" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div id="viewContent" style="font-size:.82rem;color:#aaa;">Loading...</div>';
  document.body.appendChild(vp);

  // Real-time listener on the user doc — shows their currentGame field live
  var unsubView=db.collection('users').doc(uid).onSnapshot(function(doc){
    var vc=document.getElementById('viewContent');
    if(!vc||!doc.exists){if(unsubView)unsubView();return;}
    var u=doc.data();
    var gameHtml=u.currentGame
      ?'<div style="background:#0f3020;border:1.5px solid #2ed573;border-radius:9px;padding:10px 12px;margin-top:8px;display:flex;align-items:center;gap:8px;">'+
          svgIcon('game','#2ed573',18)+
          '<div><div style="font-weight:900;font-size:.9rem;color:#2ed573;">Currently Playing</div>'+
          '<div style="font-size:.84rem;color:#e8e8f0;margin-top:2px;">'+escHtml(u.currentGame)+'</div></div>'+
        '</div>'
      :'<div style="color:#7878a0;font-size:.82rem;padding:8px 0;">Not playing any game right now.</div>';
    vc.innerHTML=
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'+
        '<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;background:#1e90ff;display:flex;align-items:center;justify-content:center;font-weight:900;color:#000;">'+
          (u.pfp?'<img src="'+u.pfp+'" style="width:100%;height:100%;object-fit:cover;">':(u.username||'?')[0].toUpperCase())+
        '</div>'+
        '<div>'+
          '<div style="font-weight:900;font-size:.88rem;">@'+escHtml(u.username||'?')+'</div>'+
          '<div style="font-size:.68rem;color:#7878a0;">Last seen: '+timeAgo(u.lastSeen)+'</div>'+
        '</div>'+
      '</div>'+
      gameHtml;
  });
}

// ════════════════════════════════════════════════
// WATCH — full live panel with kick option
// ════════════════════════════════════════════════
function panelWatchUser(uid,username){
  var ex=document.getElementById('watchPanel');if(ex)ex.remove();
  var wp=document.createElement('div');
  wp.id='watchPanel';
  wp.style.cssText='position:fixed;bottom:70px;right:16px;z-index:4000;background:#1a1a24;border:2px solid #9c27b0;border-radius:14px;padding:14px 16px;min-width:260px;max-width:320px;font-family:Nunito,sans-serif;color:#e8e8f0;box-shadow:0 4px 24px rgba(0,0,0,.8);';
  wp.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
      '<div style="font-weight:900;font-size:.88rem;color:#9c27b0;display:flex;align-items:center;gap:6px;">'+svgIcon('eye','#9c27b0',16)+' Watching @'+escHtml(username)+'</div>'+
      '<button onclick="document.getElementById(\'watchPanel\').remove()" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:1rem;">✕</button>'+
    '</div>'+
    '<div id="watchContent" style="font-size:.8rem;color:#aaa;">Loading...</div>'+
    '<div style="display:flex;gap:7px;margin-top:10px;">'+
      '<button onclick="apKick(\''+uid+'\')" style="'+bS('#e65100','#fff')+'flex:1;padding:8px;display:flex;align-items:center;justify-content:center;gap:5px;">'+svgIcon('kick','#fff',13)+' Kick Game</button>'+
      '<button onclick="apKickSite(\''+uid+'\',\''+username+'\')" style="'+bS('#c62828','#fff')+'flex:1;padding:8px;display:flex;align-items:center;justify-content:center;gap:5px;">'+svgIcon('logout','#fff',13)+' Kick Site</button>'+
    '</div>';
  document.body.appendChild(wp);

  var unsubWatch=db.collection('users').doc(uid).onSnapshot(function(doc){
    var wc=document.getElementById('watchContent');
    if(!wc||!doc.exists){if(unsubWatch)unsubWatch();return;}
    var u=doc.data();
    wc.innerHTML=
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'+
        '<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;background:#9c27b0;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;">'+
          (u.pfp?'<img src="'+u.pfp+'" style="width:100%;height:100%;object-fit:cover;">':(u.username||'?')[0].toUpperCase())+
        '</div>'+
        '<div>'+
          '<div style="font-size:.78rem;font-weight:900;">@'+escHtml(u.username||'?')+'</div>'+
          '<div style="font-size:.66rem;color:#9c27b0;">'+getRoleBadgeHtml(getUserRole(u))+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">'+
        '<div style="background:#0f0f13;border-radius:8px;padding:7px 9px;"><div style="font-size:.66rem;color:#7878a0;">Status</div><div style="font-weight:900;font-size:.82rem;color:'+(u.banned?'#ff4757':'#2ed573')+'">'+(u.banned?'BANNED':'Active')+'</div></div>'+
        '<div style="background:#0f0f13;border-radius:8px;padding:7px 9px;"><div style="font-size:.66rem;color:#7878a0;">Games Played</div><div style="font-weight:900;font-size:.82rem;">'+(u.gamesPlayed||0)+'</div></div>'+
        '<div style="background:#0f0f13;border-radius:8px;padding:7px 9px;"><div style="font-size:.66rem;color:#7878a0;">Friends</div><div style="font-weight:900;font-size:.82rem;">'+(u.friends||[]).length+'</div></div>'+
        '<div style="background:#0f0f13;border-radius:8px;padding:7px 9px;"><div style="font-size:.66rem;color:#7878a0;">Last Seen</div><div style="font-weight:900;font-size:.82rem;">'+timeAgo(u.lastSeen)+'</div></div>'+
      '</div>'+
      (u.currentGame?'<div style="margin-top:8px;background:#0f3020;border:1px solid #2ed573;border-radius:8px;padding:8px 10px;font-size:.8rem;display:flex;align-items:center;gap:6px;">'+svgIcon('game','#2ed573',14)+' <b style="color:#2ed573;">'+escHtml(u.currentGame)+'</b></div>':'<div style="margin-top:8px;color:#7878a0;font-size:.78rem;">Not playing right now.</div>');
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
    sendNotification(snap.docs[0].id,(role==='owner'?'👑':'⚙️')+' @'+currentUser.username+': '+msg,'message');
    document.getElementById('ownerMsgU').value='';document.getElementById('ownerMsgT').value='';
    showNotifToast('Message sent!','info');
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
    var msgs={developer:'⚙️ Promoted to Developer!',admin:'🛡️ Promoted to Admin!',mod:'🔨 Promoted to Mod!',helper:'🤝 Made a Helper!',user:'Your staff role was removed.'};
    sendNotification(uid,msgs[newRole]||'Role updated.','info');
    var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
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
      sendNotification(uid,'⏰ Temporarily banned for '+hrs+' hour(s).','warning');
      document.getElementById('tempBanU').value='';
      showNotifToast('Temp ban applied!','info');
      var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
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
    var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
  });
}
function ownerBanAll(){
  if(!confirm('Ban ALL non-staff users?'))return;
  if(!confirm('FINAL WARNING. Continue?'))return;
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){if(getUserRole(doc.data())==='user')batch.update(doc.ref,{banned:true});});
    batch.commit().then(function(){
      sendGlobalNotification('A mass moderation action was taken.','warning',currentUser.uid,currentUser.username,currentUser.pfp||null,getUserRole(currentUser));
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
    showNotifToast('Admins pinged!','info');
  });
}
function helperPingDevs(){
  var msg=(document.getElementById('helperPingMsg').value||'').trim();
  if(!msg){showNotifToast('Describe the issue first!','warning');return;}
  db.collection('users').where('role','in',['developer','owner']).get().then(function(snap){
    snap.forEach(function(doc){sendNotification(doc.id,'🤝 Helper @'+currentUser.username+': '+msg,'warning');});
    document.getElementById('helperPingMsg').value='';
    showNotifToast('Developers pinged!','info');
  });
}

// ════════════════════════════════════════════════
// SHARED STAFF ACTIONS
// ════════════════════════════════════════════════
function apBan(uid){
  db.collection('users').doc(uid).update({banned:true}).then(function(){
    sendNotification(uid,'You have been banned from Dv\'s Unblocked Games.','warning');
    var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
  });
}
function apUnban(uid){
  db.collection('users').doc(uid).update({banned:false,tempBannedUntil:null}).then(function(){
    sendNotification(uid,'Your ban has been lifted. Welcome back!','info');
    var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
  });
}
function apKick(uid){
  db.collection('users').doc(uid).update({kicked:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){
    sendNotification(uid,'You were kicked from your current game by a staff member.','warning');
    showNotifToast('User kicked from game!','info');
  });
}
function apKickSite(uid,username){
  if(!confirm('Kick @'+username+' off the site?'))return;
  db.collection('users').doc(uid).update({kickedFromSite:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){
    sendNotification(uid,'You have been kicked off the site.','warning');
    showNotifToast('@'+username+' kicked off site!','info');
  });
}
function apSendAnnouncement(){
  var msg=(document.getElementById('apAnnounce').value||'').trim();
  if(!msg){showNotifToast('Type a message first!','warning');return;}
  var role=getUserRole(currentUser);
  sendGlobalNotification(msg,'update',currentUser.uid,currentUser.username,currentUser.pfp||null,role);
  document.getElementById('apAnnounce').value='';
  showNotifToast('Announcement sent!','info');
}
function renderAdminGameRows(){
  if(typeof GAMES==='undefined')return'';
  return GAMES.map(function(g){
    var isBlocked=_blockedGames.includes(g.id);
    return'<div style="display:flex;align-items:center;gap:10px;background:#13131c;border:1px solid #2e2e3e;border-radius:9px;padding:8px 12px;margin-bottom:7px;">'+
      '<img src="'+g.thumb+'" style="width:38px;height:38px;border-radius:7px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">'+
      '<div style="flex:1;font-weight:900;font-size:.88rem;">'+escHtml(g.name)+'</div>'+
      (isBlocked
        ?'<span style="color:#ff4757;font-size:.72rem;margin-right:5px;">BLOCKED</span><button onclick="apUnblockGame(\''+g.id+'\')" style="'+bS('#2ed573','#000')+'">Unblock</button>'
        :'<button onclick="apBlockGame(\''+g.id+'\')" style="'+bS('#ff6b35','#fff')+'">Block</button>')+
    '</div>';
  }).join('');
}
function apBlockGame(id){
  var b=_blockedGames.slice();if(!b.includes(id))b.push(id);
  saveBlockedGames(b);
  sendGlobalNotification('A game has been blocked by staff.','warning',currentUser.uid,currentUser.username,currentUser.pfp||null,getUserRole(currentUser));
}
function apUnblockGame(id){
  saveBlockedGames(_blockedGames.filter(function(b){return b!==id;}));
  sendGlobalNotification('A game has been unblocked!','info',currentUser.uid,currentUser.username,currentUser.pfp||null,getUserRole(currentUser));
}

// ════════════════════════════════════════════════
// KICK / BAN LISTENER
// ════════════════════════════════════════════════
function listenForKick(uid){
  db.collection('users').doc(uid).onSnapshot(function(doc){
    if(!doc.exists)return;
    var d=doc.data();
    if(d.banned){clearSession();auth.signOut();alert('You have been banned.');location.reload();return;}
    if(d.tempBannedUntil&&d.tempBannedUntil.toMillis&&d.tempBannedUntil.toMillis()>Date.now()){
      clearSession();auth.signOut();
      alert('⏰ You are temporarily banned for '+Math.ceil((d.tempBannedUntil.toMillis()-Date.now())/3600000)+' more hour(s).');
      location.reload();return;
    }
    if(d.kickedFromSite&&d.kickedFromSite.toMillis&&Date.now()-d.kickedFromSite.toMillis()<15000){
      clearSession();auth.signOut();alert('You have been kicked off the site.');location.reload();return;
    }
    if(d.kicked&&d.kicked.toMillis&&Date.now()-d.kicked.toMillis()<10000){
      alert('You were kicked from your current game.');closeInPage();
    }
  });
}

// ════════════════════════════════════════════════
// POPUP & GAME
// ════════════════════════════════════════════════
function openPopup(game){
  if(_blockedGames.includes(game.id)){alert('This game is blocked by staff.');return;}
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
  // Save current game to Firestore so Watch/View can see it
  if(currentUser){
    db.collection('users').doc(currentUser.uid).update({currentGame:name});
  }
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
  // Clear current game in Firestore
  if(currentUser){db.collection('users').doc(currentUser.uid).update({currentGame:null});}
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
  var badge=game.hot?'<span class="card-badge badge-hot">HOT</span>':game.isNew?'<span class="card-badge badge-new">NEW</span>':'';
  var bo=isBlocked?'<div class="blocked-overlay">'+svgIcon('ban','#fff',24)+'<div class="blocked-text">Blocked</div></div>':'';
  div.innerHTML='<div class="card-thumb" style="background:'+game.color+'"><img src="'+game.thumb+'" alt="'+escHtml(game.name)+'" onerror="this.parentElement.style.background=\''+game.color+'\';this.style.display=\'none\'">'+badge+bo+'</div><div class="card-body"><div class="card-name">'+escHtml(game.name)+'</div></div>';
  div.addEventListener('click',function(){openPopup(game);});
  return div;
}
function makeGuestCard(game){
  var isBlocked=_blockedGames.includes(game.id);
  var div=document.createElement('div');
  div.className='c6x-card'+(isBlocked?' card-blocked':'');
  var bo=isBlocked?'<div class="blocked-overlay">'+svgIcon('ban','#fff',24)+'<div class="blocked-text">Blocked</div></div>':'';
  div.innerHTML='<div class="c6x-thumb" style="background:'+game.color+'"><img src="'+game.thumb+'" alt="'+escHtml(game.name)+'" onerror="this.parentElement.style.background=\''+game.color+'\';this.style.display=\'none\'">'+bo+'</div><div class="c6x-name">'+escHtml(game.name)+'</div>';
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

// ════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════
function timeAgo(ts){
  if(!ts)return'Never';
  var d=(Date.now()-(ts.toMillis?ts.toMillis():ts))/1000;
  if(d<60)return'Just now';if(d<3600)return Math.floor(d/60)+'m ago';
  if(d<86400)return Math.floor(d/3600)+'h ago';return Math.floor(d/86400)+'d ago';
}
function escHtml(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
