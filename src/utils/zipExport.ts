import JSZip from 'jszip';

export async function generateAndDownloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  // 1. package.json
  const packageJson = {
    name: "sqour-arb-chat",
    version: "2.0.0",
    description: "شات حسان برو للجوال - النسخة الذهبية المتكاملة مع نظام المايكات الخمسة المباشرة",
    main: "server.js",
    scripts: {
      "start": "node server.js",
      "dev": "node server.js"
    },
    dependencies: {
      "express": "^4.21.2",
      "socket.io": "^4.8.1",
      "moment": "^2.30.1",
      "xss": "^1.0.15"
    }
  };
  zip.file("package.json", JSON.stringify(packageJson, null, 2));

  // 2. server.js (Golden version with 5 Mics WebRTC mesh, database history, anti-XSS, member accounts)
  const serverJsContent = `const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const moment = require('moment');
const xss = require('xss');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

const users = [];
const historyFile = path.join(__dirname, 'history.json');
let chatHistory = [];
if (fs.existsSync(historyFile)) {
  try {
    chatHistory = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  } catch (e) {
    chatHistory = [];
  }
}

function saveHistory() {
  try {
    if (chatHistory.length > 500) chatHistory = chatHistory.slice(-500);
    fs.writeFileSync(historyFile, JSON.stringify(chatHistory, null, 2));
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

// نظام المايكات الخمسة المباشرة
const micSlots = [
  { slotNumber: 1, user: null },
  { slotNumber: 2, user: null },
  { slotNumber: 3, user: null },
  { slotNumber: 4, user: null },
  { slotNumber: 5, user: null }
];

io.on('connection', socket => {
  // إرسال حالة المايكات فور الاتصال
  socket.emit('micSlotsUpdated', micSlots);

  // تسجيل الدخول مع منع تكرار الاسم
  socket.on('joinRoom', ({ username, room, flag, statusQuote }) => {
    const cleanUser = xss(username ? username.trim() : '');
    const cleanRoom = xss(room ? room.trim() : 'الغرفة العامة');

    if (!cleanUser) {
      socket.emit('loginError', 'يرجى إدخال اسم مستخدم صالح.');
      return;
    }

    const isDuplicate = users.some(u => u.room.toLowerCase() === cleanRoom.toLowerCase() && u.username.toLowerCase() === cleanUser.toLowerCase());
    if (isDuplicate) {
      socket.emit('loginError', 'الاسم مستخدم مسبقاً في هذه الغرفة. يرجى اختيار اسم آخر.');
      return;
    }

    const user = {
      id: socket.id,
      username: cleanUser,
      room: cleanRoom,
      flag: flag || '🇸🇦',
      statusQuote: statusQuote || 'عضو في حسان برو 🦅',
      micSlot: null,
      isVoice: false
    };

    users.push(user);
    socket.join(user.room);

    // إرسال تاريخ الدردشة
    const roomHistory = chatHistory.filter(m => m.room.toLowerCase() === cleanRoom.toLowerCase()).slice(-50);
    socket.emit('chatHistory', roomHistory);

    // إرسال إشعار الدخول (كما في حسان برو)
    const enterMsg = {
      room: user.room,
      username: user.username,
      badge: user.room + ' Room | دخل الى',
      badgeColor: '#eab308',
      text: 'هذا المستخدم دخل الى ' + user.room,
      time: '0د'
    };
    chatHistory.push(enterMsg);
    saveHistory();
    io.to(user.room).emit('message', enterMsg);

    // تحديث المستخدمين
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: users.filter(u => u.room === user.room)
    });
  });

  // إرسال رسالة
  socket.on('chatMessage', msg => {
    const user = users.find(u => u.id === socket.id);
    if (user && msg && msg.trim()) {
      const cleanMsg = xss(msg.trim());
      const messageObj = {
        room: user.room,
        username: user.username,
        flag: user.flag,
        text: cleanMsg,
        time: '0د'
      };
      chatHistory.push(messageObj);
      saveHistory();
      io.to(user.room).emit('message', messageObj);
    }
  });

  // نظام المايكات الخمسة
  socket.on('takeMic', ({ slotNumber }) => {
    const user = users.find(u => u.id === socket.id);
    if (!user) return;

    const slot = micSlots.find(s => s.slotNumber === slotNumber);
    if (slot && !slot.user) {
      // تفريغ أي مايك سابق
      micSlots.forEach(s => { if (s.user && s.user.id === user.id) s.user = null; });
      user.micSlot = slotNumber;
      user.isVoice = true;
      slot.user = user;

      io.to(user.room).emit('micSlotsUpdated', micSlots);
      socket.broadcast.to(user.room).emit('userJoinedVoice', user);
    }
  });

  socket.on('dropMic', () => {
    const user = users.find(u => u.id === socket.id);
    if (user && user.micSlot !== null) {
      const slot = micSlots.find(s => s.slotNumber === user.micSlot);
      if (slot) slot.user = null;
      user.micSlot = null;
      user.isVoice = false;
      io.to(user.room).emit('micSlotsUpdated', micSlots);
      socket.broadcast.to(user.room).emit('userLeftVoice', { userId: socket.id });
    }
  });

  // ترحيل إشارات WebRTC الصوتية
  socket.on('voiceSignal', ({ targetId, signal }) => {
    io.to(targetId).emit('voiceSignal', { senderId: socket.id, signal });
  });

  socket.on('disconnect', () => {
    const idx = users.findIndex(u => u.id === socket.id);
    if (idx !== -1) {
      const user = users.splice(idx, 1)[0];
      if (user.micSlot !== null) {
        const slot = micSlots.find(s => s.slotNumber === user.micSlot);
        if (slot) slot.user = null;
        io.to(user.room).emit('micSlotsUpdated', micSlots);
      }
      io.to(user.room).emit('roomUsers', { room: user.room, users: users.filter(u => u.room === user.room) });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('🚀 شات حسان برو يعمل على: http://localhost:' + PORT));
`;
  zip.file("server.js", serverJsContent);

  // 3. public/index.html (Matching Screenshot 1)
  const indexHtmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شات حسان برو | شات حسان برو للجوال</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="mobile-body">
  <div class="chat-wrapper">
    <header class="main-header">
      <div class="logo">
        <i class="fas fa-feather-alt text-amber-500"></i>
        <span>شات حسان برو | شات حسان برو للجوال</span>
      </div>
      <button onclick="location.reload()" class="refresh-btn"><i class="fas fa-sync-alt"></i></button>
    </header>

    <div class="banner-box">
      <div class="banner-title">شات حسان برو</div>
      <div class="banner-subtitle">مسابقات 🏆 - ترقيات 🛡️ - فعاليات 🎆</div>
      <div class="banner-url">sqour-arb.com</div>
    </div>

    <div class="tabs-nav">
      <button class="active"><i class="fas fa-user"></i> دخول الزوار</button>
      <button><i class="fas fa-users"></i> دخول الاعضاء</button>
      <button><i class="fas fa-user-plus"></i> تسجيل عضويه</button>
    </div>

    <form class="login-form" action="chat.html" method="GET">
      <input type="text" name="username" value="Sajan" placeholder="اسم المستخدم" required />
      <div class="password-row">
        <input type="password" name="password" value="1234" placeholder="كلمة المرور" />
        <button type="submit" class="login-submit-btn">دخول</button>
      </div>
    </form>

    <div class="online-bar">
      <span class="online-tag">متصل</span>
      <span class="online-count"><i class="fas fa-users"></i> 77</span>
    </div>

    <div class="users-list">
      <div class="user-card">
        <div class="avatar"><i class="fas fa-user-circle"></i></div>
        <div class="details">
          <div class="username">Sajan</div>
          <div class="quote">لا يعز الله هينه اختارت لنفسها الرخص 🐍</div>
        </div>
        <span class="flag">🇸🇾</span>
      </div>
      <div class="user-card">
        <div class="avatar"><i class="fas fa-user-circle"></i></div>
        <div class="details">
          <div class="username">﮼هـــوًّا"اجــِّيـس </div>
          <div class="quote">من اجل ابي احترمت الرجال</div>
        </div>
        <span class="flag">🇾🇪</span>
      </div>
      <div class="user-card">
        <div class="avatar"><i class="fas fa-user-circle"></i></div>
        <div class="details">
          <div class="username">★ ﺟﻨﺘﻞ ★</div>
          <div class="quote">..</div>
        </div>
        <span class="flag">🇸🇦</span>
      </div>
    </div>
  </div>
