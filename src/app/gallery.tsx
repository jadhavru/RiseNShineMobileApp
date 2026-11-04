
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';
type GalleryMedia = {
  id: string;
  category: 'event' | 'social_work' | 'dj';
  related_record_id: string;
  media_type: 'youtube' | 'instagram' | 'facebook' | 'photo' | 'video' | 'link';
  title: string;
  media_url: string;
  media_date: string;
  description: string | null;
};

const FILTERS = ['All', 'Events', 'Social Work', 'Videos'];

export default function GalleryScreen() {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [media, setMedia] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase
        .from('gallery_media')
        .select(
          'id, category, related_record_id, media_type, title, media_url, media_date, description'
        )
        .order('media_date', { ascending: false });

      if (error) throw error;

      setMedia((data || []) as GalleryMedia[]);
    } catch (error: any) {
      console.log('Gallery Error:', error.message);
      setErrorMessage('Gallery load करताना अडचण आली. पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = media.filter((item) => {
    if (selectedFilter === 'Events') {
      return item.category === 'event';
    }

    if (selectedFilter === 'Social Work') {
      return item.category === 'social_work';
    }

    if (selectedFilter === 'Videos') {
      return ['video', 'youtube'].includes(item.media_type);
    }

    return true;
  });

  const openMedia = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('Media Open Error:', error);
    }
  };

  const isVideo = (type: string) =>
    ['video', 'youtube'].includes(type);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
 

       
      <View style={styles.header}>
  <TouchableOpacity
    style={styles.backButton}
    onPress={() => router.back()}
  >
    <Text style={styles.backText}>← Back</Text>
  </TouchableOpacity>

  <Text style={styles.title}>Our Gallery 🖼️</Text>
        <Text style={styles.subtitle}>
          Memories and moments from our community.
        </Text>
      </View>

      <View style={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.activeFilter,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#E87532"
            style={styles.loader}
          />
        ) : errorMessage ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{errorMessage}</Text>
            <TouchableOpacity onPress={loadGallery}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredMedia.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>No Media Available</Text>
            <Text style={styles.emptyText}>
              Photos and videos will appear here when added.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredMedia.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.mediaCard}
                onPress={() => openMedia(item.media_url)}
                activeOpacity={0.85}
              >
                {item.media_type === 'photo' ? (
                  <Image
                    source={{ uri: item.media_url }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.playIcon}>
                      {isVideo(item.media_type) ? '▶️' : '🔗'}
                    </Text>
                    <Text style={styles.videoLabel}>
                      {item.media_type.toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.mediaInfo}>
                  <Text style={styles.mediaTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <Text style={styles.mediaCategory}>
                    {item.category === 'event'
                      ? '📅 Event'
                      : item.category === 'social_work'
                      ? '🤝 Social Work'
                      : '🎯 DJ'}
                  </Text>

                  {item.description ? (
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <Text style={styles.mediaDate}>
                    {new Date(item.media_date).toLocaleDateString('en-IN')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  header: {
    backgroundColor: '#123B63',
    paddingTop: 55,
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },
  subtitle: {
    color: '#F5C49E',
    fontSize: 13,
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  filterContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilter: {
    backgroundColor: '#123B63',
    borderColor: '#123B63',
  },
  filterText: {
    color: '#123B63',
    fontSize: 13,
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mediaCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  mediaImage: {
    width: '100%',
    height: 135,
    backgroundColor: '#E5E7EB',
  },
  videoPlaceholder: {
    height: 135,
    backgroundColor: '#E2EDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 35,
  },
  videoLabel: {
    color: '#123B63',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
  },
  mediaInfo: {
    padding: 11,
  },
  mediaTitle: {
    color: '#123B63',
    fontSize: 14,
    fontWeight: '800',
  },
  mediaCategory: {
    color: '#E87532',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 7,
  },
  description: {
    color: '#718096',
    fontSize: 11,
    marginTop: 6,
  },
  mediaDate: {
    color: '#8291A3',
    fontSize: 10,
    marginTop: 7,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: '#123B63',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 15,
  },
  emptyText: {
    color: '#718096',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  retryText: {
    color: '#E87532',
    fontWeight: '800',
    marginTop: 15,
  },
 backButton: {
  marginBottom: 18,
  alignSelf: 'flex-start',
  backgroundColor: '#FFFFFF',
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 20,
},
backText: {
  color: '#123B63',
  fontSize: 14,
  fontWeight: '700',
},
});
