const GRAY9 = "#191919"
const GRAY8 = "#2D2D2D"
const GRAY7 = "#404040"
const GRAY6 = "#868e96"
const GRAY5 = "#adb5bd"
const GRAY4 = "#ced4da"
const GRAY3 = "#dee2e6"
const GRAY2 = "#e9ecef"
const GRAY1 = "#f1f3f5"
const GRAY0 = "#f8f9fa"

// const lightProfile = "profile"
// const darkProfile = "profile-bl"

const lightProfile = "profile_2026_square"
const darkProfile = "profile_2026_square"

export const light = {
  name: "light",
  colors: {
    profile: lightProfile,
    bodyBackground: "#ffffff",
    text: GRAY9,
    secondaryText: GRAY7,
    tertiaryText: GRAY6,
    mutedText: GRAY5,
    hoveredLinkText: GRAY6,
    border: GRAY4,
    activatedBorder: "#93C5FD",
    background: GRAY1,
    icon: GRAY6,
    divider: GRAY2,
    headerBackground: "rgba(255, 255, 255, 0.85)",
    headerShadow: "rgba(0, 0, 0, 0.08)",
    inlineCodeBackground: GRAY2,
    inlineCodeBackgroundDarker: GRAY4,
    tagBackground: GRAY1,
    selectedTagBackground: GRAY7,
    hoveredTagBackground: GRAY3,
    hoveredSelectedTagBackground: GRAY8,
    nextPostButtonBackground: "rgba(0, 0, 0, 0.06)",
    hoveredNextPostButtonBackground: "rgba(0, 0, 0, 0.08)",
    seriesBackground: GRAY1,
    tagText: GRAY7,
    selectedTagText: GRAY0,
    spinner: GRAY7,
    scrollTrack: GRAY1,
    scrollHandle: GRAY4,
    blockQuoteBorder: GRAY4,
    blockQuoteBackground: GRAY1,
    textFieldBorder: GRAY4,
    textFieldActivatedBorder: GRAY5,
    tableBackground: "#FFFFFF",
    figcaption: "#FFFFFF",
    accent: "#2563EB",
    accentBg: "#DBEAFE",
    accentText: "#2158E0",
    secondAccentText: "#3B82F6",
  },
}

export const dark = {
  name: "dark",
  colors: {
    profile: darkProfile,
    bodyBackground: "#242424",
    text: "#e2e2e2",
    secondaryText: GRAY4,
    tertiaryText: GRAY5,
    mutedText: GRAY6,
    hoveredLinkText: GRAY5,
    border: GRAY5,
    activatedBorder: "#3B82F6",
    background: "#2e2e2e",
    icon: GRAY5,
    divider: "#2e2e2e",
    headerBackground: "rgba(36, 36, 36, 0.85)",
    headerShadow: "rgba(150, 150, 150, 0.06)",
    inlineCodeBackground: "#2e2e2e",
    inlineCodeBackgroundDarker: GRAY7,
    tagBackground: "#2e2e2e",
    selectedTagBackground: GRAY2,
    hoveredTagBackground: GRAY7,
    hoveredSelectedTagBackground: GRAY1,
    nextPostButtonBackground: "rgba(255, 255, 255, 0.05)",
    hoveredNextPostButtonBackground: "rgba(255, 255, 255, 0.08)",
    seriesBackground: GRAY8,
    tagText: GRAY2,
    selectedTagText: GRAY9,
    spinner: GRAY1,
    scrollTrack: GRAY8,
    scrollHandle: GRAY7,
    blockQuoteBorder: GRAY7,
    blockQuoteBackground: "#2e2e2e",
    textFieldBorder: GRAY7,
    textFieldActivatedBorder: GRAY6,
    tableBackground: "#242424",
    figcaption: "#242424",
    accent: "#93C5FD",
    accentBg: "#1e3a5f",
    accentText: "#60A5FA",
    secondAccentText: "#60A5FA",
  },
}
