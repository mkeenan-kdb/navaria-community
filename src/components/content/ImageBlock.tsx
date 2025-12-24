import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {Image} from 'expo-image';
import {useTheme} from '@/components/shared';
import {typography, spacing, borderRadius} from '@/theme';
import type {ContentBlock, ImageBlockContent} from '@/types/content';

interface Props {
  block: ContentBlock;
  containerWidth?: number;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// Timeout for image loading (30 seconds)
const IMAGE_LOAD_TIMEOUT = 30000;

export const ImageBlock: React.FC<Props> = ({block, containerWidth}) => {
  const {colors} = useTheme();
  const content = block.content as ImageBlockContent;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dynamicAspectRatio, setDynamicAspectRatio] = useState(
    content.aspectRatio || 16 / 9,
  );

  // Set a timeout for image loading
  useEffect(() => {
    if (!content.url) {
      return;
    }

    const timeout = setTimeout(() => {
      if (loading) {
        console.error('[ImageBlock] Image load timeout:', content.url);
        setLoading(false);
        setError(true);
      }
    }, IMAGE_LOAD_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [loading, content.url]);

  // Debug logging
  if (!content.url) {
    console.warn('[ImageBlock] Missing URL in content:', content);
    return null;
  }

  /*console.log('[ImageBlock] Rendering image:', content.url);*/

  const availableWidth = containerWidth || SCREEN_WIDTH;
  const imageWidth = content.fullWidth
    ? availableWidth
    : availableWidth - spacing.md * 2;
  const imageHeight = imageWidth / dynamicAspectRatio;

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: content.fullWidth ? 0 : spacing.md,
    },
    image: {
      width: imageWidth,
      height: imageHeight,
      borderRadius: content.fullWidth ? 0 : borderRadius.md,
      backgroundColor: colors.surfaceSubtle,
    },
    caption: {
      marginTop: spacing.xs,
      fontSize: typography.sizes.sm,
      color: colors.text.secondary,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingHorizontal: spacing.md,
    },
    loadingContainer: {
      width: imageWidth,
      height: imageHeight,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: content.fullWidth ? 0 : borderRadius.md,
    },
    errorText: {
      fontSize: typography.sizes.sm,
      color: colors.error,
      textAlign: 'center',
      padding: spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      {error && (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Failed to load image{'\n'}
            <Text style={{fontSize: typography.sizes.xs}}>
              {content.url.substring(0, 50)}...
            </Text>
          </Text>
        </View>
      )}
      <Image
        source={{uri: content.url}}
        style={[
          styles.image,
          (loading || error) && {opacity: 0, position: 'absolute'},
        ]}
        contentFit="cover"
        transition={200}
        accessibilityLabel={content.alt || content.caption || 'Image'}
        cachePolicy="memory-disk"
        onLoad={event => {
          /*console.log('[ImageBlock] Image loaded successfully:', content.url);*/
          const {width, height} = event.source;
          if (width && height) {
            setDynamicAspectRatio(width / height);
          }
          setLoading(false);
          setError(false);
        }}
        onError={event => {
          console.error('[ImageBlock] Failed to load image:', content.url);
          console.error('[ImageBlock] Error details:', event.error);
          setLoading(false);
          setError(true);
        }}
        onLoadEnd={() => {
          /*console.log('[ImageBlock] Image load ended:', content.url);*/
        }}
      />
      {content.caption && !error && (
        <Text style={styles.caption}>{content.caption}</Text>
      )}
    </View>
  );
};
