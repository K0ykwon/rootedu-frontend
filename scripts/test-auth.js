const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'Jt9312mh!!';
  const hash = '$2b$12$/0VQ265FYUWqFEkt3ZkB5ee68JigvwDmpXdhGYq0NPK0BhFSws4Vm';
  
  try {
    const isValid = await bcrypt.compare(password, hash);
    console.log('Password validation:', isValid);
    console.log('Hash algorithm:', hash.substring(0, 4));
  } catch (error) {
    console.error('Error:', error);
  }
}

testPassword();