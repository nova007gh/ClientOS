# God's Eye View — Visual Style Shaders

The GLSL post-process shader modules in this directory (`thermal.js`, `noir.js`,
`retro.js`, `snow.js`, `surveillance.js`, `anime.js`) are adapted from the
open-source **[God's Eye View](https://github.com/bilawalsidhu/gods-eye-view)**
project by Bilawal Sidhu, used here under the MIT License:

```
MIT License
Copyright (c) 2026 Bilawal Sidhu
```

See the upstream repository for the full license text. These files are pure
CesiumJS `PostProcessStage` shader definitions with no other dependency on
the upstream project, and are wired into ClientOS's Lead Map globe
(`cesium-globe.tsx`) via a "Visual Mode" selector.
