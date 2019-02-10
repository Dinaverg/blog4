'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://Dina:thinkful1@ds213705.mlab.com:13705/blog';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-blog-app';
exports.PORT = process.env.PORT || 8080;