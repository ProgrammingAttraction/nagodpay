// server.js (your main file)
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const AuthRouter = require('./Routes/AuthRouter');
const ProductRouter = require('./Routes/ProductRouter');
const Adminroute = require('./Routes/Adminroute');
const Userrouter = require('./Routes/Userroute');
const Paymentrouter = require('./Routes/payment');
const Merchantrouter = require('./Routes/Merchantrouter');
const CashdeskRouter = require('./Routes/cashdesk'); // <-- new

require('dotenv').config();
require('./Models/db');

const PORT = process.env.PORT || 8080;

app.get('/ping', (req, res) => {
    res.send('PONG');
});

app.use(bodyParser.json());
app.use(cors( {
  origin:[
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:3000",
      "https://pi2payz.com",
      "https://admin.pi2payz.com",
      "https://pi2payz.nagodpay.com",
      "https://2admin.nagodpay.com",
      "https://mysite.tech10bd.com",
      "https://myadmin.tech10bd.com",
      "https://admin.nagodpay.com",
      "https://nagodpay.com",
      "*",
    ],
  methods: ["GET", "POST", "PUT", "DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"," x-api-key"],
  credentials: true,
  optionsSuccessStatus:200,
}));

app.use(express.static('public')); // Serve static files from 'public' directory
app.use('/auth', AuthRouter);
app.use('/products', ProductRouter);
app.use('/api/admin', Adminroute);
app.use('/api/user',Userrouter);
app.use('/api/payment',Paymentrouter);
app.use('/api/merchant',Merchantrouter);

// NEW: cashdesk route
app.use('/api/cashdesk', CashdeskRouter);

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
});
