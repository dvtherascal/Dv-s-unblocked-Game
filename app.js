// ═══════════════════════════════════════════════
// DV'S UNBLOCKED GAMES — app.js
// ═══════════════════════════════════════════════

var currentGame = null;
var currentUser = null;
var _blockedGames = [];
var _ownerStep1Passed = false;
var unsubNotifs = null;
var ANNOUNCEMENT_TTL_MS = 24 * 60 * 60 * 1000;

var OWNER_CODE_STEP1 = "Lakayden young";
var OWNER_CODE_STEP2 = "BP28Lakayden";
var DEV_CODE    = "DvsDeveloper2025";
var ADMIN_CODE  = "DvRascals";
var MOD_CODE    = "Monveiaoa";
var HELPER_CODE = "DvsHelper2025";

var ROLE_RANK = {owner:5,developer:4,admin:3,mod:2,helper:1,user:0};

// ── SESSION (auto-login store) ──
function saveSession(uid){
  try{localStorage.setItem('dvs_uid',uid);localStorage.setItem('dvs_ts',Date.now());}catch(e){}
}
function loadSession(){
  try{
    var uid=localStorage.getItem('dvs_uid');
    var ts=parseInt(localStorage.getItem('dvs_ts')||'0');
    if(uid&&Date.now()-ts<48*3600*1000)return uid;
  }catch(e){}
  return null;
}
function clearSession(){
  try{localStorage.removeItem('dvs_uid');localStorage.removeItem('dvs_ts');}catch(e){}
}

// ── BLOCKED GAMES ──
function listenBlockedGames(){
  try{
    db.collection('settings').doc('blockedGames').onSnapshot(function(doc){
      _blockedGames = doc.exists ? (doc.data().ids||[]) : [];
      if(currentUser) renderUserPage(currentUser);
      else renderGuestGrid();
    });
  }catch(e){console.warn('listenBlockedGames error',e);}
}
function saveBlockedGames(arr){
  _blockedGames=arr;
  db.collection('settings').doc('blockedGames').set({ids:arr});
}

// ── MUSIC ──
var _musicStarted=false;
function startMusic(){
  if(_musicStarted)return;
  var m=document.getElementById('bgMusic');
  if(!m)return;
  m.volume=0.18;m.loop=true;
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
  var bg=document.getElementById('bgWrap');
  if(bg)bg.style.opacity='0.18';
}

// ══════════════════════════════
// AUTH
// ══════════════════════════════
auth.onAuthStateChanged(function(firebaseUser){
  try{
    if(firebaseUser){
      saveSession(firebaseUser.uid);
      db.collection('users').doc(firebaseUser.uid).get().then(function(doc){
        if(doc.exists){
          currentUser=doc.data();
          currentUser.uid=firebaseUser.uid;
          bootSignedIn(currentUser);
          listenForNotifications(firebaseUser.uid);
          listenForKick(firebaseUser.uid);
          setInterval(function(){updateLastSeen(firebaseUser.uid);},60000);
        } else {
          auth.signOut();clearSession();showLoginModal();
        }
      }).catch(function(e){console.warn('user fetch error',e);showLoginModal();});
    } else {
      // Try auto-login
      var savedUid=loadSession();
      if(savedUid){
        db.collection('users').doc(savedUid).get().then(function(doc){
          if(doc.exists){
            currentUser=doc.data();
            currentUser.uid=savedUid;
            bootSignedIn(currentUser);
            listenForNotifications(savedUid);
            listenForKick(savedUid);
            setInterval(function(){updateLastSeen(savedUid);},60000);
          } else {
            clearSession();showLoginModal();
          }
        }).catch(function(){clearSession();showLoginModal();});
      } else {
        currentUser=null;
        showLoginModal();
      }
    }
  }catch(e){console.warn('auth error',e);showLoginModal();}
  startMusic();
  listenBlockedGames();
});

function updateLastSeen(uid){
  try{db.collection('users').doc(uid).update({lastSeen:firebase.firestore.FieldValue.serverTimestamp()});}catch(e){}
}

// ══════════════════════════════
// SHOW / HIDE LOGIN
// ══════════════════════════════
function showLoginModal(){
  var m=document.getElementById('loginModal');
  if(m)m.classList.remove('hidden');
  var uv=document.getElementById('userView');  if(uv)uv.style.display='none';
  var gv=document.getElementById('guestView'); if(gv)gv.style.display='none';
}

// ══════════════════════════════
// BOOT
// ══════════════════════════════
function bootSignedIn(user){
  try{
    var lm=document.getElementById('loginModal');if(lm)lm.classList.add('hidden');
    var gv=document.getElementById('guestView');if(gv)gv.style.display='none';
    var uv=document.getElementById('userView'); if(uv)uv.style.display='block';

    var ids=['friendsNavBtn','profileNavBtn','creditsNavBtn','reportsNavBtn','groupchatsNavBtn'];
    ids.forEach(function(id){
      var el=document.getElementById(id);if(el)el.style.display='flex';
    });
    var lo=document.getElementById('navLogoutBtn');if(lo)lo.style.display='block';
    var nm=document.getElementById('navMid');if(nm)nm.style.display='flex';
    var nb=document.getElementById('notifBtn');if(nb)nb.style.display='flex';
    var ub=document.getElementById('updatesBtn');if(ub)ub.style.display='flex';

    var role=getUserRole(user);
    if(role!=='user'){
      var borders={owner:'#FFD700',developer:'#e040fb',admin:'#00d4ff',mod:'#8e24aa',helper:'#43a047'};
      var btn=document.getElementById('roleNavBtn');
      if(btn){
        btn.style.display='flex';
        btn.style.alignItems='center';
        var svgEl=btn.querySelector('.role-svg');
        if(svgEl)svgEl.style.border='2px solid '+(borders[role]||'#FFD700');
        btn.onclick=function(){showRolePanel(role);};
      }
    }

    renderNav(user);
    renderUserPage(user);
    showSpaceBg();
    startMusic();
    listenAnnouncements();
  }catch(e){console.warn('bootSignedIn error',e);}
}

function bootGuest(){
  try{
    var gv=document.getElementById('guestView');if(gv)gv.style.display='block';
    var uv=document.getElementById('userView'); if(uv)uv.style.display='none';
    var ids=['friendsNavBtn','profileNavBtn','creditsNavBtn','reportsNavBtn',
             'groupchatsNavBtn','roleNavBtn','notifBtn','updatesBtn'];
    ids.forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
    var lo=document.getElementById('navLogoutBtn');if(lo)lo.style.display='block';
    document.getElementById('navAvatar').innerHTML='G';
    document.getElementById('navUsername').textContent='Guest';
    renderGuestGrid();
    startMusic();
  }catch(e){console.warn('bootGuest error',e);}
}

function renderNav(user){
  try{
    var un=document.getElementById('navUsername');if(un)un.textContent=user.username||'Guest';
    var av=document.getElementById('navAvatar');
    if(av)av.innerHTML=user.pfp
      ?'<img src="'+user.pfp+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">'
      :(user.username||'G')[0].toUpperCase();
    var hn=document.getElementById('heroName');if(hn)hn.textContent=user.name||user.username||'Player';
  }catch(e){}
}

