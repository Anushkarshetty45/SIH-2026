/**
 * CareGrid React Native Application Entry Point
 *
 * This file is the native Android/iOS entry point.
 * AppRegistry.registerComponent must match the "name" in app.json
 * and the string returned by MainActivity.getMainComponentName().
 */
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