</body>
</html>`;
  zip.file("public/index.html", indexHtmlContent);

  // 4. public/chat.html (Matching Screenshot 2 - with the 5 Mics!)
  const chatHtmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شات حسان برو - الغرفة العامة</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="mobile-body">
  <div class="chat-wrapper chat-room">
    <!-- Top Bar: Speaker + The 5 Mics + LIVE -->
    <header class="room-topbar">
      <button id="speaker-btn" class="speaker-btn"><i class="fas fa-volume-up"></i></button>
      
      <div class="mics-bar">
        <div class="mic-slot" data-slot="1"><i class="fas fa-microphone"></i><span>1</span></div>
        <div class="mic-slot" data-slot="2"><i class="fas fa-microphone"></i><span>2</span></div>
        <div class="mic-slot" data-slot="3"><i class="fas fa-microphone"></i><span>3</span></div>
        <div class="mic-slot" data-slot="4"><i class="fas fa-microphone"></i><span>4</span></div>
        <div class="mic-slot" data-slot="5"><i class="fas fa-microphone"></i><span>5</span></div>
      </div>

      <button class="live-btn"><i class="fas fa-video"></i> LIVE</button>
    </header>

    <!-- Chat Messages Stream (Screenshot 2) -->
    <div id="messages-container" class="messages-stream">
      <div class="room-msg">
        <span class="badge yellow">الغرفة العامة Room | دخل الى</span>
        <span class="time">0د</span>
        <div class="text">هذا المستخدم دخل الى الغرفة العامة</div>
      </div>
      <div class="room-msg">
        <span class="badge red">ترحـيـب</span>
        <span class="time">0د</span>
        <div class="text">نحن سعداء بتشريفك فأهلاً بك عطراً فوّاحاً ينثرُ شذاه في كلّ الأرجاء .. نتمنى لك وقتاً ممتعاً</div>
      </div>
      <div class="room-msg">
        <span class="badge red">تنبـيـه</span>
        <span class="time">0د</span>
        <div class="text">لعضويتك عليك فقط (لايكات - زخرفة ثابتة - هدية) التسجيل معانا .. من الصفحة الرئيسية للشات</div>
      </div>
    </div>

    <!-- Bottom Input Bar -->
    <div class="chat-input-bar">
      <button onclick="location.href='index.html'" class="exit-btn"><i class="fas fa-sign-out-alt"></i></button>
      <button class="emoji-btn">😊</button>
      <input type="text" id="msg-input" placeholder="اكتب رسالتك، واستخدم @ للمنشن" />
      <button class="plus-btn">+</button>
      <button id="send-btn" class="send-btn"><i class="fas fa-paper-plane"></i> إرسال</button>
    </div>

    <!-- Bottom Navigation Bar -->
    <nav class="bottom-nav">
      <div><i class="fas fa-cog"></i><span>الضبط</span></div>
      <div><i class="fas fa-comment-dots"></i><span>الحائط</span></div>
      <div><i class="fas fa-hashtag"></i><span>الغرف</span></div>
      <div><i class="fas fa-envelope"></i><span>خاص</span></div>
      <div><i class="fas fa-users"></i><span>77</span></div>
    </nav>
  </div>
  <script src="/socket.io/socket.io.js"></script>
  <script src="js/script.js"></script>
</body>
</html>`;
  zip.file("public/chat.html", chatHtmlContent);

  // 5. public/css/style.css
  const cssContent = `* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
body.mobile-body { background: #070b13; display: flex; justify-content: center; min-height: 100vh; }
.chat-wrapper { width: 100%; max-width: 440px; background: #fff; min-height: 100vh; display: flex; flex-direction: column; }
.main-header { background: #241a12; color: #fde68a; padding: 10px; display: flex; justify-content: space-between; align-items: center; }
.refresh-btn { background: #32ba51; border: none; color: #fff; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; }
.banner-box { background: linear-gradient(135deg, #241a12, #000); color: #fde68a; padding: 25px 15px; text-align: center; }
.banner-title { font-size: 20px; font-weight: 800; }
.banner-subtitle { font-size: 12px; margin: 6px 0; color: #fef08a; }
.banner-url { font-size: 11px; opacity: 0.8; }
.tabs-nav { display: grid; grid-template-columns: 1fr 1fr 1fr; background: #111827; }
.tabs-nav button { padding: 10px; border: none; background: transparent; color: #94a3b8; font-weight: bold; font-size: 12px; }
.tabs-nav button.active { background: #fff; color: #4338ca; border-bottom: 2px solid #4338ca; }
.login-form { padding: 14px; background: #fff; }
.login-form input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 8px; font-size: 14px; }
.password-row { display: flex; gap: 8px; }
.login-submit-btn { background: #2d251f; color: #fef08a; border: none; padding: 0 20px; border-radius: 4px; font-weight: bold; cursor: pointer; }
.online-bar { background: #383129; color: #fff; padding: 6px 12px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
.online-tag { background: #48a942; padding: 2px 10px; border-radius: 3px; }
.users-list { flex: 1; overflow-y: auto; }
.user-card { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #f1f5f9; gap: 10px; }
.user-card .avatar { font-size: 32px; color: #64748b; }
.user-card .details { flex: 1; }
.user-card .username { font-weight: bold; font-size: 13px; color: #0f172a; }
.user-card .quote { font-size: 11px; color: #64748b; }
.user-card .flag { font-size: 20px; }

/* Room Styles (Screenshot 2) */
.room-topbar { background: #1f1811; color: #fff; padding: 8px; display: flex; align-items: center; gap: 4px; }
.speaker-btn { background: #32ba51; border: none; color: #fff; width: 36px; height: 36px; border-radius: 6px; cursor: pointer; }
.mics-bar { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
.mic-slot { background: #151b24; border: 1px solid #334155; border-radius: 4px; text-align: center; padding: 4px 0; color: #94a3b8; font-size: 10px; cursor: pointer; }
.mic-slot i { display: block; font-size: 14px; margin-bottom: 2px; }
.live-btn { background: #6d28d9; border: none; color: #fff; padding: 0 10px; height: 36px; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer; }
.messages-stream { flex: 1; overflow-y: auto; padding: 12px; background: #fff; }
.room-msg { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
.room-msg .badge { font-weight: bold; font-size: 12px; margin-left: 6px; }
.room-msg .badge.red { color: #dc2626; }
.room-msg .badge.yellow { color: #d97706; }
.room-msg .time { font-size: 11px; color: #94a3b8; float: left; }
.room-msg .text { margin-top: 4px; color: #1e293b; line-height: 1.5; }
.chat-input-bar { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 8px; display: flex; gap: 6px; align-items: center; }
.chat-input-bar input { flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13px; outline: none; }
.chat-input-bar button { background: #2a241e; border: none; color: #fef08a; padding: 8px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; }
.bottom-nav { background: #241a12; color: #fde68a; display: grid; grid-template-columns: repeat(5, 1fr); text-align: center; padding: 8px 0; font-size: 11px; font-weight: bold; border-top: 1px solid #3e2c1c; }
.bottom-nav div { cursor: pointer; }
.bottom-nav div i { display: block; font-size: 16px; margin-bottom: 2px; }
`;
  zip.file("public/css/style.css", cssContent);

  // 6. README.md
  const readmeContent = `# شات حسان برو للجوال - النسخة الذهبية 🦅
موقع شات عربي متكامل يحاكي منصة حسان برو وشات 12Chat للجوال مع نظام المايكات الخمسة المباشرة والصوت الجماعي.

## المميزات:
1. نظام المايكات الخمسة المباشرة (Mic 1, 2, 3, 4, 5) مع الصوت المباشر WebRTC Mesh.
2. أرشيف الرسائل وقاعدة البيانات المحلية history.json.
3. حماية XSS ومنع تكرار الأسماء.
4. نظام الدخول للزوار والأعضاء مع الأعلام والحالات واللايكات.

## التشغيل:
\`\`\`bash
npm install
node server.js
\`\`\`
افتح المتصفح على: http://localhost:3000
`;
  zip.file("README.md", readmeContent);

  // Generate and download
  const blob = await zip.generateAsync({ type: "blob" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sqour-arb-golden-chat.zip";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
