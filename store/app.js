// Passenger entry point for Next.js standalone server
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = '0.0.0.0';
process.env.NEXT_PUBLIC_API_URL = 'https://inaya-api.eastlogic.com';
process.env.API_URL = 'https://inaya-api.eastlogic.com';
process.env.NEXT_PUBLIC_SITE_URL = 'https://inaya.eastlogic.com';

require('./server.js');
