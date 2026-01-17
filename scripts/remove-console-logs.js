#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function removeConsoleLogs() {
  console.log('🧹 Cleaning up console logs for production...\n');

  // Define patterns to find and remove
  const consolePatterns = [
    // Simple console.log statements
    /^\s*console\.(log|info|debug|warn|error)\([^)]*\);\s*$/gm,
    
    // Console statements with semicolon at end of line
    /\s*console\.(log|info|debug|warn|error)\([^)]*\);\s*(?=\n)/g,
    
    // Console statements without semicolon at end of line
    /\s*console\.(log|info|debug|warn|error)\([^)]*\)\s*(?=\n)/g,
    
    // Multi-line console statements (basic)
    /\s*console\.(log|info|debug|warn|error)\(\s*[^)]*?\s*\);\s*/gms
  ];

  // Files to process
  const filePatterns = [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}', 
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}'
  ];

  let totalFiles = 0;
  let filesChanged = 0;
  let totalLogsRemoved = 0;

  for (const pattern of filePatterns) {
    const files = await glob(pattern, { 
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
      absolute: true 
    });
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        let logsRemoved = 0;
        
        // Apply each pattern
        for (const pattern of consolePatterns) {
          const matches = newContent.match(pattern) || [];
          logsRemoved += matches.length;
          newContent = newContent.replace(pattern, '');
        }
        
        // Clean up multiple empty lines
        newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        if (newContent !== content) {
          fs.writeFileSync(filePath, newContent);
          filesChanged++;
          totalLogsRemoved += logsRemoved;
          
          const relativePath = path.relative(process.cwd(), filePath);
          console.log(`✅ Cleaned ${relativePath} - Removed ${logsRemoved} console statement(s)`);
        }
        
        totalFiles++;
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    }
  }

  console.log(`\n🎯 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files modified: ${filesChanged}`);
  console.log(`   Console logs removed: ${totalLogsRemoved}`);
  console.log('\n✨ Production cleanup complete!');
}

// Handle specific exceptions that should be kept
function shouldKeepConsoleLog(line) {
  // Keep error handling in catch blocks for server-side logging
  return line.includes('catch') || 
         line.includes('server') || 
         line.includes('api/') ||
         line.includes('// keep') ||
         line.includes('/* keep */');
}

removeConsoleLogs().catch(console.error);