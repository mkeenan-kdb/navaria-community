import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {supabase} from '@/services/supabase';
import {useTheme} from '@/components/shared';

import {AudioRecorder} from './AudioRecorder';
import {convertWebmToM4a} from '@/utils/audioConverter';

import {Upload, Mic} from 'lucide-react-native';

interface Props {
  onUploadComplete: (url: string, type: 'image' | 'video' | 'audio') => void;
  mediaType?: 'image' | 'video' | 'audio' | 'all';
  compact?: boolean;
  bucketName?: string;
}

export const MediaUploader: React.FC<Props> = ({
  onUploadComplete,
  mediaType = 'all',
  compact = false,
  bucketName = 'course_media',
}) => {
  const {colors} = useTheme();
  // ... (state hooks preserved)
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);

  const pickFile = async () => {
    try {
      if (mediaType === 'image') {
        const ImagePicker = await import('expo-image-picker');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled) {
          const asset = result.assets[0];
          // Convert ImagePicker asset to DocumentPicker asset format
          const docAsset: DocumentPicker.DocumentPickerAsset = {
            uri: asset.uri,
            name: asset.fileName || asset.uri.split('/').pop() || 'image.jpg',
            mimeType: asset.mimeType || 'image/jpeg',
            size: asset.fileSize || 0,
            lastModified: Date.now(),
            file: asset.file, // This assumes expo-image-picker on web returns a File object in the asset?
            // Actually expo-image-picker on web might return a uri that is a blob url, but let's check.
            // For now, let's satisfy the type.
          };
          uploadFile(docAsset);
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: mediaType === 'all' ? '*/*' : `${mediaType}/*`,
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          return;
        }

        const file = result.assets[0];
        uploadFile(file);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const uploadFile = async (file: DocumentPicker.DocumentPickerAsset) => {
    console.log('[MediaUploader] Starting upload for file:', {
      name: file.name,
      mimeType: file.mimeType,
      uri: file.uri?.substring(0, 50) + '...',
      bucketName,
    });

    setUploading(true);
    try {
      // For recordings, we might get a URI without a name/mimeType
      // Generate a name if missing
      const uri = file.uri;
      let fileExt = file.name?.split('.').pop() || 'm4a';
      const timestamp = Date.now();

      console.log('[MediaUploader] Fetching ArrayBuffer from URI...');

      // Read file as ArrayBuffer (more reliable on React Native than Blob)
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      console.log('[MediaUploader] ArrayBuffer fetched:', {
        byteLength: arrayBuffer.byteLength,
      });

      let contentType = file.mimeType || 'application/octet-stream';

      const fileName = file.name || `${timestamp}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('[MediaUploader] Uploading to Supabase:', {
        bucketName,
        filePath,
        contentType,
        size: arrayBuffer.byteLength,
      });

      // Upload to Supabase
      const {error} = await supabase.storage
        .from(bucketName)
        .upload(filePath, arrayBuffer, {
          contentType: contentType,
          upsert: true,
        });

      if (error) {
        console.error('[MediaUploader] Supabase upload error:', error);
        throw error;
      }

      console.log('[MediaUploader] Upload successful, getting public URL...');

      const {data: publicUrlData} = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log(
        '[MediaUploader] Public URL obtained:',
        publicUrlData.publicUrl,
      );

      // Determine type if not provided
      let type = 'audio';
      if (file.mimeType) {
        type = file.mimeType.startsWith('image/')
          ? 'image'
          : file.mimeType.startsWith('video/')
            ? 'video'
            : 'audio';
      } else if (mediaType !== 'all') {
        type = mediaType;
      }

      console.log('[MediaUploader] Calling onUploadComplete with:', {
        url: publicUrlData.publicUrl,
        type,
      });

      onUploadComplete(publicUrlData.publicUrl, type as any);
    } catch (error: any) {
      console.error('[MediaUploader] Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload file: ' + error.message);
    } finally {
      setUploading(false);
      setIsRecording(false);
    }
  };

  const handleRecordingComplete = async (uri: string) => {
    try {
      let finalUri = uri;
      let mimeType = 'audio/m4a';
      let fileExtension = 'm4a';

      // Convert WebM to M4A on web for better compatibility
      if (Platform.OS === 'web') {
        console.log('[MediaUploader] Converting WebM recording to M4A...');

        // Note: isConversionSupported now allows fallback conversion
        // We always attempt conversion now, with fallback to Web Audio API

        setConverting(true);
        setConversionProgress(0);

        try {
          // Fetch the WebM blob from the URI
          const response = await fetch(uri);
          const webmBlob = await response.blob();

          console.log(
            '[MediaUploader] Original WebM blob size:',
            webmBlob.size,
          );

          // Convert to M4A
          const m4aBlob = await convertWebmToM4a(webmBlob, progress => {
            console.log(
              '[MediaUploader] Conversion progress:',
              Math.round(progress * 100) + '%',
            );
            setConversionProgress(progress);
          });

          console.log('[MediaUploader] Converted M4A blob size:', m4aBlob.size);

          // Create a new blob URL for the converted audio
          finalUri = URL.createObjectURL(m4aBlob);
          // Check if it's WAV (fallback) or M4A (FFmpeg)
          const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
          mimeType = hasSharedArrayBuffer ? 'audio/mp4' : 'audio/wav'; // M4A or WAV
          fileExtension = hasSharedArrayBuffer ? 'm4a' : 'wav';
        } catch (conversionError) {
          console.error('[MediaUploader] Conversion failed:', conversionError);
          Alert.alert(
            'Conversion Failed',
            'Failed to convert audio format. The recording may not play on all devices.',
            [
              {
                text: 'Continue Anyway',
                onPress: () => proceedWithUpload(uri, 'audio/webm', 'webm'),
              },
            ],
          );
          setConverting(false);
          return;
        }

        setConverting(false);
      }

      proceedWithUpload(finalUri, mimeType, fileExtension);
    } catch (error) {
      console.error('[MediaUploader] Error processing recording:', error);
      Alert.alert('Error', 'Failed to process recording');
      setConverting(false);
    }
  };

  const proceedWithUpload = (
    uri: string,
    mimeType: string,
    fileExtension: string,
  ) => {
    console.log('[MediaUploader] proceedWithUpload called with:', {
      uri: uri.substring(0, 50) + '...',
      mimeType,
      fileExtension,
    });

    // Create a mock asset object for the upload function
    const mockAsset: DocumentPicker.DocumentPickerAsset = {
      uri,
      name: `recording_${Date.now()}.${fileExtension}`,
      mimeType: mimeType,
      size: 0, // Size unknown/irrelevant for upload
      lastModified: Date.now(),
    };
    uploadFile(mockAsset);
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: compact ? 0 : 10,
      gap: 10,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    button: {
      backgroundColor: colors.primary,
      padding: compact ? 8 : 10,
      borderRadius: compact ? 20 : 5,
      alignItems: 'center',
      minWidth: compact ? 0 : 120,
      justifyContent: 'center',
    },
    recordButton: {
      backgroundColor: colors.error,
    },
    buttonText: {
      color: colors.white,
      fontWeight: 'bold',
      fontSize: compact ? 12 : 14,
    },
    conversionContainer: {
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusText: {
      color: colors.text.primary,
      fontSize: 16,
      textAlign: 'center',
    },
  });

  if (isRecording) {
    return (
      <View style={styles.container}>
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onCancel={() => setIsRecording(false)}
        />
      </View>
    );
  }

  if (converting) {
    return (
      <View style={styles.container}>
        <View style={styles.conversionContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.statusText, {marginTop: 10}]}>
            Converting audio for mobile compatibility...
          </Text>
          <Text style={[styles.statusText, {fontSize: 12, marginTop: 5}]}>
            {Math.round(conversionProgress * 100)}% complete
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={pickFile}
          disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : compact ? (
            <Upload size={16} color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Upload File</Text>
          )}
        </TouchableOpacity>

        {(mediaType === 'audio' || mediaType === 'all') && (
          <TouchableOpacity
            style={[styles.button, styles.recordButton]}
            onPress={() => setIsRecording(true)}
            disabled={uploading}>
            {compact ? (
              <Mic size={16} color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Record Audio</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
