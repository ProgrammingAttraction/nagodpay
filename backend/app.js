const crypto = require('crypto');
const axios = require('axios');

// Configuration - Replace with your actual credentials
const CASHDESK_HASH = "a13d615c8ee6f83a12a0645de4d9a1c4068148562f2ea165dea920c66af2ed90";
const CASHIER_PASS = "901276";
const CASHDESK_ID = "1177830";
const CASHIER_LOGIN = "MuktaA1";
const API_URL = 'https://partners.servcul.com/CashdeskBotAPI/Deposit/';

// Helper function to generate SHA256 hash
function generateSHA256Hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Helper function to generate MD5 hash
function generateMD5Hash(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

// Step 1: Generate the first hash
function generateStep1Hash(userid) {
  const step1Data = `hash=${CASHDESK_HASH}&lng=ru&Userid=${userid}`;
  return generateSHA256Hash(step1Data);
}

// Step 2: Generate the second hash
function generateStep2Hash(amount) {
  const step2Data = `summa=${amount}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
  return generateMD5Hash(step2Data);
}

// Final signature: SHA256 of combined Step 1 and Step 2
function generateFinalSignature(step1Hash, step2Hash) {
  return generateSHA256Hash(step1Hash + step2Hash);
}

// Generate 'confirm' value
function generateConfirm(userid) {
  return generateMD5Hash(`${userid}:${CASHDESK_HASH}`);
}

// Make the API call to CashDesk
async function makeCashDeskDeposit(userid, amount) {
  try {
    // Generate Step 1 and Step 2 hashes
    const step1Hash = generateStep1Hash(userid);
    console.log('Step 1 Hash:', step1Hash);

    const step2Hash = generateStep2Hash(amount);
    console.log('Step 2 Hash:', step2Hash);

    // Generate the final signature
    const finalSignature = generateFinalSignature(step1Hash, step2Hash);
    console.log('Final Signature:', finalSignature);

    // Generate the 'confirm' value
    const confirm = generateConfirm(userid);
    console.log('Confirm:', confirm);

    // Prepare the payload
    const depositPayload = {
      cashdeskid: parseInt(CASHDESK_ID),
      lng: 'ru',
      summa: parseFloat(amount),
      confirm: confirm
    };

    // Make the API request
    const response = await axios.post(
      `${API_URL}${userid}/Add`,
      depositPayload,
      {
        headers: {
          'sign': finalSignature,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('API Response:', response.data);

    if (response.data.success) {
      console.log('Deposit successful!');
    } else {
      console.error('Deposit failed:', response.data.message);
    }
  } catch (error) {
    console.error('Error making CashDesk API call:', error.message);
  }
}

// Example usage: Replace these with actual user ID and amount
const userId = '1355931989'; // Replace with actual User ID
const amount = 100; // Replace with the actual deposit amount

makeCashDeskDeposit(userId, amount);