// ══════════════════════════════
// LOGIN / LOGOUT
// ══════════════════════════════
function validateEmail(email){
  var re=/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if(!re.test(email))return false;
  var blocked=['mailinator','guerrillamail','tempmail','yopmail','trashmail','fakeinbox','maildrop','throwam'];
  var domain=email.split('@')[1].toLowerCase();
  for(var i=0;i<blocked.length;i++){if(domain.includes(blocked[i]))return false;}
  return true;
}

function doLogin(){
  try{
    var name=(document.getElementById('regName').value||'').trim();
    var email=(document.getElementById('regEmail').value||'').trim();
    var username=(document.getElementById('regUsername').value||'').trim();
    var secret=(document.getElementById('regSecret').value||'').trim();
    var err=document.getElementById('loginError');
    err.style.color='#ff4757';

    if(!name){err.textContent='Please enter your name!';return;}
    if(!validateEmail(email)){err.textContent='Please enter a valid email address!';return;}
    if(!username||username.length<2){err.textContent='Username must be at least 2 characters!';return;}
    if(!/^[a-zA-Z0-9_]+$/.test(username)){err.textContent='Letters, numbers and _ only!';return;}

    if(secret===OWNER_CODE_STEP1){
      _ownerStep1Passed=true;
      err.style.color='#2ed573';
      err.textContent='Step 1 verified! Enter second code and sign in again.';
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
    } else if(secret!==''){
      err.textContent='Invalid staff code!';_ownerStep1Passed=false;return;
    }

    db.collection('users').where('usernameLower','==',username.toLowerCase()).get()
      .then(function(snap){
        if(!snap.empty){
          var ed=snap.docs[0].data();
          if(ed.email&&ed.email.toLowerCase()!==email.toLowerCase()){
            err.textContent='Username already taken!';return;
          }
          if(role!=='user'){
            db.collection('users').doc(snap.docs[0].id).update({
              role:role,isOwner:isOwner,isDeveloper:isDeveloper,
              isAdmin:isAdmin,isMod:isMod,isHelper:isHelper
            });
          }
          auth.signInWithEmailAndPassword(email,username+'_dvs_2025_'+email.split('@')[0])
            .catch(function(){signUpFirebase(name,email,username,role,isOwner,isDeveloper,isAdmin,isMod,isHelper);});
        } else {
          signUpFirebase(name,email,username,role,isOwner,isDeveloper,isAdmin,isMod,isHelper);
        }
      }).catch(function(e){err.textContent='Error: '+e.message;});
  }catch(e){console.warn('doLogin error',e);}
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
  }).then(function(){
    var lm=document.getElementById('loginModal');if(lm)lm.classList.add('hidden');
  }).catch(function(e){
    if(e.code==='auth/email-already-in-use'){
      auth.signInWithEmailAndPassword(email,username+'_dvs_2025_'+email.split('@')[0])
        .catch(function(e2){err.textContent='Error: '+e2.message;});
    } else {
      err.textContent='Error: '+e.message;
    }
  });
}

function doGuest(){
  var lm=document.getElementById('loginModal');if(lm)lm.classList.add('hidden');
  bootGuest();
}

function doLogout(){
  try{
    if(unsubNotifs)unsubNotifs();
    clearSession();
    auth.signOut().then(function(){
      currentUser=null;
      var uv=document.getElementById('userView');if(uv)uv.style.display='none';
      var gv=document.getElementById('guestView');if(gv)gv.style.display='none';
      var bg=document.getElementById('bgWrap');if(bg)bg.style.opacity='0';
      var av=document.getElementById('navAvatar');if(av)av.innerHTML='G';
      var un=document.getElementById('navUsername');if(un)un.textContent='Guest';
      showLoginModal();
    });
  }catch(e){console.warn('doLogout error',e);}
}

// ══════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════
function listenForNotifications(uid){
  try{
    if(unsubNotifs)unsubNotifs();
    unsubNotifs=db.collection('users').doc(uid).collection('notifications')
      .where('read','==',false).orderBy('ts','desc').limit(20)
      .onSnapshot(function(snap){
        updateNotifBadge(snap.size);
        snap.docChanges().forEach(function(change){
          if(change.type==='added'){
            var n=change.doc.data();
            showNotifToast(n.message,n.type||'info');
          }
        });
      });
  }catch(e){console.warn('listenForNotifications error',e);}
}

function updateNotifBadge(count){
  var b=document.getElementById('notifBadge');
  if(!b)return;
  b.textContent=count;
  b.style.display=count>0?'flex':'none';
}

function showNotifToast(message,type){
  try{
    var colors={info:'#00d4ff',message:'#2ed573',update:'#FFD700',warning:'#ff4757'};
    var color=colors[type]||colors.info;
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a24;border:2px solid '+color+';color:#e8e8f0;padding:12px 20px;border-radius:12px;font-family:Nunito,sans-serif;font-weight:700;font-size:.88rem;z-index:9999;max-width:320px;width:90%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.5);transition:opacity .5s;pointer-events:none;';
    t.textContent=message;
    document.body.appendChild(t);
    setTimeout(function(){t.style.opacity='0';setTimeout(function(){if(t.parentNode)t.remove();},500);},4000);
  }catch(e){}
}

function sendNotification(toUid,message,type){
  db.collection('users').doc(toUid).collection('notifications').add({
    message:message,type:type||'info',read:false,
    ts:firebase.firestore.FieldValue.serverTimestamp()
  });
}

