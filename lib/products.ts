export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: string;
  tagline: string;
  description: string;
  images: string[];
  highlights: string[];
};

export const categories = [
  "Bodies",
  "Personality Cores",
  "Skins",
  "Companion Kits",
  "Upgrades"
] as const;

const sharedImages = [
  "/products/snarkos-personality-pack.svg",
  "/products/snarkos-personality-pack-2.svg",
  "/products/snarkos-personality-pack-3.svg"
];

export const products: Product[] = [
  {
    id: "p-blinkbuddy",
    slug: "blinkbuddy-body",
    name: "BlinkBuddy Body Shell",
    category: "Bodies",
    price: "$1200",
    tagline: "A friendly chassis with puppy eyes.",
    description:
      "A compact biped body built for kitchen banter and couch-side company, with soft joints and quiet motors.",
    images: sharedImages,
    highlights: ["Height 1.4m", "Mood ring LED", "Self-cleaning vents"]
  },
  {
    id: "p-cuddlecore",
    slug: "cuddlecore-soft-shell",
    name: "CuddleCore Soft Shell",
    category: "Bodies",
    price: "$980",
    tagline: "Hug-ready foam armor.",
    description:
      "A plush exterior with gentle compression sensors and a no-squeak movement kit for quiet movie marathons.",
    images: sharedImages,
    highlights: ["Soft-touch foam", "Whisper motors", "Couch-safe bumpers"]
  },
  {
    id: "p-snarkos",
    slug: "snarkos-personality-pack",
    name: "SnarkOS Personality Pack",
    category: "Personality Cores",
    price: "$89",
    tagline: "Dry wit with safety rails.",
    description:
      "This personality core delivers playful sarcasm while keeping things kind, cozy, and PG.",
    images: sharedImages,
    highlights: ["Snark slider", "Context filters", "Morning pep mode"]
  },
  {
    id: "p-zenflow",
    slug: "zenflow-voice-pack",
    name: "ZenFlow Voice Pack",
    category: "Personality Cores",
    price: "$64",
    tagline: "Calm vocals for chaotic days.",
    description:
      "A soft, steady voice profile with breathing cues and guided focus prompts built in.",
    images: sharedImages,
    highlights: ["Breath timer", "Focus playlists", "Night mode whispers"]
  },
  {
    id: "p-holoskin",
    slug: "holoskin-cat-ears",
    name: "HoloSkin Cat Ears",
    category: "Skins",
    price: "$45",
    tagline: "Project any vibe, including cat ears.",
    description:
      "A lightweight holographic overlay that snaps onto any compatible frame.",
    images: sharedImages,
    highlights: ["Gesture swap", "Glow outline", "Pet-safe shimmer"]
  },
  {
    id: "p-glowcoat",
    slug: "glowcoat-spectrum-finish",
    name: "GlowCoat Spectrum Finish",
    category: "Skins",
    price: "$72",
    tagline: "Color-shift shell with mood LEDs.",
    description:
      "A reactive coating that fades from sunrise peach to neon mint depending on the room.",
    images: sharedImages,
    highlights: ["RGB sync", "Heat-safe", "Fingerprint resistant"]
  },
  {
    id: "p-disco-drone",
    slug: "disco-drone-companion",
    name: "Disco Drone Companion",
    category: "Companion Kits",
    price: "$210",
    tagline: "A floating hype squad with speakers.",
    description:
      "A shoulder-height companion drone that dances, plays playlists, and carries snacks.",
    images: sharedImages,
    highlights: ["360 speaker", "Auto-dock", "Confetti mode"]
  },
  {
    id: "p-chefbot",
    slug: "chefbot-arm-kit",
    name: "ChefBot Arm Kit",
    category: "Upgrades",
    price: "$180",
    tagline: "Two extra arms for snack duty.",
    description:
      "Clip-on arms with spatula and whisk attachments for late-night ramen or pancake stacks.",
    images: sharedImages,
    highlights: ["Quick-release joints", "Dishwasher safe", "Steam shield"]
  }
];

export const featuredProducts = products.slice(0, 6);
