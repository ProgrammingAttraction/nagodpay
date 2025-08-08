// Routes/cashdesk.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

require('dotenv').config();

const CASHDESK_API_BASE = process.env.CASHDESK_API_BASE || 'https://partners.servcul.com/CashdeskBotAPI';
const CASHDESK_HASH = process.env.CASHDESK_HASH || process.env.CASHDESK_HASH_FALLBACK || ''; // MUST set in .env
const CASHIER_PASS = process.env.CASHIER_PASS || '901276'; // you provided this, but keep in .env
const CASHIER_LOGIN = process.env.CASHIER_LOGIN || 'MuktaA1';
const CASHDESK_ID = process.env.CASHDESK_ID || '1177830';
const DEFAULT_LNG = process.env.DEFAULT_LNG || 'ru';

/**
 * Helpers
 */
function sha256Hex(str) {
  return crypto.createHash('sha256').update(String(str), 'utf8').digest('hex');
}
function md5Hex(str) {
  return crypto.createHash('md5').update(String(str), 'utf8').digest('hex');
}

/**
 * POST /api/cashdesk/deposit
 * Body: { userId: number|string, summa: number|string, lng?: string }
 *
 * Performs:
 * 1) SHA256("hash={hash}&lng={lng}&userid={userId}")
 * 2) MD5("summa={summa}&cashierpass={cashierpass}&cashdeskid={cashdeskid}")
 * 3) SHA256(step1 + step2) -> header 'sign'
 * confirm = MD5("{userId}:{hash}")
 */
router.post('/deposit', async (req, res) => {
  try {
    const { userId, summa, lng = DEFAULT_LNG } = req.body;

    if (!userId || (typeof summa === 'undefined' || summa === null || summa === '')) {
      return res.status(400).json({ success: false, message: 'Missing userId or summa' });
    }

    if (!CASHDESK_HASH) {
      return res.status(500).json({ success: false, message: 'Server misconfigured: CASHDESK_HASH not set' });
    }

    // Step 1
    const step1Input = `hash=${CASHDESK_HASH}&lng=${lng}&userid=${userId}`;
    const step1 = sha256Hex(step1Input);

    // Step 2
    const step2Input = `summa=${summa}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
    const step2 = md5Hex(step2Input);

    // Step 3: final sign
    const sign = sha256Hex(step1 + step2);

    // confirm
    const confirm = md5Hex(`${userId}:${CASHDESK_HASH}`);

    const body = {
      cashdeskid: Number(CASHDESK_ID),
      lng,
      summa: Number(summa),
      confirm
    };

    const url = `${CASHDESK_API_BASE}/Deposit/${userId}/Add`;

    const response = await axios.post(url, body, {
      headers: {
        sign,
        cashierlogin: CASHIER_LOGIN // include if expected; harmless if ignored
      },
      timeout: 15000
    });

    // return the remote response
    return res.json({
      success: true,
      remote: response.data
    });
  } catch (err) {
    console.error('Cashdesk deposit error:', err?.response?.data || err.message || err);
    const status = err?.response?.status || 500;
    return res.status(status).json({
      success: false,
      message: err?.response?.data?.message || 'Cashdesk deposit failed',
      details: err?.response?.data || err.message
    });
  }
});

module.exports = router;
