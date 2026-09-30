// Public files resolved against Vite's `base`, so the site works both at a
// domain root and under a GitHub Pages project path (/makimuradev/).
export const asset = (path) => `${import.meta.env.BASE_URL}${path}`
