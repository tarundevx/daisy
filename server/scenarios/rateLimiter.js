const rateLimiter = {
  id: 'rate_limiter',
  name: 'Rate Limiter & Cache Layer',
  description: 'Implement a sliding-window rate limiter and caching layer in Node.js.',
  commandMap: {},
  isSolved: (history, command) => {
    // In code sandbox, "solved" is determined by test results in the frontend,
    // but we can log a 'tests_passed' event to trigger it here if needed.
    return command === 'tests_passed';
  }
};

module.exports = rateLimiter;
