const GAMES = [
  {
    id: "ovo",
    name: "OvO",
    desc: "Fast parkour platformer. Run, jump and slide!",
    hot: true,
    isNew: false,
    url: "https://ubg98.github.io/OvO/",
    thumb: "https://img.gamemonetize.com/t3mgnmw3xjpf4kqz1e3q0z4p8j5y2k6n/512x384.jpg",
    color: "#1a1a2e"
  },
  {
    id: "run3",
    name: "Run 3",
    desc: "Sprint through endless space tunnels!",
    hot: true,
    isNew: false,
    url: "https://classroom6x.github.io/run-3/",
    thumb: "https://img.gamemonetize.com/run3/512x384.jpg",
    color: "#0d1b2a"
  },
  {
    id: "slope",
    name: "Slope",
    desc: "Roll a neon ball, don't fall off!",
    hot: true,
    isNew: false,
    url: "https://ubg98.github.io/Slope/",
    thumb: "https://img.gamemonetize.com/slope/512x384.jpg",
    color: "#0a0020"
  },
  {
    id: "drifthunters",
    name: "Drift Hunters",
    desc: "Drift epic cars on wild tracks.",
    hot: false,
    isNew: false,
    url: "https://ubg98.github.io/Drift-Hunters/",
    thumb: "https://img.gamemonetize.com/drift-hunters/512x384.jpg",
    color: "#1a0500"
  },
  {
    id: "subway",
    name: "Subway Surfers",
    desc: "Run from the inspector!",
    hot: true,
    isNew: false,
    url: "https://ubg98.github.io/Subway-Surfers/",
    thumb: "https://img.gamemonetize.com/subway-surfers/512x384.jpg",
    color: "#ff6d00"
  },
  {
    id: "motox3m",
    name: "Moto X3M",
    desc: "Crazy motorcycle stunt tracks.",
    hot: false,
    isNew: false,
    url: "https://ubg98.github.io/Moto-X3M/",
    thumb: "https://img.gamemonetize.com/moto-x3m/512x384.jpg",
    color: "#1b0000"
  },
  {
    id: "cookieclicker",
    name: "Cookie Clicker",
    desc: "Click cookies, build an empire.",
    hot: false,
    isNew: false,
    url: "https://orteil.dashnet.org/cookieclicker/",
    thumb: "https://orteil.dashnet.org/cookieclicker/img/favicon.ico",
    color: "#3e1e00"
  },
  {
    id: "2048",
    name: "2048",
    desc: "Slide tiles and reach 2048!",
    hot: false,
    isNew: false,
    url: "https://play2048.co/",
    thumb: "https://play2048.co/favicon.ico",
    color: "#776e65"
  },
  {
    id: "geometrydash",
    name: "Geometry Dash",
    desc: "Jump to the beat through insane levels.",
    hot: true,
    isNew: false,
    url: "https://ubg98.github.io/Geometry-Dash/",
    thumb: "https://img.gamemonetize.com/geometry-dash/512x384.jpg",
    color: "#1a237e"
  },
  {
    id: "basketball",
    name: "Basketball Stars",
    desc: "1v1 basketball action.",
    hot: false,
    isNew: false,
    url: "https://ubg98.github.io/Basketball-Stars/",
    thumb: "https://img.gamemonetize.com/basketball-stars/512x384.jpg",
    color: "#e65100"
  },
  {
    id: "retrobowl",
    name: "Retro Bowl",
    desc: "Manage and play your NFL team.",
    hot: false,
    isNew: true,
    url: "https://ubg98.github.io/Retro-Bowl/",
    thumb: "https://img.gamemonetize.com/retro-bowl/512x384.jpg",
    color: "#1b5e20"
  },
  {
    id: "snowrider",
    name: "Snow Rider 3D",
    desc: "Sled down snowy hills, dodge trees.",
    hot: false,
    isNew: true,
    url: "https://ubg98.github.io/Snow-Rider-3D/",
    thumb: "https://img.gamemonetize.com/snow-rider-3d/512x384.jpg",
    color: "#0d47a1"
  },
  {
    id: "drivemad",
    name: "Drive Mad",
    desc: "Crazy physics car game.",
    hot: true,
    isNew: false,
    url: "https://ubg98.github.io/Drive-Mad/",
    thumb: "https://img.gamemonetize.com/drive-mad/512x384.jpg",
    color: "#212121"
  },
  {
    id: "monkeymart",
    name: "Monkey Mart",
    desc: "Run a supermarket as a monkey.",
    hot: false,
    isNew: true,
    url: "https://ubg98.github.io/Monkey-Mart/",
    thumb: "https://img.gamemonetize.com/monkey-mart/512x384.jpg",
    color: "#f57f17"
  },
  {
    id: "clusterrush",
    name: "Cluster Rush",
    desc: "Jump across speeding trucks.",
    hot: false,
    isNew: true,
    url: "https://ubg98.github.io/Cluster-Rush/",
    thumb: "https://img.gamemonetize.com/cluster-rush/512x384.jpg",
    color: "#4a148c"
  },
  {
    id: "happywheels",
    name: "Happy Wheels",
    desc: "Ragdoll physics chaos.",
    hot: false,
    isNew: false,
    url: "https://ubg98.github.io/Happy-Wheels/",
    thumb: "https://img.gamemonetize.com/happy-wheels/512x384.jpg",
    color: "#880e4f"
  },
  {
    id: "idlebreakout",
    name: "Idle Breakout",
    desc: "Idle clicker breakout game.",
    hot: false,
    isNew: false,
    url: "https://ubg98.github.io/Idle-Breakout/",
    thumb: "https://img.gamemonetize.com/idle-breakout/512x384.jpg",
    color: "#1a237e"
  },
  {
    id: "paperiov2",
    name: "Paper.io 2",
    desc: "Claim territory, cut rivals off.",
    hot: false,
    isNew: false,
    url: "https://ubg98.github.io/Paper-io-2/",
    thumb: "https://img.gamemonetize.com/paper-io-2/512x384.jpg",
    color: "#004d40"
  },
  {
    id: "ultrakill",
    name: "Ultrakill (Demo)",
    desc: "Ultra-fast retro FPS shooter. Blood is fuel.",
    hot: true,
    isNew: true,
    url: "https://ubg98.github.io/Ultrakill/",
    thumb: "https://img.itch.zone/aW1nLzMxMzYxNTIucG5n/315x250%23c/uTGrsB.png",
    color: "#7f0000"
  }
];
