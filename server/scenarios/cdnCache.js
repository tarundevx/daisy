module.exports = {
  id: 'cdn_cache_poisoning',
  title: 'CDN Cache Inconsistency',
  description: 'Users are reporting seeing old content even after multiple deployments. Investigate the CDN purging and TTL.',
  difficulty: 'intermediate',
  commandMap: {
    'curl -I https://api.daisy.com/v1/data': 'HTTP/1.1 200 OK\nCache-Control: public, max-age=31536000\nX-Cache: HIT from cloudfront\nLast-Modified: Mon, 01 Mar 2026 12:00:00 GMT',
    'grep TTL config.nginx': 'proxy_cache_valid 200 365d;',
    'sed -i "s/365d/1h/" config.nginx': 'Nginx TTL updated: 200 OK responses saved for 1 hour.',
    'nginx -s reload': 'Nginx reloaded successfully.',
    'aws cloudfront create-invalidation --distribution-id E123 --paths "/*"': 'Invalidation ID: I-98234 created. Purging cache nodes...'
  },
  isSolved: (history) => history.some(h => h.includes('cloudfront')) && history.some(h => h.includes('reload'))
};