function sendGlobalNotification(message,type,senderUid,senderUsername,senderPfp,senderRole){
  var expiresAt=new Date(Date.now()+ANNOUNCEMENT_TTL_MS);
  db.collection('announcements').add({
    message:message,type:type||'update',
    senderUid:senderUid||null,
    senderUsername:senderUsername||'Staff',
    senderPfp:senderPfp||null,
    senderRole:senderRole||'staff',
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

// ══════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════
function listenAnnouncements(){
  try{
    var cutoff=new Date(Date.now()-ANNOUNCEMENT_TTL_MS);
    db.collection('announcements')
      .where('ts','>',firebase.firestore.Timestamp.fromDate(cutoff))
      .orderBy('ts','desc').limit(20)
      .onSnapshot(function(snap){
        var feed=document.getElementById('announcementsFeed');
        if(feed){
          if(snap.empty){
            feed.innerHTML='<div style="color:#7878a0;font-size:.82rem;padding:12px 0;text-align:center;">No announcements in the last 24 hours.</div>';
          } else {
            feed.innerHTML='';
            snap.forEach(function(doc){feed.appendChild(makeAnnouncementCard(doc.data()));});
          }
        }
        if(!snap.empty){
          updateAnnouncementBanner(snap.docs[0].data());
          var dot=document.getElementById('updatesDot');
          if(dot)dot.style.display='block';
        }
      });
    // Purge expired
    db.collection('announcements')
      .where('expiresAt','<',firebase.firestore.Timestamp.fromDate(new Date()))
      .get().then(function(snap){
        var batch=db.batch();
        snap.forEach(function(doc){batch.delete(doc.ref);});
        if(!snap.empty)batch.commit();
      });
  }catch(e){console.warn('listenAnnouncements error',e);}
}

function updateAnnouncementBanner(a){
  try{
    var banner=document.getElementById('latestAnnouncementBanner');if(!banner)return;
    var roleColors={owner:'#FFD700',developer:'#e040fb',admin:'#00d4ff',mod:'#8e24aa',helper:'#43a047'};
    var color=roleColors[a.senderRole]||'#FFD700';
    banner.style.borderColor=color;banner.style.display='block';
    var label=banner.querySelector('.ann-label');if(label)label.style.color=color;
    var av=document.getElementById('latestAnnouncerAvatar');
    if(av){
      av.style.borderColor=color;av.style.background=color;
      av.innerHTML=a.senderPfp
        ?'<img src="'+a.senderPfp+'" style="width:100%;height:100%;object-fit:cover;">'
        :(a.senderUsername||'S')[0].toUpperCase();
    }
    var nm=document.getElementById('latestAnnouncerName');if(nm){nm.textContent='@'+a.senderUsername;nm.style.color=color;}
    var msg=document.getElementById('latestAnnouncementMsg');if(msg)msg.textContent=a.message;
  }catch(e){}
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
      '<div>'+
        '<div style="font-weight:900;font-size:.88rem;">@'+escHtml(a.senderUsername)+
          ' <span style="font-size:.62rem;background:'+color+';color:#000;padding:2px 7px;border-radius:4px;font-weight:900;">'+roleLabels[a.senderRole]+'</span></div>'+
        '<div style="font-size:.68rem;color:#7878a0;">'+timeAgo(a.ts)+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="font-size:.86rem;color:#e8e8f0;line-height:1.5;">'+escHtml(a.message)+'</div>';
  return div;
}

// ══════════════════════════════
// UPDATE LOG PANEL
// ══════════════════════════════
function showUpdatesPanel(){
  var ex=document.getElementById('updatesPanel');if(ex){ex.remove();return;}
  var panel=document.createElement('div');
  panel.id='updatesPanel';
  panel.style.cssText='position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.97);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:600px;margin:0 auto;padding:16px 14px 80px;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:16px;">'+
      '<h2 style="color:#FFD700;font-size:1.2rem;font-weight:900;margin:0;">📋 Update Log</h2>'+
      '<button onclick="document.getElementById(\'updatesPanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>'+
    '</div>'+
    '<div style="background:#1a1a24;border:1.5px solid #FFD700;border-radius:13px;padding:15px;margin-bottom:13px;">'+
      '<div style="font-weight:900;font-size:.95rem;color:#FFD700;margin-bottom:10px;">v2.1 — Final Update</div>'+
      ['Announcements auto-expire after 24h','Group chats with real-time messaging',
       'Space background fixed on all tabs','All icons replaced with SVGs',
       'Auto-login — stays signed in 48h','View: see live game user is playing',
       'Watch: full panel with kick option','Admins can view & delete chat messages',
       'Email validation with disposable email blocking'].map(function(i){
        return'<div style="font-size:.82rem;color:#ccc;padding:4px 0;border-bottom:1px solid #1e1e2e;">• '+i+'</div>';
      }).join('')+
    '</div>'+
    '<div style="background:#1a1a24;border:1.5px solid #e040fb;border-radius:13px;padding:15px;margin-bottom:13px;">'+
      '<div style="font-weight:900;font-size:.95rem;color:#e040fb;margin-bottom:10px;">v2.0 — Major Update</div>'+
      ['5-tier staff system (Owner/Dev/Admin/Mod/Helper)','Reports & Bug Forum',
       'Global Announcements with staff pfp','Temp ban system',
       'Real-time game blocking','Real-time friend chat'].map(function(i){
        return'<div style="font-size:.82rem;color:#ccc;padding:4px 0;border-bottom:1px solid #1e1e2e;">• '+i+'</div>';
      }).join('')+
    '</div>'+
    '<div style="background:#1a1a24;border:1.5px solid #00d4ff;border-radius:13px;padding:15px;margin-bottom:13px;">'+
      '<div style="font-weight:900;font-size:.95rem;color:#00d4ff;margin-bottom:10px;">v1.0 — Launch</div>'+
      ['27 unblocked games verified','Hot games + search','about:blank trick for school filters',
       'Dark theme with space background','Background music'].map(function(i){
        return'<div style="font-size:.82rem;color:#ccc;padding:4px 0;border-bottom:1px solid #1e1e2e;">• '+i+'</div>';
      }).join('')+
    '</div>'+
    '<div style="font-weight:900;font-size:.95rem;margin:20px 0 10px;color:#FFD700;">📢 Staff Announcements (last 24h)</div>'+
    '<div id="announcementsFeed"><div style="color:#7878a0;font-size:.82rem;padding:12px 0;">Loading...</div></div>'+
    '</div>';
  document.body.appendChild(panel);
  listenAnnouncements();
}

// ══════════════════════════════
// ROLE HELPERS
// ══════════════════════════════
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
  if(!colors[role])return'';
  return'<span style="font-size:.58rem;background:'+colors[role]+';color:'+(role==='mod'||role==='helper'?'#fff':'#000')+';padding:2px 7px;border-radius:4px;font-weight:900;">'+labels[role]+'</span>';
}

// ══════════════════════════════
// PANEL ROUTER
// ══════════════════════════════
function showRolePanel(role){
  var r=role||getUserRole(currentUser);
  if(r==='owner')showOwnerPanel();
  else if(r==='developer')showDevPanel();
  else if(r==='admin')showAdminPanel();
  else if(r==='mod')showModPanel();
  else if(r==='helper')showHelperPanel();
}

// ── shared panel styles ──
function iS(){return'width:100%;padding:9px 12px;background:#0f0f13;border:1.5px solid #2e2e3e;border-radius:9px;color:#e8e8f0;font-size:.86rem;font-family:Nunito,sans-serif;outline:none;box-sizing:border-box;margin-bottom:7px;';}
function bS(bg,fg){return'background:'+bg+';color:'+fg+';border:none;padding:6px 11px;border-radius:8px;font-weight:900;cursor:pointer;font-family:Nunito,sans-serif;font-size:.76rem;';}
function sCard(content){return'<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:12px;padding:14px;margin-bottom:14px;">'+content+'</div>';}
function sTitle(text,color){return'<div style="font-weight:900;font-size:.88rem;margin-bottom:10px;color:'+(color||'#e8e8f0')+';">'+text+'</div>';}

function pHeader(title,color){
  return'<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.97);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:16px;">'+
    '<h2 style="color:'+color+';font-size:1.2rem;font-weight:900;margin:0;">'+title+'</h2>'+
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

// ══════════════════════════════
// OWNER PANEL
// ══════════════════════════════
function showOwnerPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=pHeader('👑 Owner Panel','#FFD700')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    sCard(sTitle('📢 Global Announcement','#FFD700')+
      '<input id="apAnnounce" placeholder="Message (disappears after 24h)..." style="'+iS()+'">'+
      '<button onclick="apSendAnnouncement()" style="'+bS('#FFD700','#000')+'width:100%;padding:9px;">Send Announcement</button>')+
    sCard(sTitle('💬 Message Specific User','#FFD700')+
      '<input id="ownerMsgU" placeholder="Username..." style="'+iS()+'">'+
      '<input id="ownerMsgT" placeholder="Message..." style="'+iS()+'">'+
      '<button onclick="ownerSendMessage()" style="'+bS('#00d4ff','#000')+'width:100%;padding:9px;">Send Message</button>')+
    sCard(sTitle('⬆️ Promote / Demote','#FFD700')+
      '<input id="ownerRoleU" placeholder="Username..." style="'+iS()+'">'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
      '<button onclick="ownerSetRoleByUsername(\'developer\')" style="'+bS('#e040fb','#fff')+'flex:1;padding:8px;">Dev</button>'+
      '<button onclick="ownerSetRoleByUsername(\'admin\')" style="'+bS('#00d4ff','#000')+'flex:1;padding:8px;">Admin</button>'+
      '<button onclick="ownerSetRoleByUsername(\'mod\')" style="'+bS('#8e24aa','#fff')+'flex:1;padding:8px;">Mod</button>'+
      '<button onclick="ownerSetRoleByUsername(\'helper\')" style="'+bS('#43a047','#fff')+'flex:1;padding:8px;">Helper</button>'+
      '<button onclick="ownerSetRoleByUsername(\'user\')" style="'+bS('#555','#fff')+'flex:1;padding:8px;">Remove</button>'+
      '</div>')+
    sCard(sTitle('⏰ Temp Ban','#FFD700')+
      '<input id="tempBanU" placeholder="Username..." style="'+iS()+'">'+
      '<select id="tempBanDur" style="'+iS()+'">'+
      '<option value="1">1 Hour</option><option value="6">6 Hours</option>'+
      '<option value="24">24 Hours</option><option value="72">3 Days</option><option value="168">1 Week</option>'+
      '</select>'+
      '<button onclick="ownerTempBan()" style="'+bS('#ff6b35','#fff')+'width:100%;padding:9px;">Apply Temp Ban</button>')+
    sCard(sTitle('👁️ View & Moderate Chats','#FFD700')+
      '<button onclick="staffViewChats()" style="'+bS('#e040fb','#fff')+'width:100%;padding:9px;">Open Chat Monitor</button>')+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>'+
    '<div style="background:#1a0000;border:2px solid #ff4757;border-radius:12px;padding:16px;margin-top:18px;">'+
    '<div style="font-weight:900;font-size:.9rem;color:#ff4757;margin-bottom:12px;">⚠️ Danger Zone</div>'+
    '<button onclick="ownerBanAll()" style="'+bS('#ff4757','#fff')+'width:100%;padding:10px;margin-bottom:8px;">Ban ALL Non-Staff Users</button>'+
    '<button onclick="ownerUnbanAll()" style="'+bS('#2ed573','#000')+'width:100%;padding:10px;">Unban ALL Users</button>'+
    '</div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('owner');
}

// ══════════════════════════════
// DEV PANEL
// ══════════════════════════════
function showDevPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=pHeader('⚙️ Developer Panel','#e040fb')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    sCard(sTitle('📢 Global Announcement','#e040fb')+
      '<input id="apAnnounce" placeholder="Message (disappears after 24h)..." style="'+iS()+'">'+
      '<button onclick="apSendAnnouncement()" style="'+bS('#e040fb','#fff')+'width:100%;padding:9px;">Send Announcement</button>')+
    sCard(sTitle('💬 Message User','#e040fb')+
      '<input id="ownerMsgU" placeholder="Username..." style="'+iS()+'">'+
      '<input id="ownerMsgT" placeholder="Message..." style="'+iS()+'">'+
      '<button onclick="ownerSendMessage()" style="'+bS('#00d4ff','#000')+'width:100%;padding:9px;">Send Message</button>')+
    sCard(sTitle('👁️ View & Moderate Chats','#e040fb')+
      '<button onclick="staffViewChats()" style="'+bS('#e040fb','#fff')+'width:100%;padding:9px;">Open Chat Monitor</button>')+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('developer');
}

// ══════════════════════════════
// ADMIN PANEL
// ══════════════════════════════
function showAdminPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=pHeader('🛡️ Admin Panel','#00d4ff')+
    '<div id="apStats" style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;"></div>'+
    sCard('<div style="font-size:.82rem;color:#7878a0;">Admins can ban/kick regular users, watch, view live game, manage games. Cannot affect Mods+.</div>')+
    sCard(sTitle('👁️ View & Moderate Chats','#00d4ff')+
      '<button onclick="staffViewChats()" style="'+bS('#00d4ff','#000')+'width:100%;padding:9px;">Open Chat Monitor</button>')+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '<div style="font-weight:900;font-size:.92rem;margin:18px 0 9px;">🎮 Manage Games</div>'+
    '<div id="apGameList">'+renderAdminGameRows()+'</div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('admin');
}

