// services/cashDeskConfigService.js

const CashDeskConfig = require("../Models/CashDeskConfig");


let cachedConfig = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

class CashDeskConfigService {
  static async getConfig() {
    const now = Date.now();
    
    // Return cached config if it's still valid
    if (cachedConfig && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedConfig;
    }
    
    try {
      // Get the active configuration
      const config = await CashDeskConfig.findOne({ isActive: true }).lean();
      
      if (!config) {
        // Fallback to environment variables
        return this.getFallbackConfig();
      }
      
      // Cache the configuration
      cachedConfig = config;
      lastFetchTime = now;
      
      return config;
    } catch (error) {
      console.error('Error fetching CashDesk configuration:', error);
      return this.getFallbackConfig();
    }
  }
  
  static getFallbackConfig() {
    return {
      apiBase: process.env.CASHDESK_API_BASE || 'https://partners.servcul.com/CashdeskBotAPI',
      hash: process.env.CASHDESK_HASH || 'a13d615c8ee6f83a12a0645de4d9a1c4068148562f2ea165dea920c66af2ed90',
      cashierPass: process.env.CASHIER_PASS || '901276',
      cashierLogin: process.env.CASHIER_LOGIN || 'MuktaA1',
      cashDeskId: process.env.CASHDESK_ID || '1177830',
      defaultLng: process.env.DEFAULT_LNG || 'en'
    };
  }
  
  static async updateConfig(newConfig, userId) {
    const session = await CashDeskConfig.startSession();
    session.startTransaction();
    
    try {
      // Deactivate all existing configurations
      await CashDeskConfig.updateMany(
        { isActive: true },
        { isActive: false },
        { session }
      );
      
      // Create new active configuration
      const config = new CashDeskConfig({
        ...newConfig,
        isActive: true,
        createdBy: userId,
        updatedBy: userId
      });
      
      await config.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Clear cache to force refresh on next request
      this.clearCache();
      
      return config;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Error updating CashDesk configuration:', error);
      throw error;
    }
  }
  
  static async getConfigHistory() {
    try {
      return await CashDeskConfig.find()
        .sort({ createdAt: -1 })
        .populate('createdBy', 'username email')
        .populate('updatedBy', 'username email');
    } catch (error) {
      console.error('Error fetching config history:', error);
      throw error;
    }
  }
  
  static clearCache() {
    cachedConfig = null;
    lastFetchTime = 0;
  }
}

module.exports = CashDeskConfigService;