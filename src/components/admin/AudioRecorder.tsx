import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorderState,
  createAudioPlayer,
  AudioPlayer,
} from 'expo-audio';
import {useTheme} from '@/components/shared';
import {Play, Pause, Mic, Square, X} from 'lucide-react-native';

interface Props {
  onRecordingComplete: (uri: string) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<Props> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const {colors} = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [previewPlayer, setPreviewPlayer] = useState<AudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize recorder with high quality preset
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, _status => {
    // Optional: Handle status updates if needed
  });

  const recorderState = useAudioRecorderState(recorder, 100); // Update every 100ms

  useEffect(() => {
    checkPermissions();
    return () => {
      // Cleanup player on unmount
      if (previewPlayer) {
        previewPlayer.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPermissions = async () => {
    try {
      const {granted} = await requestRecordingPermissionsAsync();
      setHasPermission(granted);
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is needed to record audio.',
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setHasPermission(false);
    }
  };

  const handleStartRecording = async () => {
    if (!hasPermission) {
      await checkPermissions();
      return;
    }

    try {
      // If we have a previous recording/player, clean it up
      if (previewPlayer) {
        previewPlayer.remove();
        setPreviewPlayer(null);
        setIsPlaying(false);
      }

      if (!recorder.isRecording) {
        await recorder.prepareToRecordAsync();
        recorder.record();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const handlePlayPreview = () => {
    if (!recorder.uri) {
      return;
    }

    if (!previewPlayer) {
      const player = createAudioPlayer(recorder.uri);
      player.addListener('playbackStatusUpdate', status => {
        setIsPlaying(status.playing || false);
        if (status.didJustFinish) {
          setIsPlaying(false);
          player.seekTo(0);
        }
      });
      setPreviewPlayer(player);
      player.play();
    } else {
      if (isPlaying) {
        previewPlayer.pause();
      } else {
        previewPlayer.play();
      }
    }
  };

  const handleConfirm = () => {
    if (recorder.uri) {
      onRecordingComplete(recorder.uri);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      gap: 20,
    },
    timer: {
      fontSize: 32,
      fontWeight: 'bold',
      color: recorder.isRecording ? colors.error : colors.text.primary,
      fontVariant: ['tabular-nums'],
    },
    controls: {
      flexDirection: 'row',
      gap: 20,
      alignItems: 'center',
    },
    recordButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: recorder.isRecording ? colors.error : colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    actionButton: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 10,
    },
    confirmText: {
      color: colors.white,
      fontWeight: 'bold',
      fontSize: 16,
    },
    statusText: {
      color: colors.text.secondary,
      fontSize: 14,
    },
  });

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{color: colors.error, textAlign: 'center'}}>
          Microphone permission denied. Please enable it in settings to record
          audio.
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, {marginTop: 10}]}
          onPress={onCancel}>
          <Text style={{color: colors.text.primary}}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        {recorder.isRecording ? 'Recording...' : 'Ready to Record'}
      </Text>

      <Text style={styles.timer}>
        {formatTime((recorderState.durationMillis || 0) / 1000)}
      </Text>

      <View style={styles.controls}>
        {!recorder.isRecording && recorder.uri && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePlayPreview}>
            {isPlaying ? (
              <Pause size={24} color={colors.text.primary} />
            ) : (
              <Play size={24} color={colors.text.primary} />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.recordButton}
          onPress={
            recorder.isRecording ? handleStopRecording : handleStartRecording
          }>
          {recorder.isRecording ? (
            <Square size={32} color={colors.white} />
          ) : (
            <Mic size={32} color={colors.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
          <X size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {!recorder.isRecording && recorder.uri && (
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Use Recording</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
