const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [HTTP] ${method} ${originalUrl} ${statusCode} - ${duration}ms (${ip})`
    );
  });

  next();
};

module.exports = requestLogger;

