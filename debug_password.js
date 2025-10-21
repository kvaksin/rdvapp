import bcrypt from './node_modules/bcrypt/bcrypt.js';

const hash = '$2b$12$EY4wGEYTESlIknZfkTX4J.McYyJ37EqMYpoSMPeg.bM6K3Hz7a6Fu';
const commonPasswords = [
  'admin123',
  'password123', 
  'test123',
  'password',
  'admin',
  'test',
  '123456',
  'admin@2025',
  'rdvapp123',
  'secret123',
  'demo123',
  'changeme',
  'default'
];

async function testPasswords() {
  console.log('Testing common passwords against hash:', hash);
  for (const password of commonPasswords) {
    const match = await bcrypt.compare(password, hash);
    if (match) {
      console.log(`✅ FOUND! Password is: "${password}"`);
      return;
    } else {
      console.log(`❌ "${password}" - no match`);
    }
  }
  console.log('No matching password found');
}

testPasswords().catch(console.error);