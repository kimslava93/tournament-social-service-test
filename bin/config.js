const currentEnv = process.env.NODE_ENV || 'development';
function getconnectionString(host, port, name) {
  return `mongodb://${host}:${port}/${name}`;
}
const defaultConfigs = {
  db: {
    name: 'tournament-service',
    host: process.env.MONGO_URL || 'localhost',
    port: process.env.MONGO_PORT || 27017,
    connectionString() {
      return getconnectionString(this.host, this.port, this.name);
    },
  },
};
const environmentConfigs = {
  development: {},
  tests: {
    db: {
      name: 'tournament-service-test',
      host: process.env.MONGO_URL || 'localhost',
      port: process.env.MONGO_PORT || 27017,
      connectionString() {
        return getconnectionString(this.host, this.port, this.name);
      },
    },
  },
  production: {},
};

const resultConfigs = Object.assign(defaultConfigs, environmentConfigs[currentEnv]);

module.exports = Object.freeze(resultConfigs);
