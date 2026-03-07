const GAMES = [
  {
    id: "ovo",
    name: "OvO",
    desc: "Fast parkour platformer. Run, jump and slide!",
    hot: true, isNew: false,
    url: "https://ubg98.github.io/OvO/",
    thumb: "https://i.imgur.com/6oGNGAK.png",
    color: "#1a1a2e"
  },
  {
    id: "run3",
    name: "Run 3",
    desc: "Sprint through endless space tunnels!",
    hot: true, isNew: false,
    url: "https://run3game.io/",
    thumb: "https://run3game.io/img/run3.png",
    color: "#0d1b2a"
  },
  {
    id: "slope",
    name: "Slope",
    desc: "Roll a neon ball, don't fall off!",
    hot: true, isNew: false,
    url: "https://slope-ball.github.io/",
    thumb: "https://i.imgur.com/3BJF9AZ.png",
    color: "#0a0020"
  },
  {
    id: "drifthunters",
    name: "Drift Hunters",
    desc: "Drift epic cars on wild tracks.",
    hot: false, isNew: false,
    url: "https://drifthunters.io/",
    thumb: "https://drifthunters.io/img/drifthunters.jpg",
    color: "#1a0500"
  },
  {
    id: "motox3m",
    name: "Moto X3M",
    desc: "Crazy motorcycle stunt tracks.",
    hot: false, isNew: false,
    url: "https://www.crazygames.com/embed/moto-x3m",
    thumb: "https://imgs.crazygames.com/moto-x3m_16x9/20240515114229/moto-x3m_16x9-cover?metadata=none&quality=85&width=400",
    color: "#1b0000"
  },
  {
    id: "cookieclicker",
    name: "Cookie Clicker",
    desc: "Click cookies, build an empire.",
    hot: false, isNew: false,
    url: "https://orteil.dashnet.org/cookieclicker/",
    thumb: "https://orteil.dashnet.org/cookieclicker/img/favicon.ico",
    color: "#3e1e00"
  },
  {
    id: "2048",
    name: "2048",
    desc: "Slide tiles and reach 2048!",
    hot: false, isNew: false,
    url: "https://play2048.co/",
    thumb: "https://play2048.co/meta/og-image.png",
    color: "#776e65"
  },
  {
    id: "geometrydash",
    name: "Geometry Dash",
    desc: "Jump to the beat through insane levels.",
    hot: true, isNew: false,
    url: "https://www.crazygames.com/embed/geometry-dash-lite",
    thumb: "https://imgs.crazygames.com/geometry-dash-lite_16x9/20240102120115/geometry-dash-lite_16x9-cover?metadata=none&quality=85&width=400",
    color: "#1a237e"
  },
  {
    id: "basketball",
    name: "Basketball Stars",
    desc: "1v1 basketball action.",
    hot: false, isNew: false,
    url: "https://www.crazygames.com/embed/basketball-stars",
    thumb: "https://imgs.crazygames.com/basketball-stars_16x9/20230822124733/basketball-stars_16x9-cover?metadata=none&quality=85&width=400",
    color: "#e65100"
  },
  {
    id: "retrobowl",
    name: "Retro Bowl",
    desc: "Manage and play your NFL team.",
    hot: false, isNew: true,
    url: "https://retrobowl.me/",
    thumb: "https://retrobowl.me/img/retrobowl.png",
    color: "#1b5e20"
  },
  {
    id: "snowrider",
    name: "Snow Rider 3D",
    desc: "Sled down snowy hills, dodge trees.",
    hot: false, isNew: true,
    url: "https://www.crazygames.com/embed/snow-rider-3d",
    thumb: "https://imgs.crazygames.com/snow-rider-3d_16x9/20231201093430/snow-rider-3d_16x9-cover?metadata=none&quality=85&width=400",
    color: "#0d47a1"
  },
  {
    id: "drivemad",
    name: "Drive Mad",
    desc: "Crazy physics car game.",
    hot: true, isNew: false,
    url: "https://www.crazygames.com/embed/drive-mad",
    thumb: "https://imgs.crazygames.com/drive-mad_16x9/20220926103400/drive-mad_16x9-cover?metadata=none&quality=85&width=400",
    color: "#212121"
  },
  {
    id: "monkeymart",
    name: "Monkey Mart",
    desc: "Run a supermarket as a monkey.",
    hot: false, isNew: true,
    url: "https://www.crazygames.com/embed/monkey-mart",
    thumb: "https://imgs.crazygames.com/monkey-mart_16x9/20220906155924/monkey-mart_16x9-cover?metadata=none&quality=85&width=400",
    color: "#f57f17"
  },
  {
    id: "clusterrush",
    name: "Cluster Rush",
    desc: "Jump across speeding trucks.",
    hot: false, isNew: true,
    url: "https://www.crazygames.com/embed/cluster-rush",
    thumb: "https://imgs.crazygames.com/cluster-rush_16x9/20211006155604/cluster-rush_16x9-cover?metadata=none&quality=85&width=400",
    color: "#4a148c"
  },
  {
    id: "happywheels",
    name: "Happy Wheels",
    desc: "Ragdoll physics chaos.",
    hot: false, isNew: false,
    url: "https://www.crazygames.com/embed/happy-wheels",
    thumb: "https://imgs.crazygames.com/happy-wheels_16x9/20231010093000/happy-wheels_16x9-cover?metadata=none&quality=85&width=400",
    color: "#880e4f"
  },
  {
    id: "idlebreakout",
    name: "Idle Breakout",
    desc: "Idle clicker breakout game.",
    hot: false, isNew: false,
    url: "https://kodiqi.com/idlebreakout/",
    thumb: "https://kodiqi.com/idlebreakout/icon.png",
    color: "#1a237e"
  },
  {
    id: "paperiov2",
    name: "Paper.io 2",
    desc: "Claim territory, cut rivals off.",
    hot: false, isNew: false,
    url: "https://www.crazygames.com/embed/paper-io-2",
    thumb: "https://imgs.crazygames.com/paper-io-2_16x9/20230209094103/paper-io-2_16x9-cover?metadata=none&quality=85&width=400",
    color: "#004d40"
  },
  {
    id: "ultrakill",
    name: "Ultrakill Demo",
    desc: "MANKIND IS DEAD. BLOOD IS FUEL. HELL IS FULL.",
    hot: true, isNew: true,
    url: "https://www.crazygames.com/embed/ultrakill",
    thumb: "ULTRAKILL_ICON",
    color: "#7f0000"
  },
  {
    id: "subway",
    name: "Subway Surfers",
    desc: "Run from the inspector!",
    hot: true, isNew: false,
    url: "https://www.crazygames.com/embed/subway-surfers",
    thumb: "https://imgs.crazygames.com/subway-surfers_16x9/20230404130228/subway-surfers_16x9-cover?metadata=none&quality=85&width=400",
    color: "#ff6d00"
  },
  {
    id: "minecraft",
    name: "Minecraft Classic",
    desc: "The original Minecraft in your browser!",
    hot: true, isNew: false,
    url: "https://classic.minecraft.net/",
    thumb: "https://www.minecraft.net/content/dam/games/minecraft/key-art/MC_Vanilla_Keyart_1280x768.jpg",
    color: "#4caf50"
  },
  {
    id: "amongus",
    name: "Among Us",
    desc: "Find the impostor among your crew!",
    hot: false, isNew: false,
    url: "https://www.crazygames.com/embed/among-us-online",
    thumb: "https://imgs.crazygames.com/among-us-online_16x9/20230928100208/among-us-online_16x9-cover?metadata=none&quality=85&width=400",
    color: "#c62828"
  },
  {
    id: "fnf",
    name: "Friday Night Funkin",
    desc: "Rhythm battle game!",
    hot: true, isNew: false,
    url: "https://www.crazygames.com/embed/friday-night-funkin",
    thumb: "https://imgs.crazygames.com/friday-night-funkin_16x9/20210702124038/friday-night-funkin_16x9-cover?metadata=none&quality=85&width=400",
    color: "#6a1b9a"
  },
  {
    id: "1v1lol",
    name: "1v1.LOL",
    desc: "Build and shoot in this battle royale!",
    hot: true, isNew: false,
    url: "https://www.crazygames.com/embed/1v1-lol",
    thumb: "https://imgs.crazygames.com/1v1-lol_16x9/20230928095614/1v1-lol_16x9-cover?metadata=none&quality=85&width=400",
    color: "#0d47a1"
  },
  {
    id: "shellshockers",
    name: "Shell Shockers",
    desc: "Egg-based FPS shooter!",
    hot: false, isNew: false,
    url: "https://shellshock.io/",
    thumb: "https://shellshock.io/img/ss-og.jpg",
    color: "#f57f17"
  },
  {
    id: "krunker",
    name: "Krunker.io",
    desc: "Fast paced browser FPS!",
    hot: false, isNew: false,
    url: "https://krunker.io/",
    thumb: "https://krunker.io/img/krunker_icon.png",
    color: "#212121"
  }
];
