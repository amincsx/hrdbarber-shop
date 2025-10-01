/**
 * PWA Icon Generator
 * Converts logo.jpg to required PNG formats for iOS PWA support
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Sharp module not found. Installing...');
  console.log('Please run: npm install --save-dev sharp');
  console.log('Then run this script again: node generate-pwa-icons.js');
  process.exit(1);
}

const INPUT_FILE = path.join(__dirname, 'public', 'logo.jpg');
const OUTPUT_DIR = path.join(__dirname, 'public');

const icons = [
  { size: 180, name: 'apple-touch-icon.png', description: 'iOS Apple Touch Icon' },
  { size: 192, name: 'icon-192x192.png', description: 'Android Chrome Icon' },
  { size: 512, name: 'icon-512x512.png', description: 'High-res PWA Icon' },
];

async function generateIcons() {
  console.log('🎨 PWA Icon Generator\n');

  // Check if input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Error: ${INPUT_FILE} not found!`);
    console.log('Please make sure logo.jpg exists in the public folder.');
    process.exit(1);
  }

  console.log(`📁 Input file: ${INPUT_FILE}\n`);

  // Generate each icon
  for (const { size, name, description } of icons) {
    try {
      const outputPath = path.join(OUTPUT_DIR, name);
      
      await sharp(INPUT_FILE)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
          background: { r: 248, g: 250, b: 252, alpha: 1 }
        })
        .png({
          quality: 100,
          compressionLevel: 9,
          palette: false
        })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      
      console.log(`✅ Generated ${name} (${size}x${size}) - ${fileSizeKB} KB`);
      console.log(`   ${description}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }

  console.log('🎉 All icons generated successfully!\n');
  console.log('📋 Next steps:');
  console.log('   1. Check the icons in the public/ folder');
  console.log('   2. Run: npm run build');
  console.log('   3. Deploy your app');
  console.log('   4. Test on iOS Safari: Share → Add to Home Screen\n');
}

// Run the generator
generateIcons().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

