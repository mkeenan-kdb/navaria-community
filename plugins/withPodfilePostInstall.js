const {withDangerousMod} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom Expo config plugin to add RNReanimated/Folly fix to Podfile
 * This ensures the fix persists across prebuild operations
 */
module.exports = function withPodfilePostInstall(config) {
  return withDangerousMod(config, [
    'ios',
    async c => {
      const podfilePath = path.join(
        c.modRequest.platformProjectRoot,
        'Podfile',
      );

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Check if the fix is already present
      if (podfileContent.includes('FOLLY_CFG_NO_COROUTINES=1')) {
        console.log('✅ RNReanimated/Folly fix already present in Podfile');
        return c;
      }

      // Add the post_install hook fix
      const postInstallFix = `
  post_install do |installer|
    # Fix for Folly coroutine header issue in RN 0.81.5 and enforce deployment target
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
      end

      if target.name == 'RNReanimated'
        target.build_configurations.each do |config|
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_CFG_NO_COROUTINES=1' unless config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'].include?('FOLLY_CFG_NO_COROUTINES=1')
        end
      end
    end
    `;

      // Find the existing post_install block and insert our fix at the beginning
      const postInstallRegex = /post_install do \|installer\|/;
      if (postInstallRegex.test(podfileContent)) {
        // Insert our code right after the post_install line
        podfileContent = podfileContent.replace(
          postInstallRegex,
          postInstallFix.trim(),
        );
      } else {
        // If no post_install block exists, add one before the final 'end'
        const endRegex = /\nend\s*$/;
        podfileContent = podfileContent.replace(
          endRegex,
          postInstallFix + '\n  end\nend\n',
        );
      }

      fs.writeFileSync(podfilePath, podfileContent);
      console.log('✅ Added RNReanimated/Folly fix to Podfile');

      return c;
    },
  ]);
};
