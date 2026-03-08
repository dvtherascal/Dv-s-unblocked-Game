const GAMES = [
  {
    id: "ovo", name: "OvO", desc: "Fast parkour platformer. Run, jump and slide!", hot: true, isNew: false,
    url: "https://ubg98.github.io/OvO/",
    thumb: "https://play-lh.googleusercontent.com/v7KwGdPjJGjJjRXn46sck4DwDBdKSeRzGN44CjiXUtKV0jjOi51Bt4wcXud0m-SkXg", color: "#1a1a2e"
  },
  {
    id: "run3", name: "Run 3", desc: "Sprint through endless space tunnels!", hot: true, isNew: false,
    url: "https://run3game.io/",
    thumb: "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co54z9.jpg", color: "#0d1b2a"
  },
  {
    id: "slope", name: "Slope", desc: "Roll a neon ball, don't fall off!", hot: true, isNew: false,
    url: "https://sz-games.github.io/Slope.html",
    thumb: "https://play-lh.googleusercontent.com/FFrKIqKVpB9HMpaaF0HUc5Sza5W2sM8GFZGfkddU39xPcKCa4BYXQghoWVGlQGpaAA=w526-h296-rw", color: "#0a0020"
  },
  {
    id: "drifthunters", name: "Drift Hunters", desc: "Drift epic cars on wild tracks.", hot: false, isNew: false,
    url: "https://drifthunters.github.io/",
    thumb: "https://imgs.crazygames.com/games/drift-hunters/cover-1656950639575.png?metadata=none&quality=100&width=1200&height=630&fit=crop", color: "#1a0500"
  },
  {
    id: "motox3mWinter", name: "Moto X3M Winter", desc: "Crazy motorcycle stunt tracks.", hot: false, isNew: false,
    url: "https://oto-3-nter.vercel.app/",
    thumb: "https://www.coolmathgames.com/sites/default/files/MotoX3M-Winter_OG-logo.jpg", color: "#1b0000"
  },
  {
    id: "cookieclicker", name: "Cookie Clicker", desc: "Click cookies, build an empire.", hot: false, isNew: false,
    url: "https://hub-pro.github.io/cookie/index.html",
    thumb: "https://play-lh.googleusercontent.com/Z1MOuuiD05ZN5LkVmMEvKF0mqAc-FknaQ2j8s4dZiO-LSPQX4EEA3RVJdlQEtxe96ok", color: "#3e1e00"
  },
  {
    id: "2048", name: "2048", desc: "Slide tiles and reach 2048!", hot: false, isNew: false,
    url: "https://play2048.co/",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/1/1a/2048_Icon.png", color: "#776e65"
  },
  {
    id: "geometrydash", name: "Geometry Dash", desc: "Jump to the beat!", hot: true, isNew: false,
    url: "https://geometrydash.github.io/",
    thumb: "https://m.media-amazon.com/images/I/61mVIP6Oo1L.png", color: "#1a237e"
  },
  {
    id: "basketball", name: "Basketball Stars", desc: "1v1 basketball action.", hot: false, isNew: false,
    url: "https://basketball-stars.github.io/",
    thumb: "https://imgs.crazygames.com/games/basketball-stars-2019/cover-1583231506155.png?metadata=none&quality=100&width=1200&height=630&fit=crop", color: "#e65100"
  },
  {
    id: "retrobowl", name: "Retro Bowl", desc: "Manage and play your NFL team.", hot: false, isNew: true,
    url: "https://retrobowl.me/",
    thumb: "https://upload.wikimedia.org/wikipedia/en/b/bf/Retro_Bowl_cover.png", color: "#1b5e20"
  },
  {
    id: "snowrider", name: "Snow Rider 3D", desc: "Sled down snowy hills.", hot: false, isNew: true,
    url: "https://snow-rider-3d.github.io/",
    thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO62rqZYDwjwbdFYiMxqKExDM7tJLwMIxYh6hKQaeF0HFVz4skQUPrbNQ&s=10", color: "#0d47a1"
  },
  {
    id: "drivemad", name: "Drive Mad", desc: "Crazy physics car game.", hot: true, isNew: false,
    url: "https://drive-mad.github.io/",
    thumb: "https://img.poki-cdn.com/cdn-cgi/image/q=78,scq=50,width=1200,height=1200,fit=cover,f=png/4abc77cf2ca8a1ca37416249429501f4/drive-mad.png", color: "#212121"
  },
  {
    id: "monkeymart", name: "Monkey Mart", desc: "Run a supermarket as a monkey.", hot: false, isNew: true,
    url: "https://monkey-mart.github.io/",
    thumb: "https://play-lh.googleusercontent.com/rWReIdyvDaYJPeOxn7hbC0b-96ixGpQKM_EndiQa3SUME8TtI_rNUcI4qsw5teK9mqk", color: "#f57f17"
  },
  {
    id: "clusterrush", name: "Cluster Rush", desc: "Jump across speeding trucks.", hot: false, isNew: true,
    url: "https://cluster-rush.github.io/",
    thumb: "https://clusterrush.io/data/image/game/cluster-rush-game-icon-1.jpg", color: "#4a148c"
  },
  {
    id: "happywheels", name: "Happy Wheels", desc: "Ragdoll physics chaos.", hot: false, isNew: false,
    url: "https://happy-wheels.github.io/",
    thumb: "https://imgs.crazygames.com/games/happy-wheels/cover-1688034516340.png?metadata=none&quality=100&width=1200&height=630&fit=crop", color: "#880e4f"
  },
  {
    id: "idlebreakout", name: "Idle Breakout", desc: "Idle clicker breakout game.", hot: false, isNew: false,
    url: "https://kodiqi.com/idlebreakout/",
    thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPEK1zMDCQDE6OmCti_c1Dvc7fgV0jZ2aoMS_XUT7Oww&s=10", color: "#1a237e"
  },
  {
    id: "paperiov2", name: "Paper.io 2", desc: "Claim territory, cut rivals off.", hot: false, isNew: false,
    url: "https://paper-io.github.io/",
    thumb: "https://imgs.crazygames.com/paper-io-2_1x1/20250214024144/paper-io-2_1x1-cover?format=auto&quality=100&metadata=none&width=1200", color: "#004d40"
  },
  {
    id: "ultrakill", name: "Ultrakill Demo", desc: "MANKIND IS DEAD. BLOOD IS FUEL. HELL IS FULL.", hot: true, isNew: true,
    url: "https://cake-logic.itch.io/ultrakill-web-port",
    thumb: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1229490/capsule_616x353.jpg?t=1771983912", color: "#7f0000"
  },
  {
    id: "subway", name: "Subway Surfers", desc: "Run from the inspector!", hot: true, isNew: false,
    url: "https://subway-surfers.github.io/",
    thumb: "https://i.ytimg.com/vi/MSNXVDvp3lo/maxresdefault.jpg", color: "#ff6d00"
  },
  {
    id: "minecraft", name: "Minecraft Classic", desc: "The original Minecraft in your browser!", hot: true, isNew: false,
    url: "https://eaglercraft1-8.github.io/",
    thumb: "https://store-images.s-microsoft.com/image/apps.58378.13850085746326678.826cc014-d610-46af-bdb3-c5c96be4d22c.64287a91-c69e-4723-bb61-03fecd348c2a?q=90&w=480&h=270", color: "#4caf50"
  },
  {
    id: "amongus", name: "Among Us", desc: "Find the impostor!", hot: false, isNew: false,
    url: "https://among-us-online.github.io/",
    thumb: "https://www.esrb.org/wp-content/uploads/2023/01/V1_ESRB_AmongUs-blog-header-01-1024x740-_1.jpg", color: "#c62828"
  },
  {
    id: "fnf", name: "Friday Night Funkin", desc: "Rhythm battle game!", hot: true, isNew: false,
    url: "https://hub-pro.github.io/games/fridaynightfunkin/index.html",
    thumb: "https://play-lh.googleusercontent.com/eH7CbOlUv_4ysRxicJbncfdfK3nsA_YtIpu8cvPRi2rRvXAQOLwXhoNybAwHptYIpbY", color: "#6a1b9a"
  },
  {
    id: "1v1lol", name: "1v1.LOL", desc: "Build and shoot!", hot: true, isNew: false,
    url: "https://1v1lol.github.io/",
    thumb: "https://gamefaqs.gamespot.com/a/box/8/3/0/927830_front.jpg", color: "#0d47a1"
  },
  {
    id: "shellshockers", name: "Shell Shockers", desc: "Egg-based FPS shooter!", hot: false, isNew: false,
    url: "https://shellshock.io/",
    thumb: "https://imgs.crazygames.com/shellshockersio_1x1/20260203211252/shellshockersio_1x1-cover?format=auto&quality=100&metadata=none&width=1200", color: "#f57f17"
  },
  {
    id: "krunker", name: "Krunker.io", desc: "Fast paced browser FPS!", hot: false, isNew: false,
    url: "https://krunker.io/",
    thumb: "https://play-lh.googleusercontent.com/YiIdFPGRikQVMAcT8Bg5MiYRgi9YHwsFfP5RsfBcpwKqsl_y3AWqbJ8rhJ0TnLIsdg", color: "#212121"
  },
  {
    id: "smashkarts", name: "Smash karts", desc: "Knock your opponent off the roof!", hot: false, isNew: true,
    url: "https://smashkarts.io/",
    thumb: "https://img.poki-cdn.com/cdn-cgi/image/q=78,scq=50,width=1200,height=1200,fit=cover,f=png/9c9e529b14731be871b07b89660bbc2a/smash-karts.png", color: "#263238"
  }
];