// ══════════════════════════════
// MOD PANEL
// ══════════════════════════════
function showModPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=pHeader('🔨 Mod Panel','#8e24aa')+
    sCard('<div style="font-size:.82rem;color:#7878a0;">Mods can kick from game, kick off site, view users. Contact Admin or Dev for bans.</div>')+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 All Users</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('mod');
}

// ══════════════════════════════
// HELPER PANEL
// ══════════════════════════════
function showHelperPanel(){
  var ex=document.getElementById('rolePanel');if(ex){ex.remove();return;}
  var html=pHeader('🤝 Helper Panel','#43a047')+
    sCard('<div style="font-size:.82rem;color:#7878a0;">Helpers can ping Admins and Developers.</div>')+
    sCard(sTitle('🔔 Ping Staff','#43a047')+
      '<input id="helperPingMsg" placeholder="Describe the issue..." style="'+iS()+'">'+
      '<div style="display:flex;gap:7px;">'+
      '<button onclick="helperPingAdmins()" style="'+bS('#00d4ff','#000')+'flex:1;padding:9px;">Ping Admins</button>'+
      '<button onclick="helperPingDevs()" style="'+bS('#e040fb','#fff')+'flex:1;padding:9px;">Ping Devs</button>'+
      '</div>')+
    '<div style="font-weight:900;font-size:.92rem;margin-bottom:9px;">👥 Users (View Only)</div>'+
    '<input id="apSearch" type="text" placeholder="Search users..." oninput="apFilterUsers(this.value)" style="'+iS()+'">'+
    '<div id="apUserList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>';
  var p=panelWrap(html);document.body.appendChild(p);
  loadPanelUsers('helper');
}

