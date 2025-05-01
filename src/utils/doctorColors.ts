// Dental-themed color palette
export const dentalColors = [
  // Soft blues (representing cleanliness, water, mouthwash)
  '#4A90E2', // Sky blue
  '#5DADE2', // Light blue
  '#3498DB', // Medium blue
  '#2E86C1', // Ocean blue
  
  // Greens (representing freshness, mint)
  '#2ECC71', // Emerald green
  '#27AE60', // Nephritis green
  '#16A085', // Green sea
  '#1ABC9C', // Turquoise
  
  // Purples (representing dental care, lavender)
  '#9B59B6', // Amethyst
  '#8E44AD', // Wisteria
  '#7D3C98', // Purple
  '#6C3483', // Deep purple
  
  // Teals and cyans (representing dental hygiene)
  '#45B39D', // Mint
  '#48C9B0', // Teal
  '#76D7C4', // Light teal
  '#73C6B6', // Medium teal
  
  // Soft reds and pinks (representing gums, dental health)
  '#E74C3C', // Alizarin
  '#EC7063', // Soft red
  '#F1948A', // Light coral
  '#D98880', // Pale red
];

// Function to get a random color from the palette
export const getRandomDentalColor = (): string => {
  const randomIndex = Math.floor(Math.random() * dentalColors.length);
  return dentalColors[randomIndex];
};

// Function to get a lighter version of a color for backgrounds
export const getLighterColor = (color: string, opacity: number = 0.2): string => {
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
