const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude 'module' field so Metro uses 'main' (CJS) instead of ESM
// for packages like @supabase/realtime-js that lack an 'exports' field
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
