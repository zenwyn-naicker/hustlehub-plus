// Executed by mongosh inside the one-off mongo-init service, not by Node.
const connection = new Mongo('mongodb://mongo:27017/?directConnection=true');
const admin = connection.getDB('admin');
if (!admin.auth('root', process.env.MONGO_ROOT_PASSWORD)) throw new Error('MongoDB setup authentication failed.');
try { admin.runCommand({ replSetGetStatus: 1 }); }
catch (error) {
  if (error.code !== 94) throw error;
  const initiated = admin.runCommand({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: 'mongo:27017' }] } });
  if (!initiated.ok) throw new Error('Replica set initialization failed.', { cause: error });
}
let primary = false;
for (let attempt = 0; attempt < 60; attempt++) {
  if (admin.runCommand({ hello: 1 }).isWritablePrimary) { primary = true; break; }
  sleep(1000);
}
if (!primary) throw new Error('MongoDB primary did not become ready.');
const appDb = connection.getDB('hustlehub');
if (!appDb.getUser('hustlehub')) appDb.createUser({ user: 'hustlehub', pwd: process.env.MONGO_APP_PASSWORD, roles: [{ role: 'readWrite', db: 'hustlehub' }] });
print('Replica set and restricted application user are ready.');