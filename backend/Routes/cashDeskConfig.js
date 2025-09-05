const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// CashDesk Configuration Model
const CashDeskConfigSchema = new mongoose.Schema({
  cashdeskId: { type: String, required: true, unique: true },
  cashdesk: { type: String, required: true },
  cashdeskHash: { type: String, required: true },
  cashierPass: { type: String, required: true },
  cashierLogin: { type: String, required: true },
  cashdeskApiBase: { type: String, required: true },
  defaultLng: { type: String, default: 'en' },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure only one active configuration exists
CashDeskConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
const CashDeskConfig = mongoose.model('CashDeskConfig', CashDeskConfigSchema);

// Configuration caching
let cachedConfig = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Service functions
const getActiveConfig = async () => {
  const now = Date.now();
  
  // Return cached config if it's still valid
  if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedConfig;
  }
  
  try {
    // Get the active configuration
    const allConfigs = await CashDeskConfig.find();
    console.log('All configs:', allConfigs);
    
    const config = await CashDeskConfig.findOne({ isActive: true }).lean();
    console.log("config", config)
    if (!config) {
      // Fallback to environment variables
      return {
        cashdeskId: process.env.CASHDESK_ID || '1177830',
        cashdesk: 'Default CashDesk',
        cashdeskHash: process.env.CASHDESK_HASH || 'a13d615c8ee6f83a12a0645de4d9a1c4068148562f2ea165dea920c66af2ed90',
        cashierPass: process.env.CASHIER_PASS || '901276',
        cashierLogin: process.env.CASHIER_LOGIN || 'MuktaA1',
        cashdeskApiBase: process.env.CASHDESK_API_BASE || 'https://partners.servcul.com/CashdeskBotAPI',
        defaultLng: process.env.DEFAULT_LNG || 'en'
      };
    }
    
    // Cache the configuration
    cachedConfig = config;
    lastFetchTime = now;
    
    return config;
  } catch (error) {
    console.error('Error fetching CashDesk configuration:', error);
    return {
      cashdeskId: process.env.CASHDESK_ID || '1177830',
      cashdesk: 'Default CashDesk',
      cashdeskHash: process.env.CASHDESK_HASH || 'a13d615c8ee6f83a12a0645de4d9a1c4068148562f2ea165dea920c66af2ed90',
      cashierPass: process.env.CASHIER_PASS || '901276',
      cashierLogin: process.env.CASHIER_LOGIN || 'MuktaA1',
      cashdeskApiBase: process.env.CASHDESK_API_BASE || 'https://partners.servcul.com/CashdeskBotAPI',
      defaultLng: process.env.DEFAULT_LNG || 'en'
    };
  }
};

const getAllConfigs = async () => {
  try {
    return await CashDeskConfig.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error fetching all CashDesk configurations:', error);
    throw error;
  }
};
// createConfig (no sessions)
const createConfig = async (configData) => {
  try {
    if (configData.isActive) {
      await CashDeskConfig.updateMany({ isActive: true }, { $set: { isActive: false } });
    }
    const config = await CashDeskConfig.create(configData);

    cachedConfig = null; lastFetchTime = 0;
    return config;
  } catch (error) {
    if (error.code === 11000) throw new Error('CashDesk ID already exists');
    throw error;
  }
};

const updateConfig = async (id, configData) => {
  try {
    if (configData.isActive) {
      await CashDeskConfig.updateMany({ isActive: true, _id: { $ne: id } }, { $set: { isActive: false } });
    }
    const config = await CashDeskConfig.findByIdAndUpdate(
      id, configData, { new: true, runValidators: true }
    );
    if (!config) throw new Error('CashDesk configuration not found');

    cachedConfig = null; lastFetchTime = 0;
    return config;
  } catch (error) {
    if (error.code === 11000) throw new Error('CashDesk ID already exists');
    throw error;
  }
};

const toggleStatus = async (id) => {
  const config = await CashDeskConfig.findById(id);
  if (!config) throw new Error('CashDesk configuration not found');

  if (!config.isActive) {
    await CashDeskConfig.updateMany({ isActive: true }, { $set: { isActive: false } });
  }
  config.isActive = !config.isActive;
  await config.save();

  cachedConfig = null; lastFetchTime = 0;
  return config;
};


const deleteConfig = async (id) => {
  try {
    const config = await CashDeskConfig.findById(id);
    
    if (!config) {
      throw new Error('CashDesk configuration not found');
    }
    
    // If deleting the active config, clear cache
    if (config.isActive) {
      cachedConfig = null;
      lastFetchTime = 0;
    }
    
    await CashDeskConfig.findByIdAndDelete(id);
    
    return { message: 'CashDesk configuration deleted successfully' };
  } catch (error) {
    console.error('Error deleting CashDesk configuration:', error);
    throw error;
  }
};


// API Routes
router.get('/active', async (req, res) => {
  try {
    const config = await getActiveConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const configs = await getAllConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const configData = req.body;
    
    // Validate required fields
    const requiredFields = ['cashdeskId', 'cashdesk', 'cashdeskHash', 'cashierPass', 'cashierLogin', 'cashdeskApiBase'];
    const missingFields = requiredFields.filter(field => !configData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    const config = await createConfig(configData);
    res.status(201).json({ 
      success: true, 
      message: 'CashDesk configuration created successfully', 
      data: config 
    });
  } catch (error) {
    console.log(error)
    if (error.message.includes('already exists')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const configData = req.body;
    
    const config = await updateConfig(id, configData);
    res.json({ 
      success: true, 
      message: 'CashDesk configuration updated successfully', 
      data: config 
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes('already exists')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteConfig(id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await toggleStatus(id);
    res.json({ 
      success: true, 
      message: `CashDesk configuration ${config.isActive ? 'activated' : 'deactivated'} successfully`, 
      data: config 
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Export the router and the getActiveConfig function for use in other files
module.exports = {
  router,
  getActiveConfig
};