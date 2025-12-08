// Script to import your 1,000 motivation quotes into the mentalHealthResources.ts file
// This will add them to the existing dailyMotivationQuotes array

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert your JSON file to the TypeScript format
function convertMotivationQuotesToTypeScript(jsonFilePath, outputFilePath) {
  try {
    // Read your JSON file
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const quotes = JSON.parse(jsonData);
    
    // Validate the structure
    if (!Array.isArray(quotes)) {
      throw new Error('JSON file should contain an array of quotes');
    }
    
    // Check if each quote has the required fields
    const requiredFields = ['id', 'theme', 'quote'];
    for (let i = 0; i < Math.min(5, quotes.length); i++) {
      const quote = quotes[i];
      for (const field of requiredFields) {
        if (!(field in quote)) {
          throw new Error(`Missing required field '${field}' in quote at index ${i}`);
        }
      }
    }
    
    // Read the existing mentalHealthResources.ts file
    let existingContent = '';
    if (fs.existsSync(outputFilePath)) {
      existingContent = fs.readFileSync(outputFilePath, 'utf8');
    }
    
    // Extract the existing dailyMotivationQuotes array
    const quotesArrayMatch = existingContent.match(/export const dailyMotivationQuotes = \[([\s\S]*?)\];/);
    let existingQuotes = [];
    
    if (quotesArrayMatch) {
      // Parse existing quotes (simple approach - just count the quotes)
      const existingQuotesText = quotesArrayMatch[1];
      const quoteMatches = existingQuotesText.match(/"([^"]+)"/g);
      if (quoteMatches) {
        existingQuotes = quoteMatches.map(match => match.slice(1, -1)); // Remove quotes
      }
    }
    
    // Generate new quotes array
    let newQuotesContent = `export const dailyMotivationQuotes = [
`;

    // Add existing quotes first
    existingQuotes.forEach((quote, index) => {
      const escapedQuote = quote.replace(/'/g, "\\'");
      newQuotesContent += `  "${escapedQuote}"${index < existingQuotes.length - 1 ? ',' : ''}
`;
    });
    
    // Add comma if there are existing quotes
    if (existingQuotes.length > 0 && quotes.length > 0) {
      newQuotesContent = newQuotesContent.trim().slice(0, -1) + ',\n';
    }
    
    // Add new quotes
    quotes.forEach((quote, index) => {
      const escapedQuote = quote.quote.replace(/'/g, "\\'");
      newQuotesContent += `  "${escapedQuote}"${index < quotes.length - 1 ? ',' : ''}
`;
    });

    newQuotesContent += `];
`;

    // Replace the quotes array in the existing content
    let updatedContent;
    if (quotesArrayMatch) {
      updatedContent = existingContent.replace(
        /export const dailyMotivationQuotes = \[[\s\S]*?\];/,
        newQuotesContent
      );
    } else {
      // If no existing quotes array, append it to the end
      updatedContent = existingContent + '\n\n' + newQuotesContent;
    }
    
    // Write to file
    fs.writeFileSync(outputFilePath, updatedContent);
    
    console.log(`✅ Successfully added ${quotes.length} motivation quotes to the existing collection!`);
    console.log(`📁 Output file: ${outputFilePath}`);
    console.log(`🎯 Total quotes now: ${existingQuotes.length + quotes.length}`);
    console.log(`📋 Sample themes: ${[...new Set(quotes.map(q => q.theme))].slice(0, 10).join(', ')}${[...new Set(quotes.map(q => q.theme))].length > 10 ? '...' : ''}`);
    
  } catch (error) {
    console.error('❌ Error converting motivation quotes:', error.message);
    process.exit(1);
  }
}

// Usage instructions
console.log('🚀 Motivation Quotes Import Script');
console.log('==================================');
console.log('');
console.log('Usage:');
console.log('1. Place your JSON file in the project root');
console.log('2. Run: node import-motivation-quotes.js your-file.json');
console.log('');
console.log('Expected JSON format:');
console.log('[');
console.log('  {');
console.log('    "id": 1,');
console.log('    "theme": "faith",');
console.log('    "quote": "Always humble, and let your light shine."');
console.log('  },');
console.log('  ...');
console.log(']');
console.log('');

// Check if JSON file path was provided
const jsonFilePath = process.argv[2];
if (!jsonFilePath) {
  console.log('❌ Please provide the path to your JSON file:');
  console.log('   node import-motivation-quotes.js your-motivation.json');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(jsonFilePath)) {
  console.log(`❌ File not found: ${jsonFilePath}`);
  process.exit(1);
}

// Set output path
const outputFilePath = path.join(__dirname, 'lib', 'mentalHealthResources.ts');

// Convert the file
convertMotivationQuotesToTypeScript(jsonFilePath, outputFilePath);
