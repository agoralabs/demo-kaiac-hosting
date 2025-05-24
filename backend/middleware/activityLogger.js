const ActivityLogger = require('../services/activityLogger');

function activityLoggerMiddleware(req, res, next) {
  const oldSend = res.send;
  
  res.send = function(data) {
    // Loguer après l'envoi de la réponse
    if (req.user 
        && !req.path.startsWith('/auth')
        && req.method != "GET") {
      
        ActivityLogger.logActivity({
          user_id: req.user.id,
          method:req.method,
          path:req.path,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          status: res.statusCode < 400 ? 'success' : 'failed',
          ...(res.statusCode >= 400 && { error_message: data.message || 'Unknown error' })
        }).catch(console.error);
    }
    
    oldSend.apply(res, arguments);
  };
  
  next();
}

module.exports = activityLoggerMiddleware;