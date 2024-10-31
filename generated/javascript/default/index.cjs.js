const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'CS 307 Project',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

