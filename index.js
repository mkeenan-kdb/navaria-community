import './polyfills';
// Initialize Reanimated before gesture-handler
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import {registerRootComponent} from 'expo';
import App from './App';

// Register the main application component
// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);
