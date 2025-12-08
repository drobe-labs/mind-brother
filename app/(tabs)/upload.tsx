import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

export default function Upload() {
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const uploadMedia = async () => {
    if (!selectedMedia || !user || !mediaType) {
      Alert.alert('Error', 'Please select media and add a caption');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = selectedMedia.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${mediaType}s/${fileName}`;

      // Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', {
        uri: selectedMedia,
        type: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
        name: fileName,
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, formData);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Save post to database
      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          type: mediaType,
          media_url: publicUrl,
          caption: caption.trim() || null,
        });

      if (dbError) throw dbError;

      Alert.alert('Success!', 'Your post has been uploaded successfully.', [
        { text: 'OK', onPress: () => {
          setSelectedMedia(null);
          setMediaType(null);
          setCaption('');
          router.push('/(tabs)/feed');
        }}
      ]);

    } catch (error) {
      console.error('Error uploading:', error);
      Alert.alert('Upload Failed', 'There was an error uploading your post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Post</Text>
        {selectedMedia && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={uploadMedia}
            disabled={uploading}
          >
            <Text style={styles.shareButtonText}>
              {uploading ? 'Uploading...' : 'Share'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {selectedMedia ? (
          <View style={styles.mediaPreview}>
            {mediaType === 'image' ? (
              <Image source={{ uri: selectedMedia }} style={styles.previewImage} />
            ) : (
              <View style={styles.videoPreview}>
                <Ionicons name="play-circle" size={64} color="#ffffff" />
                <Text style={styles.videoText}>Video Selected</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.changeMediaButton}
              onPress={pickImage}
            >
              <Text style={styles.changeMediaText}>Change Media</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
            <Ionicons name="camera" size={48} color="#9ca3af" />
            <Text style={styles.uploadText}>Tap to select photo or video</Text>
            <Text style={styles.uploadSubtext}>Share your artistic creations</Text>
          </TouchableOpacity>
        )}

        {selectedMedia && (
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.characterCount}>{caption.length}/500</Text>
          </View>
        )}

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Tips for great posts:</Text>
          <Text style={styles.tipItem}>• Use good lighting for photos</Text>
          <Text style={styles.tipItem}>• Keep videos under 60 seconds</Text>
          <Text style={styles.tipItem}>• Add engaging captions</Text>
          <Text style={styles.tipItem}>• Tag your art medium or style</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  shareButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  mediaPreview: {
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  videoPreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 8,
  },
  changeMediaButton: {
    alignSelf: 'center',
  },
  changeMediaText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  captionContainer: {
    marginBottom: 24,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  tips: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
});