import { seedDatabase } from '../src/lib/seedDatabase.js';

export { seedDatabase };

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((e) => {
      console.error('[Seed Error]:', e);
      process.exit(1);
    });
}
