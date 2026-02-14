#!/usr/bin/env node

/**
 * Translation Completeness Check Script
 * 
 * This script verifies that all translation keys from the English (en.json) file
 * exist in all other language files. It helps ensure translation consistency
 * across all supported languages.
 * 
 * Usage: node scripts/check-translations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales');
const REFERENCE_LANG = 'en';
const SUPPORTED_LANGUAGES = ['en', 'hi', 'ta', 'te', 'kn', 'ml'];

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Recursively gets all keys from a nested object
 * @param {Object} obj - The object to traverse
 * @param {string} prefix - The prefix for nested keys
 * @returns {Set<string>} - Set of all keys in dot notation
 */
function getAllKeys(obj, prefix = '') {
  const keys = new Set();
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively get keys from nested objects
      const nestedKeys = getAllKeys(value, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }
  
  return keys;
}

/**
 * Loads a translation file
 * @param {string} lang - Language code
 * @returns {Object} - Translation object
 */
function loadTranslation(lang) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}Error: Translation file not found: ${filePath}${colors.reset}`);
    process.exit(1);
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error parsing ${lang}.json: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Main function to check translation completeness
 */
function checkTranslations() {
  console.log(`${colors.cyan}==================================================${colors.reset}`);
  console.log(`${colors.cyan}   Translation Completeness Check${colors.reset}`);
  console.log(`${colors.cyan}==================================================${colors.reset}\n`);
  
  // Load reference translation (English)
  console.log(`${colors.blue}Loading reference language: ${REFERENCE_LANG}${colors.reset}`);
  const referenceTranslation = loadTranslation(REFERENCE_LANG);
  const referenceKeys = getAllKeys(referenceTranslation);
  
  console.log(`${colors.green}✓ Reference language has ${referenceKeys.size} keys${colors.reset}\n`);
  
  let allComplete = true;
  const results = [];
  
  // Check each language
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === REFERENCE_LANG) continue;
    
    console.log(`${colors.blue}Checking ${lang}.json...${colors.reset}`);
    
    const translation = loadTranslation(lang);
    const translationKeys = getAllKeys(translation);
    
    // Find missing keys
    const missingKeys = [...referenceKeys].filter(key => !translationKeys.has(key));
    
    // Find extra keys (keys that exist in translation but not in reference)
    const extraKeys = [...translationKeys].filter(key => !referenceKeys.has(key));
    
    const isComplete = missingKeys.length === 0 && extraKeys.length === 0;
    
    results.push({
      lang,
      total: referenceKeys.size,
      present: translationKeys.size - extraKeys.length,
      missing: missingKeys.length,
      extra: extraKeys.length,
      isComplete,
      missingKeys,
      extraKeys,
    });
    
    if (isComplete) {
      console.log(`  ${colors.green}✓ Complete (${translationKeys.size}/${referenceKeys.size} keys)${colors.reset}`);
    } else {
      allComplete = false;
      console.log(`  ${colors.red}✗ Incomplete (${translationKeys.size - extraKeys.length}/${referenceKeys.size} keys)${colors.reset}`);
      
      if (missingKeys.length > 0) {
        console.log(`  ${colors.yellow}Missing keys: ${missingKeys.length}${colors.reset}`);
        missingKeys.forEach(key => {
          console.log(`    - ${key}`);
        });
      }
      
      if (extraKeys.length > 0) {
        console.log(`  ${colors.yellow}Extra keys (not in reference): ${extraKeys.length}${colors.reset}`);
        extraKeys.forEach(key => {
          console.log(`    - ${key}`);
        });
      }
    }
    
    console.log();
  }
  
  // Summary
  console.log(`${colors.cyan}==================================================${colors.reset}`);
  console.log(`${colors.cyan}   Summary${colors.reset}`);
  console.log(`${colors.cyan}==================================================${colors.reset}\n`);
  
  console.log('Language | Complete | Keys      | Missing | Extra');
  console.log('---------|----------|-----------|---------|------');
  
  results.forEach(result => {
    const status = result.isComplete 
      ? `${colors.green}✓${colors.reset}` 
      : `${colors.red}✗${colors.reset}`;
    
    const completion = result.isComplete
      ? `${colors.green}Yes${colors.reset}`
      : `${colors.red}No${colors.reset}`;
    
    console.log(
      `${result.lang.padEnd(8)} | ${status} ${completion.padEnd(15)} | ` +
      `${result.present}/${result.total}`.padEnd(9) + ' | ' +
      `${result.missing}`.padEnd(7) + ' | ' +
      `${result.extra}`
    );
  });
  
  console.log();
  
  if (allComplete) {
    console.log(`${colors.green}✓ All translations are complete!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some translations are incomplete. Please add missing keys.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the check
checkTranslations();
