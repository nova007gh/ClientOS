import 'dotenv/config';
import { startWorkers } from './processors';

const workers = startWorkers();

console.log('ClientOS Worker started — processing queues:');
workers.forEach((w) => {
  console.log(`  - ${w.name}`);
});

async function shutdown() {
  console.log('\nShutting down workers...');
  await Promise.all(workers.map((w) => w.close()));
  console.log('All workers stopped.');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
