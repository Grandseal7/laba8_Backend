
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({
  path: '.env.test',
  override: true
});

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    coverage: {
      include: [
        'app.js',
        'routes/**/*.js',
        'middleware/**/*.js'
      ]
    }
  }
});
