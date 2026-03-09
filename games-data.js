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
    url: "https://ozh.github.io/cookieclicker/",
    thumb: "https://play-lh.googleusercontent.com/Z1MOuuiD05ZN5LkVmMEvKF0mqAc-FknaQ2j8s4dZiO-LSPQX4EEA3RVJdlQEtxe96ok", color: "#3e1e00"
  },
  {
    id: "2048", name: "2048", desc: "Slide tiles and reach 2048!", hot: false, isNew: false,
    url: "https://play2048.co/",
    thumb: "https://upload.wikimedia.org/wikipedia/commons/1/1a/2048_Icon.png", color: "#776e65"
  },
  {
    id: "geometrydash", name: "Geometry Dash", desc: "Jump to the beat!", hot: true, isNew: false,
    url: "soteris24.github.io/genetrydash.github.io/",
    thumb: "https://m.media-amazon.com/images/I/61mVIP6Oo1L.png", color: "#1a237e"
  },
  {
    id: "basketball", name: "Basketball Stars", desc: "1v1 basketball action.", hot: false, isNew: false,
    url: "https://ubg98.github.io/BasketballStars/",
    thumb: "https://imgs.crazygames.com/games/basketball-stars-2019/cover-1583231506155.png?metadata=none&quality=100&width=1200&height=630&fit=crop", color: "#e65100"
  },
  {
    id: "snowrider", name: "Snow Rider 3D", desc: "Sled down snowy hills.", hot: false, isNew: true,
    url: "https://tsnowrider.github.io/",
    thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQO62rqZYDwjwbdFYiMxqKExDM7tJLwMIxYh6hKQaeF0HFVz4skQUPrbNQ&s=10", color: "#0d47a1"
  },
  {
    id: "drivemad", name: "Drive Mad", desc: "Crazy physics car game.", hot: true, isNew: false,
    url: "https://ubg98.github.io/drive-mad-unblocked.html",
    thumb: "https://img.poki-cdn.com/cdn-cgi/image/q=78,scq=50,width=1200,height=1200,fit=cover,f=png/4abc77cf2ca8a1ca37416249429501f4/drive-mad.png", color: "#212121"
  },
  {
    id: "monkeymart", name: "Monkey Mart", desc: "Run a supermarket as a monkey.", hot: false, isNew: true,
    url: "https://ubg98.github.io/MonkeyMart/",
    thumb: "https://play-lh.googleusercontent.com/rWReIdyvDaYJPeOxn7hbC0b-96ixGpQKM_EndiQa3SUME8TtI_rNUcI4qsw5teK9mqk", color: "#f57f17"
  },
  {
    id: "happywheels", name: "Happy Wheels", desc: "Ragdoll physics chaos.", hot: false, isNew: false,
    url: "https://cbgamesdev.github.io/chilibowlflash/hw/index.html",
    thumb: "https://imgs.crazygames.com/games/happy-wheels/cover-1688034516340.png?metadata=none&quality=100&width=1200&height=630&fit=crop", color: "#880e4f"
  },
  {
    id: "paperiov2", name: "Paper.io 2", desc: "Claim territory, cut rivals off.", hot: false, isNew: false,
    url: "https://mountain658.github.io/paperio2.html",
    thumb: "https://imgs.crazygames.com/paper-io-2_1x1/20250214024144/paper-io-2_1x1-cover?format=auto&quality=100&metadata=none&width=1200", color: "#004d40"
  },
  {
    id: "ultrakill", name: "Ultrakill Demo", desc: "MANKIND IS DEAD. BLOOD IS FUEL. HELL IS FULL.", hot: true, isNew: true,
    url: "https://cake-logic.itch.io/ultrakill-web-port",
    thumb: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1229490/capsule_616x353.jpg?t=1771983912", color: "#7f0000"
  },
  {
    id: "subway", name: "Subway Surfers", desc: "Run from the inspector!", hot: true, isNew: false,
    url: "https://mountain658.github.io/subwaysurfers.html",
    thumb: "https://i.ytimg.com/vi/MSNXVDvp3lo/maxresdefault.jpg", color: "#ff6d00"
  },
  {
    id: "minecraft", name: "Minecraft Classic", desc: "The original Minecraft in your browser!", hot: true, isNew: false,
    url: "https://eaglercraft1-8.github.io/",
    thumb: "https://store-images.s-microsoft.com/image/apps.58378.13850085746326678.826cc014-d610-46af-bdb3-c5c96be4d22c.64287a91-c69e-4723-bb61-03fecd348c2a?q=90&w=480&h=270", color: "#4caf50"
  },
  {
    id: "amongus", name: "Among Us", desc: "Find the impostor!", hot: false, isNew: false,
    url: "https://freezenova-unblocked.github.io/projects/among-us/index.html",
    thumb: "https://www.esrb.org/wp-content/uploads/2023/01/V1_ESRB_AmongUs-blog-header-01-1024x740-_1.jpg", color: "#c62828"
  },
  {
    id: "fnf", name: "Friday Night Funkin", desc: "Rhythm battle game!", hot: true, isNew: false,
    url: "https://hub-pro.github.io/games/fridaynightfunkin/index.html",
    thumb: "https://play-lh.googleusercontent.com/eH7CbOlUv_4ysRxicJbncfdfK3nsA_YtIpu8cvPRi2rRvXAQOLwXhoNybAwHptYIpbY", color: "#6a1b9a"
  },
  {
    id: "1v1lol", name: "1v1.LOL", desc: "Build and shoot!", hot: true, isNew: false,
    url: "https://ubg17.github.io/1v1LOL/",
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
    id: "smashkarts", name: "Smash karts", desc: "Smash your opponent", hot: false, isNew: true,
    url: "https://smashkarts.io/",
    thumb: "https://img.poki-cdn.com/cdn-cgi/image/q=78,scq=50,width=1200,height=1200,fit=cover,f=png/9c9e529b14731be871b07b89660bbc2a/smash-karts.png", color: "#263238"
  },
  {
    id: "vex7", name: "Vex 7", desc: "Be a obbist", hot: false, isNew: true,
    url: "https://ljgjm.github.io/7/",
    thumb: "https://www.coolmathgames.com/sites/default/files/Vex7_OG-logo.jpg", color: "#263238"
  },
  {
    id: "Five nights at Freddy's 1", name: "Fnaf 1", desc: "Survive till 6 Am you have 5 nights", hot: false, isNew: true,
    url: "https://irv77.github.io/hd_fnaf/1/",
    thumb: "https://media2.giphy.com/media/v1.Y2lkPTZjMDliOTUycDVmcGl4ajZmb2kwczZpNjhwMWtobzZnaTJzemFtN20wbzlqMjkyOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/NUicI56PINuzS/200w.gif", color: "#263238"
  },
  {
    id: "Duckslife4", name: "Duck life 4", desc: "Eat little duck", hot: false, isNew: true,
    url: "https://nb-ga.github.io/games-site/projects/ducklife4/index.html",
    thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSn7iK0apeBrpdpwEBL8Z4UuwwV18KJyj8O7AK0GoBAUxy14yTB-jKUtaE&s=10", color: "#263238"
  },
  {
    id: "Templerun", name: "Temple run", desc: "Runn", hot: false, isNew: true,
    url: "https://nb-ga.github.io/games-site/projects/temple-run-2/index.html",
    thumb: "https://i.ytimg.com/vi/Ten_rU0ct08/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLA7TzuO93QfHtd3OZWsLhsP4F24pw", color: "#263238"
  },
  {
    id: "Driftboss", name: "Drift boss", desc: "Drift like a boss", hot: false, isNew: true,
    url: "https://nb-ga.github.io/games-site/projects/drift-boss/index.html",
    thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8tcCD8A5Tj8jITRkENdYgP7NECj9firPbDTEdE8ZA9Jmav2HXDmx3Br4&s=10", color: "#263238"
  },
  {
    id: "Basketball", name: "Basket&ball", desc: "Basket and ball", hot: false, isNew: true,
    url: "https://games-site.github.io/projects/basket-and-ball/index.html",
    thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTe-YKtsh0rhOBfRF2CEYs0H4E9BjRXGKESm0Kvum3QQ&s", color: "#263238"
  },
  {
    id: "RandomBasketball", name: "Random Basketball", desc: "Basket", hot: false, isNew: true,
    url: "https://games-site.github.io/projects/basket-random/frame.html",
    thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOOqOc5iuDD8BP5iD34PeOBcof3HTZQed2iSCiSqDzEw&s=10", color: "#263238"
  },
  {
    id: "Jetpackjoyride", name: "Jetpack joy ride", desc: "joy ride", hot: false, isNew: true,
    url: "https://hub-pro.github.io/games/jetpackjoyride/index.html",
    thumb: "https://imgs.crazygames.com/jetpack-joyride-pcp_16x9/20250121090354/jetpack-joyride-pcp_16x9-cover?metadata=none&quality=60&height=2530", color: "#263238"
  },
  {
    id: "Henrystickman1", name: "Henry stickman", desc: "breaking the bank", hot: false, isNew: true,
    url: "https://hub-pro.github.io/games/henrystickmin/breakingthebank/index.html",
    thumb: "https://i.makeagif.com/media/3-30-2023/7xLlVX.gif", color: "#263238"
  },
  {
    id: "Henrystickman2", name: "Henry stickman2", desc: "Escaping the prison", hot: false, isNew: true,
    url: "https://hub-pro.github.io/games/henrystickmin/escapingtheprison/index.html",
    thumb: "https://media.tenor.com/C8yLmSCL4D4AAAAM/henry-stickmin-dance.gif", color: "#263238"
  },
  {
    id: "Henrystickman3", name: "Henry stickman3", desc: "Stealing the diamond", hot: false, isNew: true,
    url: "https://hub-pro.github.io/games/henrystickmin/stealingthediamond/index.html",
    thumb: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-A9qhzK15QzukcJ2-q2I1RbThk0LPxGK-Kw&s", color: "#263238"
  },
  {
    id: "Henrystickman4", name: "Henry stickman4", desc: "infiltrating the airship", hot: false, isNew: true,
    url: "https://hub-pro.github.io/games/henrystickmin/infiltratingtheairship/index.html",
    thumb: "https://i.makeagif.com/media/4-19-2024/oCgs7r.gif", color: "#263238"
  },
  {
    id: "Henrystickman5", name: "Henry stickman5", desc: "Fleeing the complex", hot: false, isNew: true,
    url: "https://hub-pro.github.io/games/henrystickmin/fleeingthecomplex/index.html",
    thumb: "https://64.media.tumblr.com/c5a6e8929f1e96ea3f3a05d504cde544/tumblr_nxycfdl83o1upp723o4_1280.gif", color: "#263238"
  }
];
