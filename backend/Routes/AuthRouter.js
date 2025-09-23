const { 
  signup, 
  login, 
  checkUsername, 
  adminLogin, 
  verifyAdminOTP, 
  resendAdminOTP,
  verifyAdminOTPMiddleware 
} = require('../Controllers/AuthController');
const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');
const multer = require('multer');
const router = require('express').Router();

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Public routes
router.post('/login', loginValidation, login);
router.post('/signup', upload.single("identity"), signup);
router.get('/check-username/:username', checkUsername);

// Admin OTP routes
router.post('/admin/login', adminLogin);
router.post('/admin/verify-otp', verifyAdminOTP);
router.post('/admin/resend-otp', resendAdminOTP);

module.exports = router;