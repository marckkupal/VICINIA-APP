/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Hide the yellow warning banner while testing on a device.
// Remove this line before releasing so you can see real warnings.
LogBox.ignoreAllLogs(true);

AppRegistry.registerComponent(appName, () => App);