const PayinTransaction = require("../model/PayinTransaction.js");
const User = require("../model/User.js");
const axios = require('axios');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const { sign } = crypto;
const merchant_model = require("../model/Merchnatmodel.js");
const Agent_model = require("../model/Agentregistration.js");



function generate256Hash(data) {
  // Use SHA256 to generate a hash
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// const BKASH_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout'; 
let BKASH_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';
// const BKASH_USERNAME = '01894292898'; 
let BKASH_USERNAME = '01711799891';
// const BKASH_PASSWORD = 'VOqd7H]5j[!'; 
let BKASH_PASSWORD = 'b8t|m:1I|oF';
// const BKASH_APP_KEY = '2aTnOgA6sdaZ5hz9SfPK4Aajtc'; 
let BKASH_APP_KEY = 'bMk6yA8dUSi1RjEKjURQablGtc';
// const BKASH_APP_SECRET_KEY = 'vHqUepso0iRbToaEe4O1Vwl0b2tBDnPylSDX2hSq8g1hNd05V2Gr'; 
let BKASH_APP_SECRET_KEY = 'qbl6yK033pPGUeKyJFs2oppUPPeNyJHZn62oOOkMaU3qA0GecnEC';

const get_token_bkash = async () => {
  try {
    const body = {
      app_key: BKASH_APP_KEY, 
      app_secret: BKASH_APP_SECRET_KEY
    };

    const tokenObj = await axios.post(`${BKASH_URL}/token/grant`, body, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD
      }
    });
    // console.log('bkash-get-token-resp', tokenObj.data);
    return tokenObj.data.id_token;

  } catch (error) {

    console.log('bkash-get-token-error', error);

    return null;
  }  
}