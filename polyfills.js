// Polyfill for NativeJSLogger to prevent crashes in React Native 0.81.5
// This must be imported before any other React Native code

// Set up a safe logging hook before React Native initializes
if (global.nativeLoggingHook === undefined) {
  global.nativeLoggingHook = function () {
    // No-op: prevent crashes when native logger is not available
  };
}
