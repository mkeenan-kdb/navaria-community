import React, {useCallback, useState} from 'react';
import {View, Text, Dimensions} from 'react-native';
import {VideoView, useVideoPlayer} from 'expo-video';
import YoutubePlayer from 'react-native-youtube-iframe';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {typography, spacing, borderRadius} from '@/theme';
import type {ContentBlock, VideoBlockContent} from '@/types/content';
import {ThemeColors} from '@/theme/colors';

interface Props {
  block: ContentBlock;
  containerWidth?: number;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// Helper to extract YouTube ID
const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Styles factory using theme constants
const createStyles =
  (videoWidth: number, videoHeight: number) => (colors: ThemeColors) => ({
    container: {
      marginBottom: spacing.md,
      alignItems: 'center' as const,
      width: '100%' as const,
      paddingHorizontal: spacing.md,
    },
    videoWrapper: {
      width: videoWidth,
      height: videoHeight,
      borderRadius: borderRadius.md,
      overflow: 'hidden' as const,
      backgroundColor: colors.black, // Fixed: was hardcoded 'black'
    },
    caption: {
      marginTop: spacing.xs,
      fontSize: typography.sizes.sm,
      color: colors.text.secondary,
      fontStyle: 'italic' as const,
      textAlign: 'center' as const,
    },
    video: {
      width: '100%' as const,
      height: '100%' as const,
    },
  });

export const VideoBlock: React.FC<Props> = ({block, containerWidth}) => {
  const content = block.content as VideoBlockContent;
  const [playing, setPlaying] = useState(false);

  const aspectRatio = 16 / 9;
  // Use containerWidth if provided (for preview panels), otherwise use screen width
  const availableWidth = containerWidth || SCREEN_WIDTH - spacing.md * 2;
  const videoWidth = availableWidth;
  const videoHeight = videoWidth / aspectRatio;

  const youtubeId = getYoutubeId(content.url);
  const isYoutube = !!youtubeId;

  // Only create expo-video player if NOT YouTube
  const player = useVideoPlayer(isYoutube ? '' : content.url, p => {
    p.loop = false;
  });

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const styles = useThemedStyles(createStyles(videoWidth, videoHeight));

  const renderVideoPlayer = () => {
    if (isYoutube && youtubeId) {
      return (
        <View style={styles.videoWrapper}>
          <YoutubePlayer
            height={videoHeight}
            width={videoWidth}
            play={playing}
            videoId={youtubeId}
            onChangeState={onStateChange}
            webViewProps={{
              androidLayerType: 'hardware',
              containerStyle: {borderRadius: borderRadius.md},
            }}
          />
        </View>
      );
    }

    return (
      <View style={styles.videoWrapper}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          nativeControls={content.controls !== false}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderVideoPlayer()}
      {content.caption && <Text style={styles.caption}>{content.caption}</Text>}
    </View>
  );
};