// ══════════════════════════════
// CHAT MONITOR
// ══════════════════════════════
function staffViewChats(){
  var ex=document.getElementById('chatMonitorPanel');if(ex){ex.remove();return;}
  var panel=document.createElement('div');
  panel.id='chatMonitorPanel';
  panel.style.cssText='position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,0.98);overflow-y:auto;font-family:Nunito,sans-serif;color:#e8e8f0;';
  panel.innerHTML=
    '<div style="max-width:650px;margin:0 auto;padding:16px 14px 80px;">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:rgba(0,0,0,0.98);padding:12px 0;z-index:10;border-bottom:1px solid #2e2e3e;margin-bottom:14px;">'+
      '<h2 style="color:#00d4ff;font-size:1.1rem;font-weight:900;margin:0;">👁️ Chat Monitor</h2>'+
      '<button onclick="document.getElementById(\'chatMonitorPanel\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">✕ Close</button>'+
    '</div>'+
    '<div id="chatMonitorList"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
    '</div>';
  document.body.appendChild(panel);
  db.collection('chats').orderBy('lastMsgTs','desc').limit(50).get().then(function(snap){
    var list=document.getElementById('chatMonitorList');if(!list)return;
    if(snap.empty){list.innerHTML='<div style="color:#7878a0;padding:12px;">No chats found.</div>';return;}
    list.innerHTML='';
    snap.forEach(function(doc){
      var chat=doc.data();
      var div=document.createElement('div');
      div.style.cssText='background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:11px 13px;margin-bottom:8px;cursor:pointer;';
      div.innerHTML=
        '<div style="font-weight:900;font-size:.88rem;">'+(chat.name||'Direct Chat')+
          (chat.isGroup?' <span style="font-size:.62rem;background:#e040fb;color:#fff;padding:1px 6px;border-radius:4px;">GROUP</span>':'')+
        '</div>'+
        '<div style="font-size:.74rem;color:#aaa;margin-top:3px;">'+
          ((chat.memberNames||[]).slice(0,5).map(function(n){return'@'+n;}).join(', '))+
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
      '<h2 style="color:#00d4ff;font-size:1rem;font-weight:900;margin:0;">'+escHtml(chatName)+'</h2>'+
      '<button onclick="document.getElementById(\'staffChatView\').remove()" style="background:#2e2e3e;border:none;color:#e8e8f0;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;font-weight:900;">← Back</button>'+
    '</div>'+
    '<div id="staffMsgs"><div style="color:#7878a0;padding:12px;">Loading...</div></div>'+
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
            '<div style="font-size:.84rem;color:#e8e8f0;margin-top:2px;">'+(m.deleted?'<i style="opacity:.4;">deleted</i>':escHtml(m.text||''))+'</div>'+
          '</div>'+
          (!m.deleted?'<button onclick="staffDeleteMsg(\''+chatId+'\',\''+msgDoc.id+'\')" style="'+bS('#ff4757','#fff')+'padding:4px 8px;flex-shrink:0;">🗑</button>':'');
        container.appendChild(row);
      });
    });
}

function staffDeleteMsg(chatId,msgId){
  if(!confirm('Delete this message?'))return;
  db.collection('chats').doc(chatId).collection('messages').doc(msgId).update({deleted:true,text:''})
    .then(function(){showNotifToast('Message deleted.','info');});
}

// ══════════════════════════════
// LOAD PANEL USERS
// ══════════════════════════════
function loadPanelUsers(viewerRole){
  db.collection('users').orderBy('createdAt','desc').get().then(function(snap){
    var users=[];
    snap.forEach(function(doc){users.push(Object.assign({uid:doc.id},doc.data()));});
    renderPanelUsers(users,viewerRole);
    var sd=document.getElementById('apStats');
    if(sd){
      sd.innerHTML=
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;">'+
          '<div style="font-size:1.6rem;font-weight:900;color:#FFD700;">'+users.length+'</div>'+
          '<div style="font-size:.7rem;color:#888;font-weight:700;">Total Users</div></div>'+
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;">'+
          '<div style="font-size:1.6rem;font-weight:900;color:#ff4757;">'+users.filter(function(u){return u.banned;}).length+'</div>'+
          '<div style="font-size:.7rem;color:#888;font-weight:700;">Banned</div></div>'+
        '<div style="background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:12px 18px;text-align:center;">'+
          '<div style="font-size:1.6rem;font-weight:900;color:#ff6b35;">'+_blockedGames.length+'</div>'+
          '<div style="font-size:.7rem;color:#888;font-weight:700;">Blocked Games</div></div>';
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
    var outranks=!isSelf&&myRank>uRank;
    var statusColor=isBanned?'#ff4757':isTempBanned?'#ff6b35':isSelf?'#2ed573':'#00d4ff';
    var statusLabel=isBanned?'BANNED':isTempBanned?'TEMP BAN':isSelf?'YOU':'ACTIVE';
    var canBan=outranks&&(viewerRole==='owner'||viewerRole==='admin')&&uRank<2;
    var canTempBan=outranks&&(viewerRole==='owner'||viewerRole==='developer');
    var canKick=outranks&&['owner','developer','admin','mod'].includes(viewerRole);
    var canKickSite=canKick;
    var canView=myRank>0;
    var canWatch=myRank>=3;
    var btns='';
    if(canBan){btns+=isBanned
      ?'<button onclick="apUnban(\''+u.uid+'\')" style="'+bS('#2ed573','#000')+'">Unban</button>'
      :'<button onclick="apBan(\''+u.uid+'\')" style="'+bS('#ff4757','#fff')+'">Ban</button>';}
    if(canTempBan&&!isBanned)btns+='<button onclick="quickTempBan(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#ff6b35','#fff')+'">Temp</button>';
    if(canKick)btns+='<button onclick="apKick(\''+u.uid+'\')" style="'+bS('#e65100','#fff')+'">Kick</button>';
    if(canKickSite)btns+='<button onclick="apKickSite(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#c62828','#fff')+'">Site</button>';
    if(canView)btns+='<button onclick="panelViewUser(\''+u.uid+'\')" style="'+bS('#1e90ff','#fff')+'">View</button>';
    if(canWatch)btns+='<button onclick="panelWatchUser(\''+u.uid+'\',\''+u.username+'\')" style="'+bS('#9c27b0','#fff')+'">Watch</button>';
    var gameTag=u.currentGame?'<div style="font-size:.67rem;color:#2ed573;">▶ '+escHtml(u.currentGame)+'</div>':'';
    return'<div class="ap-row" data-username="'+(u.usernameLower||'')+'" style="display:flex;align-items:center;gap:9px;background:#1a1a24;border:1px solid #2e2e3e;border-radius:10px;padding:9px 11px;margin-bottom:7px;flex-wrap:wrap;">'+
      '<div style="width:38px;height:38px;border-radius:50%;background:'+statusColor+';color:#000;display:flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;overflow:hidden;">'+
        (u.pfp?'<img src="'+u.pfp+'" style="width:100%;height:100%;object-fit:cover;">':(u.username||'?')[0].toUpperCase())+
      '</div>'+
      '<div style="flex:1;min-width:0;">'+
        '<div style="font-weight:900;font-size:.86rem;">@'+(u.username||'?')+
          ' <span style="font-size:.58rem;background:'+statusColor+';color:#000;padding:1px 7px;border-radius:4px;font-weight:900;">'+statusLabel+'</span>'+
          getRoleBadgeHtml(uRole)+'</div>'+
        '<div style="font-size:.7rem;color:#aaa;">'+(u.email||'')+'</div>'+
        gameTag+
      '</div>'+
      (btns?'<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;">'+btns+'</div>':'')+
    '</div>';
  }).join('');
}

