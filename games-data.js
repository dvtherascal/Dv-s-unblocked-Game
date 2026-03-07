const GAMES = [
  {
    id: "ovo",
    name: "OvO",
    desc: "Fast parkour platformer. Run, jump and slide!",
    hot: true, isNew: false,
    url: "https://ubg98.github.io/OvO/",
    thumb: "https://play-lh.googleusercontent.com/v7KwGdPjJGjJjRXn46sck4DwDBdKSeRzGN44CjiXUtKV0jjOi51Bt4wcXud0m-SkXg",
    color: "#1a1a2e"
  },
  {
    id: "run3",
    name: "Run 3",
    desc: "Sprint through endless space tunnels!",
    hot: true, isNew: false,
    url: "https://run3game.io/",
    thumb: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co54z9.jpg",
    color: "#0d1b2a"
  },
  {
    id: "slope",
    name: "Slope",
    desc: "Roll a neon ball, don't fall off!",
    hot: true, isNew: false,
    url: "https://slope-ball.github.io/",
    thumb: "https://play-lh.googleusercontent.com/FFrKIqKVpB9HMpaaF0HUc5Sza5W2sM8GFZGfkddU39xPcKCa4BYXQghoWVGlQGpaAA=w526-h296-rw",
    color: "#0a0020"
  },
  {
    id: "drifthunters",
    name: "Drift Hunters",
    desc: "Drift epic cars on wild tracks.",
    hot: false, isNew: false,
    url: "https://drifthunters.io/",
    thumb: "https://imgs.crazygames.com/games/drift-hunters/cover-1656950639575.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    color: "#1a0500"
  },
  {
    id: "motox3m",
    name: "Moto X3M",
    desc: "Crazy motorcycle stunt tracks.",
    hot: false, isNew: false,
    url: "https://www.crazygames.com/embed/moto-x3m",
    thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDIPyyTpUGYaOTHiRolgG9HRcgYJxrdfHMC9IilRXoNHz4ql7oEXlru4s&s=10",
    color: "#1b0000"
  },
  {
    id: "cookieclicker",
    name: "Cookie Clicker",
    desc: "Click cookies, build an empire.",
    hot: false, isNew: false,
    url: "https://hub-pro.github.io/cookie/index.html",
    thumb: "https://play-lh.googleusercontent.com/Z1MOuuiD05ZN5LkVmMEvKF0mqAc-FknaQ2j8s4dZiO-LSPQX4EEA3RVJdlQEtxe96ok",
    color: "#3e1e00"
  },
  {
    id: "2048",
    name: "2048",
    desc: "Slide tiles and reach 2048!",
    hot: false, isNew: false,
    url: "https://play2048.co/",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/1/1a/2048_Icon.png",
    color: "#776e65"
  },
  {
    id: "geometrydash",
    name: "Geometry Dash",
    desc: "Jump to the beat through insane levels.",
    hot: true, isNew: false,
    url: "https://www.crazygames.com/embed/geometry-dash-lite",
    thumb: "https://m.media-amazon.com/images/I/61mVIP6Oo1L.png",
    color: "#1a237e"
  },
  {
    id: "basketball",
    name: "Basketball Stars",
    desc: "1v1 basketball action.",
    hot: false, isNew: false,
    url: "https://www.crazygames.com/embed/basketball-stars",
    thumb: "https://imgs.crazygames.com/games/basketball-stars-2019/cover-1583231506155.png?metadata=none&quality=100&width=1200&height=630&fit=crop",
    color: "#e65100"
  },
  {
    id: "retrobowl",
    name: "Retro Bowl",
    desc: "Manage and play your NFL team.",
    hot: false, isNew: true,
    url: "https://retrobowl.me/",
    thumb: "",
    color: "#1b5e20"
  },
  {
    id: "snowrider",
    name: "Snow Rider 3D",
    desc: "Sled down snowy hills, dodge trees.",
    hot: false, isNew: true,
    url: "https://www.crazygames.com/embed/snow-rider-3d",
    thumb: "",
    color: "#0d47a1"
  },
  {
    id: "drivemad",
    name: "Drive Mad",
    desc: "Crazy physics car game.",
    hot: true, isNew: false,
    url: "https://www.crazygames.com/embed/drive-mad",
    thumb: "",
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
    url: "https://cake-logic.itch.io/ultrakill-web-port",
    thumb: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1229490/capsule_616x353.jpg?t=1771983912",
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
    url: "https://eaglercraft1-8.github.io/",
    thumb: "https://store-images.s-microsoft.com/image/apps.58378.13850085746326678.826cc014-d610-46af-bdb3-c5c96be4d22c.64287a91-c69e-4723-bb61-03fecd348c2a?q=90&w=480&h=270",
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
    url: "https://hub-pro.github.io/games/fridaynightfunkin/index.html",
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

