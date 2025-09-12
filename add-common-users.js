// add-common-users.js
// Helper script to easily add common user types to MongoDB
require('dotenv').config({ path: '.env.local' });
const { exec } = require('child_process');

// Define common user types
const users = [
  {
    name: 'کاربر عادی',
    phone: '09120000001',
    password: 'user123',
    role: 'user',
    verified: true
  },
  {
    name: 'مدیر سیستم',
    phone: '09120000002',
    password: 'admin123',
    role: 'admin',
    verified: true
  },
  {
    name: 'مدیرعامل',
    phone: '09120000003',
    password: 'ceo123',
    role: 'ceo',
    verified: true
  },
  {
    name: 'آرایشگر یک',
    phone: '09120000004',
    password: 'barber123',
    role: 'barber',
    verified: true
  },
  {
    name: 'مشتری تست',
    phone: '09120000005',
    password: 'test123',
    role: 'user',
    verified: true
  }
];

// Show menu for user selection
console.log('User Creation Tool');
console.log('------------------');
console.log('Select a user to create:');

users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name} (${user.role}) - Phone: ${user.phone}`);
});

console.log('6. Add all users');
console.log('7. Add custom user');
console.log('8. Exit');

// Get user input
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('\nEnter your choice (1-8): ', (choice) => {
  readline.close();

  const choiceNum = parseInt(choice);

  if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > 8) {
    console.log('Invalid choice. Exiting.');
    process.exit(1);
  }

  if (choiceNum === 8) {
    console.log('Exiting.');
    process.exit(0);
  }

  if (choiceNum === 7) {
    console.log('To add a custom user, run:');
    console.log('node create-custom-user.js --phone=YOUR_PHONE --name="YOUR NAME" --password=YOUR_PASSWORD [--role=ROLE] [--verified=true/false]');
    process.exit(0);
  }

  if (choiceNum === 6) {
    // Add all users
    console.log('Adding all users...');
    let completed = 0;

    users.forEach((user, index) => {
      const command = `node create-custom-user.js --phone=${user.phone} --name="${user.name}" --password=${user.password} --role=${user.role} --verified=${user.verified}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error adding user ${user.name}:`, error);
        } else {
          console.log(`User ${index + 1} (${user.name}) added successfully.`);
        }

        completed++;
        if (completed === users.length) {
          console.log('All users have been processed.');
          process.exit(0);
        }
      });
    });
  } else {
    // Add single user
    const selectedUser = users[choiceNum - 1];
    const command = `node create-custom-user.js --phone=${selectedUser.phone} --name="${selectedUser.name}" --password=${selectedUser.password} --role=${selectedUser.role} --verified=${selectedUser.verified}`;

    console.log(`Adding user: ${selectedUser.name}...`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error adding user:', error);
        process.exit(1);
      }

      console.log(stdout);
      process.exit(0);
    });
  }
});
