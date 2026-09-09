/**
 * Metro configuration for CareGrid Mobile
 * Configured for pnpm workspace monorepo:
 *   - watchFolders includes workspace root so @rhcp/shared-types and @rhcp/config resolve
 *   - nodeModulesPaths searches both the app's local node_modules and the root node_modules
 */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    // Prevent duplicate React from being bundled when multiple packages reference it
    extraNodeModules: {
      react: path.resolve(workspaceRoot, 'node_modules/react'),
      'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
