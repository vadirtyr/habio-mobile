export const ORBIT_THEME_FALLBACK = {
  id: "default",
  name: "Default Orbit",
  description: "Clean OurOrbit styling for any group.",
  gradient: ["#0F172A", "#2563EB"],
  accent: "#38BDF8",
  text_color: "#FFFFFF",
};

export const ORBIT_THEMES = [
  ORBIT_THEME_FALLBACK,
  { id: "forest", name: "Forest", description: "Grounded greens for steady shared progress.", gradient: ["#064E3B", "#16A34A"], accent: "#86EFAC", text_color: "#FFFFFF" },
  { id: "sunset", name: "Sunset", description: "Warm oranges and rose tones for energizing goals.", gradient: ["#9A3412", "#F97316", "#E11D48"], accent: "#FED7AA", text_color: "#FFFFFF" },
  { id: "ocean", name: "Ocean", description: "Calm blues for flowing teamwork.", gradient: ["#0E7490", "#0284C7", "#38BDF8"], accent: "#BAE6FD", text_color: "#FFFFFF" },
  { id: "mountain", name: "Mountain", description: "Slate and pine for big climbs together.", gradient: ["#1F2937", "#475569", "#166534"], accent: "#BBF7D0", text_color: "#FFFFFF" },
  { id: "midnight", name: "Midnight", description: "Deep night colors for focused groups.", gradient: ["#020617", "#1E1B4B", "#312E81"], accent: "#A5B4FC", text_color: "#FFFFFF" },
  { id: "scout", name: "Scout", description: "Outdoor greens for troop teamwork and readiness.", gradient: ["#14532D", "#365314", "#A16207"], accent: "#FDE68A", text_color: "#FFFFFF" },
  { id: "family", name: "Family", description: "Warm, friendly colors for families building routines.", gradient: ["#BE185D", "#F97316", "#FDE68A"], accent: "#FFE4E6", text_color: "#FFFFFF" },
  { id: "fitness", name: "Fitness", description: "Active greens and cyan for movement and wellness.", gradient: ["#047857", "#06B6D4", "#22C55E"], accent: "#CCFBF1", text_color: "#FFFFFF" },
  { id: "study", name: "Study", description: "Clear indigo focus for study groups and exam prep.", gradient: ["#3730A3", "#7C3AED", "#06B6D4"], accent: "#DDD6FE", text_color: "#FFFFFF" },
];

export function getOrbitTheme(theme) {
  if (theme?.gradient?.length) return theme;
  return ORBIT_THEMES.find((item) => item.id === theme) || ORBIT_THEME_FALLBACK;
}
