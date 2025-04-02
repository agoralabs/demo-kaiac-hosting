const requestLogger = (req, res, next) => {
    console.log('----------------------------------------');
    console.log('New Request:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('----------------------------------------');
    next();
};

module.exports = requestLogger;