function apFilterUsers(q){
  document.querySelectorAll('#apUserList .ap-row').forEach(function(r){
    var un=r.getAttribute('data-username')||'';
    r.style.display=(!q||un.includes(q.toLowerCase()))?'':'none';
  });
}

// ══════════════════════════════
// VIEW — live game
// ══════════════════════════════
function panelViewUser(uid){
  var ex=document.getElementById('viewPanel');if(ex){ex.remove();return;}
  var vp=document.createElement('div');
  vp.id='viewPanel';
  vp.style.cssText='position:fixed;bottom:70px;left:16px;z-index:4000;background:#1a1a24;border:2px solid #1e90ff;border-radius:14px;padding:14px 16px;min-width:240px;max-width:300px;font-family:Nunito,sans-serif;color:#e8e8f0;box-shadow:0 4px 24px rgba(0,0,0,.8);';
  vp.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
      '<div style="font-weight:900;font-size:.86rem;color:#1e90ff;">🎮 Live View</div>'+
      '<button onclick="document.getElementById(\'viewPanel\').remove()" style="background:none;border:none;color:#aaa;cursor:pointer;">✕</button>'+
    '</div>'+
    '<div id="viewContent" style="font-size:.82rem;color:#aaa;">Loading...</div>';
  document.body.appendChild(vp);
  db.collection('users').doc(uid).onSnapshot(function(doc){
    var vc=document.getElementById('viewContent');
    if(!vc||!doc.exists){return;}
    var u=doc.data();
    var gameHtml=u.currentGame
      ?'<div style="background:#0f3020;border:1.5px solid #2ed573;border-radius:9px;padding:9px 11px;margin-top:7px;font-weight:900;color:#2ed573;">▶ '+escHtml(u.currentGame)+'</div>'
      :'<div style="color:#7878a0;margin-top:7px;">Not playing right now.</div>';
    vc.innerHTML=
      '<div style="font-weight:900;font-size:.86rem;">@'+escHtml(u.username||'?')+'</div>'+
      '<div style="font-size:.68rem;color:#7878a0;margin-bottom:4px;">Last seen: '+timeAgo(u.lastSeen)+'</div>'+
      gameHtml;
  });
}

// ══════════════════════════════
// WATCH — full panel + kick
// ══════════════════════════════
function panelWatchUser(uid,username){
  var ex=document.getElementById('watchPanel');if(ex){ex.remove();return;}
  var wp=document.createElement('div');
  wp.id='watchPanel';
  wp.style.cssText='position:fixed;bottom:70px;right:16px;z-index:4000;background:#1a1a24;border:2px solid #9c27b0;border-radius:14px;padding:14px 16px;min-width:240px;max-width:300px;font-family:Nunito,sans-serif;color:#e8e8f0;box-shadow:0 4px 24px rgba(0,0,0,.8);';
  wp.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
      '<div style="font-weight:900;font-size:.86rem;color:#9c27b0;">👁 Watching @'+escHtml(username)+'</div>'+
      '<button onclick="document.getElementById(\'watchPanel\').remove()" style="background:none;border:none;color:#aaa;cursor:pointer;">✕</button>'+
    '</div>'+
    '<div id="watchContent" style="font-size:.8rem;color:#aaa;">Loading...</div>'+
    '<div style="display:flex;gap:7px;margin-top:10px;">'+
      '<button onclick="apKick(\''+uid+'\')" style="'+bS('#e65100','#fff')+'flex:1;padding:8px;">Kick Game</button>'+
      '<button onclick="apKickSite(\''+uid+'\',\''+username+'\')" style="'+bS('#c62828','#fff')+'flex:1;padding:8px;">Kick Site</button>'+
    '</div>';
  document.body.appendChild(wp);
  db.collection('users').doc(uid).onSnapshot(function(doc){
    var wc=document.getElementById('watchContent');
    if(!wc||!doc.exists)return;
    var u=doc.data();
    wc.innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">'+
        '<div style="background:#0f0f13;border-radius:8px;padding:7px;"><div style="font-size:.64rem;color:#7878a0;">Status</div><div style="font-weight:900;font-size:.8rem;color:'+(u.banned?'#ff4757':'#2ed573')+'">'+(u.banned?'BANNED':'Active')+'</div></div>'+
        '<div style="background:#0f0f13;border-radius:8px;padding:7px;"><div style="font-size:.64rem;color:#7878a0;">Games</div><div style="font-weight:900;font-size:.8rem;">'+(u.gamesPlayed||0)+'</div></div>'+
      '</div>'+
      (u.currentGame
        ?'<div style="background:#0f3020;border:1px solid #2ed573;border-radius:8px;padding:8px;font-size:.8rem;color:#2ed573;font-weight:900;">▶ '+escHtml(u.currentGame)+'</div>'
        :'<div style="color:#7878a0;font-size:.78rem;">Not playing right now.</div>');
  });
}

// ══════════════════════════════
// STAFF ACTIONS
// ══════════════════════════════
function ownerSendMessage(){
  var un=(document.getElementById('ownerMsgU').value||'').trim().toLowerCase();
  var msg=(document.getElementById('ownerMsgT').value||'').trim();
  if(!un||!msg){showNotifToast('Fill in both fields!','warning');return;}
  db.collection('users').where('usernameLower','==',un).get().then(function(snap){
    if(snap.empty){showNotifToast('User not found!','warning');return;}
    sendNotification(snap.docs[0].id,getUserRole(currentUser)==='owner'?'👑 @'+currentUser.username+': '+msg:'⚙️ @'+currentUser.username+': '+msg,'message');
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
    sendNotification(uid,{developer:'⚙️ Promoted to Developer!',admin:'🛡️ Promoted to Admin!',
      mod:'🔨 Promoted to Mod!',helper:'🤝 Made a Helper!',user:'Your staff role was removed.'}[newRole]||'Role updated.','info');
    var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
  });
}

