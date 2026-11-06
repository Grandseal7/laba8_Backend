import pg from 'pg';

// DATE возвращаем строкой YYYY-MM-DD, чтобы дата не смещалась из-за часового пояса.
pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (error) => {
  console.error('Ошибка неактивного соединения PostgreSQL:', error.message);
});