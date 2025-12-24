import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
// Removed SafeAreaView import as AppBar handles insets, or use edges={['bottom']} if needed for list
import {AppBar} from '@/components/shared/AppBar';
import {supabase} from '@/services/supabase';
import {useTheme} from '@/components/shared';
import {Pencil, Trash2} from 'lucide-react-native';
import {MediaUploader} from '@/components/admin/MediaUploader';
import type {Tables} from '@/types/database';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {spacing, borderRadius, typography} from '@/theme';
import {createCommonStyles} from '@/theme/commonStyles';
import {opacity} from '@/theme/opacity';

type Speaker = Tables<'speakers'>;

export const SpeakerManagerScreen: React.FC = () => {
  const {colors} = useTheme();
  const navigation = useNavigation();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Partial<Speaker>>({});
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async () => {
    setLoading(true);
    const {data, error} = await supabase
      .from('speakers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading speakers:', error);
      Alert.alert('Error', 'Failed to load speakers');
    } else {
      setSpeakers(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingSpeaker.name || !editingSpeaker.display_name) {
      Alert.alert('Error', 'Name and Display Name are required');
      return;
    }

    try {
      if (editingSpeaker.id) {
        const {error} = await supabase
          .from('speakers')
          .update(editingSpeaker)
          .eq('id', editingSpeaker.id);
        if (error) {
          throw error;
        }
      } else {
        const {error} = await supabase
          .from('speakers')
          .insert([editingSpeaker as any]);
        if (error) {
          throw error;
        }
      }

      setModalVisible(false);
      loadSpeakers();
    } catch (error) {
      console.error('Error saving speaker:', error);
      Alert.alert('Error', 'Failed to save speaker');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this speaker?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const {error} = await supabase
              .from('speakers')
              .delete()
              .eq('id', id);
            if (error) {
              console.error('Error deleting speaker:', error);
              Alert.alert('Error', 'Failed to delete speaker');
            } else {
              loadSpeakers();
            }
          },
        },
      ],
    );
  };

  const renderItem = ({item}: {item: Speaker}) => (
    <View style={[styles.card, {backgroundColor: colors.surface}]}>
      <View style={styles.cardHeader}>
        <View style={styles.speakerInfo}>
          {item.profile_image_url ? (
            <Image
              source={{uri: item.profile_image_url}}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, {backgroundColor: colors.primary}]}>
              <Text style={styles.avatarText}>
                {item.display_name.charAt(0)}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.name, {color: colors.text.primary}]}>
              {item.display_name}
            </Text>
            <Text style={[styles.subtext, {color: colors.text.secondary}]}>
              {item.name} • {item.dialect || 'No dialect'}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => {
              setEditingSpeaker(item);
              setModalVisible(true);
            }}
            style={styles.actionBtn}>
            <Pencil size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.actionBtn}>
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AppBar
        title="Speakers"
        showBack
        onBackPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={[styles.addButton, !speakers && {opacity: 0.5}]}
            onPress={() => {
              setEditingSpeaker({});
              setModalVisible(true);
            }}>
            <Text style={styles.addButtonText}>+ Add Speaker</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={speakers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadSpeakers}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingSpeaker.id ? 'Edit Speaker' : 'New Speaker'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Internal Name (e.g., mairead_connacht)
                </Text>
                <TextInput
                  style={styles.input}
                  value={editingSpeaker.name || ''}
                  onChangeText={t =>
                    setEditingSpeaker({...editingSpeaker, name: t})
                  }
                  autoCapitalize="none"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name (e.g., Mairéad)</Text>
                <TextInput
                  style={styles.input}
                  value={editingSpeaker.display_name || ''}
                  onChangeText={t =>
                    setEditingSpeaker({...editingSpeaker, display_name: t})
                  }
                  placeholderTextColor={colors.text.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dialect</Text>
                <TextInput
                  style={styles.input}
                  value={editingSpeaker.dialect || ''}
                  onChangeText={t =>
                    setEditingSpeaker({...editingSpeaker, dialect: t})
                  }
                  placeholderTextColor={colors.text.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Profile Image</Text>
                <View style={styles.imageInputRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput]}
                    value={editingSpeaker.profile_image_url || ''}
                    onChangeText={t =>
                      setEditingSpeaker({
                        ...editingSpeaker,
                        profile_image_url: t,
                      })
                    }
                    placeholder="Image URL"
                    placeholderTextColor={colors.text.secondary}
                  />
                  <MediaUploader
                    mediaType="image"
                    onUploadComplete={url =>
                      setEditingSpeaker({
                        ...editingSpeaker,
                        profile_image_url: url,
                      })
                    }
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setModalVisible(false)}>
                  <Text style={[styles.btnText, {color: colors.text.primary}]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn]}
                  onPress={handleSave}>
                  <Text style={[styles.btnText, {color: colors.white}]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) => {
  const common = createCommonStyles(colors);
  return {
    // Spread common utilities
    ...common,
    container: common.container,
    header: {
      ...common.rowBetween,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    addButtonText: {
      color: colors.white,
      fontWeight: typography.weights.bold,
    },
    list: {
      padding: spacing.md,
    },
    card: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      ...common.rowBetween,
    },
    speakerInfo: {
      ...common.row,
      gap: spacing.sm,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.xl,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    avatarText: {
      color: colors.white,
      fontWeight: typography.weights.bold,
      fontSize: typography.sizes.base,
    },
    name: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
    },
    subtext: {
      fontSize: typography.sizes.xs,
    },
    actions: {
      ...common.row,
      gap: spacing.sm,
    },
    actionBtn: {
      padding: spacing.sm,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: `rgba(0, 0, 0, ${opacity.overlay})`,
      justifyContent: 'center' as const,
      padding: spacing.lg,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      maxHeight: '80%' as const,
    } as any,
    modalTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      marginBottom: spacing.lg,
      color: colors.text.primary,
      textAlign: 'center' as const,
    },
    inputGroup: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.sizes.xs,
      marginBottom: spacing.sm,
      color: colors.text.secondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      color: colors.text.primary,
      backgroundColor: colors.background,
    },
    imageInputRow: {
      ...common.row,
      gap: spacing.sm,
    },
    flexInput: {
      flex: 1,
    },
    modalActions: {
      ...common.row,
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    modalBtn: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center' as const,
    },
    cancelBtn: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveBtn: {
      backgroundColor: colors.primary,
    },
    btnText: {
      fontWeight: typography.weights.bold,
    },
  };
};
