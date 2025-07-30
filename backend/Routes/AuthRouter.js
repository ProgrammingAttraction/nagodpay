const { signup, login, checkUsername, adminLogin } = require('../Controllers/AuthController');
const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');
const multer= require('multer');
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
router.post('/login', loginValidation, login);
router.post('/signup',upload.single("identity"),signup);
// New username availability check route
router.get('/check-username/:username', checkUsername);
router.post('/admin/login', adminLogin);
module.exports = router;