function ownerTempBan(){
  var un=(document.getElementById('tempBanU').value||'').trim().toLowerCase();
  var hrs=parseInt(document.getElementById('tempBanDur').value||'1');
  if(!un){showNotifToast('Enter a username!','warning');return;}
  db.collection('users').where('usernameLower','==',un).get().then(function(snap){
    if(snap.empty){showNotifToast('User not found!','warning');return;}
    var until=new Date(Date.now()+hrs*3600*1000);
    db.collection('users').doc(snap.docs[0].id).update({
      tempBannedUntil:firebase.firestore.Timestamp.fromDate(until),
      kicked:firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(){
      sendNotification(snap.docs[0].id,'⏰ Temp banned for '+hrs+'h.','warning');
      document.getElementById('tempBanU').value='';
      showNotifToast('Temp ban applied!','info');
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
    sendNotification(uid,'⏰ Temp banned for '+hrs+'h.','warning');
    showNotifToast('Temp ban applied!','info');
  });
}

function ownerBanAll(){
  if(!confirm('Ban ALL non-staff users?'))return;
  if(!confirm('FINAL WARNING. Continue?'))return;
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){if(getUserRole(doc.data())==='user')batch.update(doc.ref,{banned:true});});
    batch.commit();
  });
}

function ownerUnbanAll(){
  if(!confirm('Unban ALL users?'))return;
  db.collection('users').get().then(function(snap){
    var batch=db.batch();
    snap.forEach(function(doc){batch.update(doc.ref,{banned:false,tempBannedUntil:null});});
    batch.commit();
  });
}

function helperPingAdmins(){
  var msg=(document.getElementById('helperPingMsg').value||'').trim();
  if(!msg){showNotifToast('Describe the issue!','warning');return;}
  db.collection('users').where('role','in',['admin','developer','owner']).get().then(function(snap){
    snap.forEach(function(doc){sendNotification(doc.id,'🤝 Helper @'+currentUser.username+': '+msg,'warning');});
    document.getElementById('helperPingMsg').value='';
    showNotifToast('Admins pinged!','info');
  });
}

function helperPingDevs(){
  var msg=(document.getElementById('helperPingMsg').value||'').trim();
  if(!msg){showNotifToast('Describe the issue!','warning');return;}
  db.collection('users').where('role','in',['developer','owner']).get().then(function(snap){
    snap.forEach(function(doc){sendNotification(doc.id,'🤝 Helper @'+currentUser.username+': '+msg,'warning');});
    document.getElementById('helperPingMsg').value='';
    showNotifToast('Devs pinged!','info');
  });
}

function apBan(uid){
  db.collection('users').doc(uid).update({banned:true}).then(function(){
    sendNotification(uid,'You have been banned.','warning');
    var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
  });
}
function apUnban(uid){
  db.collection('users').doc(uid).update({banned:false,tempBannedUntil:null}).then(function(){
    sendNotification(uid,'Your ban has been lifted!','info');
    var p=document.getElementById('rolePanel');if(p)p.remove();showRolePanel();
  });
}
function apKick(uid){
  db.collection('users').doc(uid).update({kicked:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){sendNotification(uid,'You were kicked from your game.','warning');});
}
function apKickSite(uid,username){
  if(!confirm('Kick @'+username+' off the site?'))return;
  db.collection('users').doc(uid).update({kickedFromSite:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){sendNotification(uid,'You have been kicked off the site.','warning');showNotifToast('@'+username+' kicked!','info');});
}
function apSendAnnouncement(){
  var msg=(document.getElementById('apAnnounce').value||'').trim();
  if(!msg){showNotifToast('Type a message first!','warning');return;}
  sendGlobalNotification(msg,'update',currentUser.uid,currentUser.username,currentUser.pfp||null,getUserRole(currentUser));
  document.getElementById('apAnnounce').value='';
  showNotifToast('Announcement sent!','info');
}

function renderAdminGameRows(){
  if(typeof GAMES==='undefined')return'<div style="color:#7878a0;font-size:.8rem;">Games data not loaded.</div>';
  return GAMES.map(function(g){
    var isBlocked=_blockedGames.includes(g.id);
    return'<div style="display:flex;align-items:center;gap:10px;background:#13131c;border:1px solid #2e2e3e;border-radius:9px;padding:8px 12px;margin-bottom:7px;">'+
      '<img src="'+g.thumb+'" style="width:36px;height:36px;border-radius:7px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">'+
      '<div style="flex:1;font-weight:900;font-size:.86rem;">'+escHtml(g.name)+'</div>'+
      (isBlocked
        ?'<span style="color:#ff4757;font-size:.72rem;margin-right:5px;">BLOCKED</span><button onclick="apUnblockGame(\''+g.id+'\')" style="'+bS('#2ed573','#000')+'">Unblock</button>'
        :'<button onclick="apBlockGame(\''+g.id+'\')" style="'+bS('#ff6b35','#fff')+'">Block</button>')+
    '</div>';
  }).join('');
}
function apBlockGame(id){
  var b=_blockedGames.slice();if(!b.includes(id))b.push(id);
  saveBlockedGames(b);
}
function apUnblockGame(id){
  saveBlockedGames(_blockedGames.filter(function(b){return b!==id;}));
}

// ══════════════════════════════
// KICK/BAN LISTENER
// ══════════════════════════════
function listenForKick(uid){
  db.collection('users').doc(uid).onSnapshot(function(doc){
    if(!doc.exists)return;
    var d=doc.data();
    if(d.banned){clearSession();auth.signOut();alert('You have been banned.');location.reload();return;}
    if(d.tempBannedUntil&&d.tempBannedUntil.toMillis&&d.tempBannedUntil.toMillis()>Date.now()){
      clearSession();auth.signOut();
      alert('⏰ Temp banned for '+Math.ceil((d.tempBannedUntil.toMillis()-Date.now())/3600000)+' more hour(s).');
      location.reload();return;
    }
    if(d.kickedFromSite&&d.kickedFromSite.toMillis&&Date.now()-d.kickedFromSite.toMillis()<15000){
      clearSession();auth.signOut();alert('You have been kicked off the site.');location.reload();return;
    }
    if(d.kicked&&d.kicked.toMillis&&Date.now()-d.kicked.toMillis()<10000){
      showNotifToast('You were kicked from your game.','warning');closeInPage();
    }
  });
}

// ══════════════════════════════
// GAME POPUP + LAUNCH
// ══════════════════════════════
function openPopup(game){
  if(_blockedGames.includes(game.id)){showNotifToast('This game is blocked by staff.','warning');return;}
  currentGame=game;
  var thumb=document.getElementById('popupThumb');
  if(thumb){thumb.src=game.thumb;thumb.style.display='block';thumb.onerror=function(){this.style.display='none';};}
  var pt=document.getElementById('popupTitle');if(pt)pt.textContent=game.name;
  var pd=document.getElementById('popupDesc');if(pd)pd.textContent=game.desc||'';
  var gp=document.getElementById('gamePopup');if(gp)gp.classList.remove('hidden');
}

function closePopup(){
  var gp=document.getElementById('gamePopup');if(gp)gp.classList.add('hidden');
  currentGame=null;
}

