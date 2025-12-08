import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Post {
  id: string;
  user_id: string;
  type: 'image' | 'video';
  media_url: string;
  caption: string | null;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  likes: { id: string }[];
  isLiked: boolean;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, avatar_url),
          likes (id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithLikes = data?.map(post => ({
        ...post,
        isLiked: post.likes.some((like: any) => like.user_id === user?.id),
      })) || [];

      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
      }

      // Update local state
      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked
                  ? p.likes.filter(like => like.id !== user.id)
                  : [...p.likes, { id: user.id }],
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {item.profiles.avatar_url ? (
              <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={20} color="#9ca3af" />
            )}
          </View>
          <Text style={styles.username}>{item.profiles.username}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.mediaContainer}>
        {item.type === 'image' ? (
          <Image source={{ uri: item.media_url }} style={styles.media} />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle" size={48} color="#ffffff" />
            <Text style={styles.videoText}>Video</Text>
          </View>
        )}
      </View>

      <View style={styles.postActions}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={24}
              color={item.isLiked ? "#ef4444" : "#374151"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.postInfo}>
        <Text style={styles.likesCount}>{item.likes.length} likes</Text>
        {item.caption && (
          <Text style={styles.caption}>
            <Text style={styles.username}>{item.profiles.username}</Text> {item.caption}
          </Text>
        )}
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ArtistConnect</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPosts} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
      />
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
  feedContent: {
    paddingBottom: 20,
  },
  postContainer: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  mediaContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f3f4f6',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  videoText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 8,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
  postInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 18,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
});