// Script to help import your 1,000 affirmations into the affirmations.ts file
// Replace the sample data in lib/affirmations.ts with your actual JSON data

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert your JSON file to the TypeScript format
function convertAffirmationsToTypeScript(jsonFilePath, outputFilePath) {
  try {
    // Read your JSON file
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const affirmations = JSON.parse(jsonData);
    
    // Validate the structure
    if (!Array.isArray(affirmations)) {
      throw new Error('JSON file should contain an array of affirmations');
    }
    
    // Check if each affirmation has the required fields
    const requiredFields = ['id', 'theme', 'affirmation'];
    for (let i = 0; i < Math.min(5, affirmations.length); i++) {
      const affirmation = affirmations[i];
      for (const field of requiredFields) {
        if (!(field in affirmation)) {
          throw new Error(`Missing required field '${field}' in affirmation at index ${i}`);
        }
      }
    }
    
    // Generate TypeScript content
    let tsContent = `export interface Affirmation {
  id: string;
  theme: string;
  affirmation: string;
}

// Your 1,000 therapeutic affirmations
export const therapeuticAffirmations: Affirmation[] = [
`;

    // Add each affirmation
    affirmations.forEach((affirmation, index) => {
      const escapedAffirmation = affirmation.affirmation.replace(/'/g, "\\'");
      tsContent += `  {
    id: "${affirmation.id}",
    theme: "${affirmation.theme}",
    affirmation: "${escapedAffirmation}"
  }${index < affirmations.length - 1 ? ',' : ''}
`;
    });

    tsContent += `];

// Get affirmations by theme
export const getAffirmationsByTheme = (theme: string): Affirmation[] => {
  return therapeuticAffirmations.filter(affirmation => 
    affirmation.theme.toLowerCase() === theme.toLowerCase()
  );
};

// Get all unique themes
export const getAllThemes = (): string[] => {
  const themes = therapeuticAffirmations.map(affirmation => affirmation.theme);
  return [...new Set(themes)].sort();
};

// Get random affirmation
export const getRandomAffirmation = (): Affirmation => {
  const randomIndex = Math.floor(Math.random() * therapeuticAffirmations.length);
  return therapeuticAffirmations[randomIndex];
};

// Get random affirmation by theme
export const getRandomAffirmationByTheme = (theme: string): Affirmation | null => {
  const themeAffirmations = getAffirmationsByTheme(theme);
  if (themeAffirmations.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * themeAffirmations.length);
  return themeAffirmations[randomIndex];
};

// Get today's affirmation (deterministic based on date)
export const getTodaysAffirmation = (): Affirmation => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % therapeuticAffirmations.length;
  return therapeuticAffirmations[index];
};

// Get affirmation for specific date (useful for notifications)
export const getAffirmationForDate = (date: Date): Affirmation => {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % therapeuticAffirmations.length;
  return therapeuticAffirmations[index];
};
`;

    // Write to file
    fs.writeFileSync(outputFilePath, tsContent);
    
    console.log(`✅ Successfully converted ${affirmations.length} affirmations to TypeScript!`);
    console.log(`📁 Output file: ${outputFilePath}`);
    console.log(`🎯 Themes found: ${[...new Set(affirmations.map(a => a.theme))].length}`);
    
    // Show sample themes
    const themes = [...new Set(affirmations.map(a => a.theme))].slice(0, 10);
    console.log(`📋 Sample themes: ${themes.join(', ')}${themes.length < [...new Set(affirmations.map(a => a.theme))].length ? '...' : ''}`);
    
  } catch (error) {
    console.error('❌ Error converting affirmations:', error.message);
    process.exit(1);
  }
}

// Usage instructions
console.log('🚀 Affirmations Import Script');
console.log('============================');
console.log('');
console.log('Usage:');
console.log('1. Place your JSON file in the project root');
console.log('2. Run: node import-affirmations.js your-file.json');
console.log('');
console.log('Expected JSON format:');
console.log('[');
console.log('  {');
console.log('    "id": "1",');
console.log('    "theme": "self-worth",');
console.log('    "affirmation": "I am worthy of love and respect."');
console.log('  },');
console.log('  ...');
console.log(']');
console.log('');

// Check if JSON file path was provided
const jsonFilePath = process.argv[2];
if (!jsonFilePath) {
  console.log('❌ Please provide the path to your JSON file:');
  console.log('   node import-affirmations.js your-affirmations.json');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(jsonFilePath)) {
  console.log(`❌ File not found: ${jsonFilePath}`);
  process.exit(1);
}

// Set output path
const outputFilePath = path.join(__dirname, 'lib', 'affirmations.ts');

// Convert the file
convertAffirmationsToTypeScript(jsonFilePath, outputFilePath);
