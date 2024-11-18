// cache.js
const NodeCache = require("node-cache");
const certificatesCache = new NodeCache({ stdTTL: 10000 });
const servicesCache = new NodeCache({ stdTTL: 10000 });

const sessionCache = new NodeCache({ stdTTL: 10000}); // 5 min TTL, checks every minute

module.exports = {
    setSession: (chatId, sessionData) => sessionCache.set(chatId, sessionData),
    getSession: (chatId) => sessionCache.get(chatId),
    deleteSession: (chatId) => sessionCache.del(chatId),
    flushAllSessions: () => sessionCache.flushAll(), // Clears all sessions (if needed),
    certificatesCache,
    servicesCache
};
