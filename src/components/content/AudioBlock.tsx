import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Play, Pause} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import {
  createAudioPlayer,
  AudioPlayer,
  AudioStatus,
  setAudioModeAsync,
} from 'expo-audio';
import {useTheme} from '@/components/shared';
import type {ContentBlock, AudioBlockContent} from '@/types';

interface AudioBlockProps {
  block: ContentBlock;
}

export const AudioBlock: React.FC<AudioBlockProps> = ({block}) => {
  const {colors} = useTheme();
  const content = block.content as AudioBlockContent;
  const [player, setPlayer] = useState<AudioPlayer | null>(null);
  const [status, setStatus] = useState<AudioStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't create player if URL is empty or invalid
  const hasValidUrl = content.url && content.url.trim() !== '';

  useEffect(() => {
    if (!hasValidUrl) {
      return;
    }

    let audioPlayer: AudioPlayer | null = null;
    let statusSubscription: any = null;

    const initPlayer = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Ensure audio mode is configured for playback
        await setAudioModeAsync({
          playsInSilentMode: true,
        });

        console.log('[AudioBlock] Creating player for URL:', content.url);
        // Use object syntax for source
        const source = {uri: content.url};
        // Don't use downloadFirst for remote URLs - it's only for local assets
        audioPlayer = createAudioPlayer(source);
        console.log('[AudioBlock] Player created successfully');

        setPlayer(audioPlayer);

        // Get initial status from the player
        const initialStatus = audioPlayer.currentStatus;
        console.log('[AudioBlock] Initial status:', initialStatus);
        setStatus(initialStatus);

        statusSubscription = audioPlayer.addListener(
          'playbackStatusUpdate',
          newStatus => {
            console.log('[AudioBlock] Status update:', {
              playing: newStatus.playing,
              isLoaded: newStatus.isLoaded,
              isBuffering: newStatus.isBuffering,
              currentTime: newStatus.currentTime,
              duration: newStatus.duration,
              didJustFinish: newStatus.didJustFinish,
            });
            setStatus(newStatus);

            // Clear loading state once the audio is loaded
            if (newStatus.isLoaded) {
              setIsLoading(false);
            } else if (newStatus.isBuffering !== undefined) {
              setIsLoading(newStatus.isBuffering);
            }

            if (newStatus.didJustFinish) {
              audioPlayer?.seekTo(0);
              audioPlayer?.pause();
            }
          },
        );

        console.log('[AudioBlock] Listeners attached');

        // Clear loading state after a short delay if we haven't received a status update
        // This prevents the spinner from showing forever if the player loads instantly
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('[AudioBlock] Error creating player:', err);
        setError('Failed to load audio');
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      if (statusSubscription) {
        statusSubscription.remove();
      }
      if (audioPlayer) {
        console.log('[AudioBlock] Cleaning up player');
        audioPlayer.remove();
      }
    };
  }, [content.url, hasValidUrl]);

  const formatTime = (seconds: number) => {
    // Handle NaN, Infinity, and invalid values
    if (!isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayback = () => {
    if (!player || !hasValidUrl) {
      return;
    }

    if (status?.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const onSliderValueChange = (value: number) => {
    if (player && status && isFinite(status.duration) && status.duration > 0) {
      player.seekTo(value);
    }
  };

  // Get safe values for slider - default to 0 if NaN or invalid
  const duration = status?.duration || 0;
  const currentTime = status?.currentTime || 0;

  const safeDuration = isFinite(duration) && duration > 0 ? duration : 1;
  const safeCurrentTime =
    isFinite(currentTime) && currentTime >= 0 ? currentTime : 0;
  const isBuffering = status?.isBuffering || isLoading;
  const isPlaying = status?.playing || false;

  const styles = StyleSheet.create({
    container: {
      marginVertical: 10,
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      padding: 12,
    },
    errorContainer: {
      backgroundColor: colors.surfaceSubtle,
      padding: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
    },
    playerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    playButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    playButtonDisabled: {
      backgroundColor: colors.borderSubtle,
    },
    progressContainer: {
      flex: 1,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    timeText: {
      fontSize: 12,
      color: colors.text.secondary,
      fontVariant: ['tabular-nums'],
    },
    caption: {
      marginTop: 8,
      fontSize: 16,
      color: colors.text.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    description: {
      marginTop: 4,
      fontSize: 14,
      color: colors.text.secondary,
      fontStyle: 'italic',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {!hasValidUrl && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No audio URL provided</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.playerContainer}>
        <TouchableOpacity
          onPress={togglePlayback}
          style={[
            styles.playButton,
            (!hasValidUrl || !!error) && styles.playButtonDisabled,
          ]}
          disabled={!hasValidUrl || !!error}>
          {isBuffering ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : isPlaying ? (
            <Pause
              size={24}
              color={
                hasValidUrl && !error ? colors.white : colors.text.secondary
              }
            />
          ) : (
            <Play
              size={24}
              color={
                hasValidUrl && !error ? colors.white : colors.text.secondary
              }
            />
          )}
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={safeDuration}
            value={safeCurrentTime}
            onSlidingComplete={onSliderValueChange}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            disabled={!hasValidUrl || !!error}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(safeCurrentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(safeDuration)}</Text>
          </View>
        </View>
      </View>
      {content.title && <Text style={styles.caption}>{content.title}</Text>}
      {content.description && (
        <Text style={styles.description}>{content.description}</Text>
      )}
    </View>
  );
};