function launchGame(mode){
  if(!currentGame)return;
  saveHistory(currentGame);
  var name=currentGame.name,url=currentGame.url;
  if(currentUser){
    db.collection('users').doc(currentUser.uid).update({currentGame:name}).catch(function(){});
  }
  if(mode==='iframe'){
    closePopup();
    var ipt=document.getElementById('inPageTitle');if(ipt)ipt.textContent=name;
    var ipf=document.getElementById('inPageFrame');if(ipf)ipf.src=url;
    var ipg=document.getElementById('inPageGame');if(ipg)ipg.classList.remove('hidden');
    var nb=document.getElementById('navbar');if(nb)nb.style.display='none';
    var bnv=document.getElementById('bnavBar');if(bnv)bnv.style.display='none';
  } else if(mode==='blank'||mode==='blankfull'){
    var w=window.open('about:blank','_blank');
    if(!w){alert('Allow pop-ups to use this mode!');return;}
    w.document.write('<!DOCTYPE html><html><head><title>'+name+'</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}iframe{position:fixed;inset:0;width:100%;height:100%;border:none}</style></head><body><iframe src="'+url+'" allow="autoplay;fullscreen;gamepad" allowfullscreen></iframe></body></html>');
    w.document.close();closePopup();
  } else if(mode==='fullscreen'){
    closePopup();
    var ipt2=document.getElementById('inPageTitle');if(ipt2)ipt2.textContent=name;
    var ipf2=document.getElementById('inPageFrame');if(ipf2)ipf2.src=url;
    var ipg2=document.getElementById('inPageGame');if(ipg2)ipg2.classList.remove('hidden');
    var nb2=document.getElementById('navbar');if(nb2)nb2.style.display='none';
    var bnv2=document.getElementById('bnavBar');if(bnv2)bnv2.style.display='none';
    setTimeout(function(){
      var el=document.getElementById('inPageFrame');
      if(!el)return;
      if(el.requestFullscreen)el.requestFullscreen();
      else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();
    },300);
  }
}

function closeInPage(){
  var ipg=document.getElementById('inPageGame');if(ipg)ipg.classList.add('hidden');
  var ipf=document.getElementById('inPageFrame');if(ipf)ipf.src='';
  var nb=document.getElementById('navbar');if(nb)nb.style.display='flex';
  var bnv=document.getElementById('bnavBar');if(bnv)bnv.style.display='flex';
  if(currentUser){db.collection('users').doc(currentUser.uid).update({currentGame:null}).catch(function(){});}
}

function saveHistory(game){
  if(!currentUser)return;
  var h={id:game.id,name:game.name,thumb:game.thumb,color:game.color,ts:Date.now()};
  var history=(currentUser.history||[]).filter(function(x){return x.id!==game.id;});
  history.unshift(h);if(history.length>12)history=history.slice(0,12);
  currentUser.history=history;
  currentUser.gamesPlayed=(currentUser.gamesPlayed||0)+1;
  db.collection('users').doc(currentUser.uid).update({
    history:history,
    gamesPlayed:firebase.firestore.FieldValue.increment(1),
    lastSeen:firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function(){});
  var row=document.getElementById('continueRow');
  var sec=document.getElementById('continueSection');
  if(row&&sec){
    sec.style.display='block';row.innerHTML='';
    history.forEach(function(h){
      var g=GAMES.find(function(g){return g.id===h.id;});
      if(g)row.appendChild(makeCard(g));
    });
  }
}

// ══════════════════════════════
// RENDER GAMES
// ══════════════════════════════
function renderUserPage(user){
  try{
    var cont=document.getElementById('continueSection');
    var row=document.getElementById('continueRow');
    if(cont&&row&&user.history&&user.history.length>0){
      cont.style.display='block';row.innerHTML='';
      user.history.forEach(function(h){
        var g=GAMES.find(function(g){return g.id===h.id;});
        if(g)row.appendChild(makeCard(g));
      });
    }
    var hotRow=document.getElementById('hotRow');
    if(hotRow){
      hotRow.innerHTML='';
      GAMES.filter(function(g){return g.hot;}).forEach(function(g){hotRow.appendChild(makeCard(g));});
    }
    var grid=document.getElementById('allGrid');
    if(grid){
      grid.innerHTML='';
      GAMES.forEach(function(g){grid.appendChild(makeCard(g));});
    }
  }catch(e){console.warn('renderUserPage error',e);}
}

function renderGuestGrid(){
  try{
    var grid=document.getElementById('guestGrid');if(!grid)return;
    grid.innerHTML='';
    GAMES.forEach(function(g){grid.appendChild(makeGuestCard(g));});
  }catch(e){console.warn('renderGuestGrid error',e);}
}

function makeCard(game){
  var isBlocked=_blockedGames.includes(game.id);
  var div=document.createElement('div');
  div.className='game-card'+(isBlocked?' card-blocked':'');
  div.setAttribute('data-name',game.name.toLowerCase());
  var badge=game.hot?'<span class="card-badge badge-hot">HOT</span>':game.isNew?'<span class="card-badge badge-new">NEW</span>':'';
  var bo=isBlocked?'<div class="blocked-overlay"><div class="blocked-text">🚫 Blocked</div></div>':'';
  div.innerHTML=
    '<div class="card-thumb" style="background:'+game.color+'">'+
      '<img src="'+game.thumb+'" alt="'+escHtml(game.name)+'" onerror="this.style.display=\'none\'">'+
      badge+bo+
    '</div>'+
    '<div class="card-body"><div class="card-name">'+escHtml(game.name)+'</div></div>';
  if(!isBlocked)div.addEventListener('click',function(){openPopup(game);});
  return div;
}

function makeGuestCard(game){
  var isBlocked=_blockedGames.includes(game.id);
  var div=document.createElement('div');
  div.className='c6x-card';
  var bo=isBlocked?'<div class="blocked-overlay"><div class="blocked-text">🚫 Blocked</div></div>':'';
  div.innerHTML=
    '<div class="c6x-thumb" style="background:'+game.color+'">'+
      '<img src="'+game.thumb+'" alt="'+escHtml(game.name)+'" onerror="this.style.display=\'none\'">'+bo+
    '</div>'+
    '<div class="c6x-name">'+escHtml(game.name)+'</div>';
  if(!isBlocked)div.addEventListener('click',function(){openPopup(game);});
  return div;
}

function filterGames(){
  try{
    var q=(document.getElementById('searchInput').value||'').toLowerCase().trim();
    var none=true;
    document.querySelectorAll('#allGrid .game-card').forEach(function(c){
      var show=!q||(c.getAttribute('data-name')||'').includes(q);
      c.style.display=show?'':'none';
      if(show)none=false;
    });
    var nr=document.getElementById('noResults');
    if(nr)nr.style.display=(q&&none)?'block':'none';
  }catch(e){}
}

// ══════════════════════════════
// UTILS
// ══════════════════════════════
function timeAgo(ts){
  if(!ts)return'Never';
  var d=(Date.now()-(ts.toMillis?ts.toMillis():ts))/1000;
  if(d<60)return'Just now';
  if(d<3600)return Math.floor(d/60)+'m ago';
  if(d<86400)return Math.floor(d/3600)+'h ago';
  return Math.floor(d/86400)+'d ago';
}
function escHtml(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      }
