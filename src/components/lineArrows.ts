// Arrow colours for help on the board: your moves blue. (The engine's
// best-line arrows were removed with the best-line button, Sep 2026.)
const YOURS = [25, 95, 185]

const rgba = ([r, g, b]: number[], alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`

export const HINT_ARROW_COLOUR = rgba(YOURS, 0.9)
