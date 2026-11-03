
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Project = {
  id: string;
  title: string;
  description: string | null;
  activity_date: string;
  location: string | null;
  status: string;
};

type GalleryItem = {
  id: string;
  category: string;
  related_record_id: string;
  media_type: string;
  title: string;
  media_url: string;
  media_date: string;
  description: string | null;
};

type ContributionItem = {
  id: string;
  amount: number;
  contribution_date: string;
  payment_method: string | null;
  payment_status: string;
};

export default function SocialWorkDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [paymentUpiId, setPaymentUpiId] = useState('');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const [myContributions, setMyContributions] = useState<ContributionItem[]>([]);
  const [myTotalPaid, setMyTotalPaid] = useState(0);

  useEffect(() => {
    if (!id) return;

    loadProjectDetails();
    loadGallery();
    loadPaymentSettings();
    loadMyContributions();
  }, [id]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);

      const { data: projectData, error: projectError } = await supabase
        .from('social_work_projects')
        .select('id, title, description, activity_date, location, status')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;

      setProject(projectData);

      const { data: summary, error: summaryError } = await supabase
        .from('social_work_financial_summary')
        .select('total_collected, total_expenses, balance')
        .eq('project_id', id)
        .single();

      if (summaryError) throw summaryError;

      setTotalCollected(Number(summary.total_collected || 0));
      setTotalExpenses(Number(summary.total_expenses || 0));
    } catch (error) {
      console.log('Social Work Details Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGallery = async () => {
    try {
      setGalleryLoading(true);

      const { data, error } = await supabase
        .from('gallery_media')
        .select(
          'id, category, related_record_id, media_type, title, media_url, media_date, description'
        )
        .eq('category', 'social_work')
        .eq('related_record_id', id)
        .order('media_date', { ascending: false });

      if (error) throw error;

      setGallery((data || []) as GalleryItem[]);
    } catch (error) {
      console.log('Social Work Gallery Error:', error);
    } finally {
      setGalleryLoading(false);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['payment_qr_url', 'payment_upi_id']);

      if (error) throw error;

      const settings = data || [];

      const qrUrl = settings.find(
        (item) => item.setting_key === 'payment_qr_url'
      )?.setting_value;

      const upiId = settings.find(
        (item) => item.setting_key === 'payment_upi_id'
      )?.setting_value;

      setPaymentQrUrl(qrUrl || '');
      setPaymentUpiId(upiId || '');
    } catch (error: any) {
      console.log('Payment Settings Error:', error.message);
    }
  };

  const loadMyContributions = async () => {
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = userData.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('social_work_contributions')
        .select(
          'id, amount, contribution_date, payment_method, payment_status'
        )
        .eq('project_id', id)
        .eq('member_id', userId)
        .order('contribution_date', { ascending: false });

      if (error) throw error;

      const records = (data || []) as ContributionItem[];

      setMyContributions(records);

      const verifiedTotal = records
        .filter((item) => item.payment_status === 'paid')
        .reduce((sum, item) => sum + Number(item.amount), 0);

      setMyTotalPaid(verifiedTotal);
    } catch (error: any) {
      console.log('My Social Work Contributions Error:', error.message);
    }
  };

  const openGalleryMedia = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Unable to open this media link.');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const renderGalleryItem = (item: GalleryItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.galleryItem}
      activeOpacity={0.85}
      onPress={() => openGalleryMedia(item.media_url)}
      disabled={!item.media_url}
    >
      {item.media_type === 'photo' ? (
        <Image
          source={{ uri: item.media_url }}
          style={styles.galleryPhoto}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.galleryLinkPreview}>
          <Text style={styles.galleryPlayIcon}>
            {item.media_type === 'youtube' || item.media_type === 'video'
              ? '▶'
              : '↗'}
          </Text>
          <Text style={styles.galleryType}>
            {item.media_type.toUpperCase()}
          </Text>
        </View>
      )}

      <Text style={styles.galleryTitle} numberOfLines={1}>
        {item.title}
      </Text>

      <Text style={styles.galleryDate}>
        {formatDate(item.media_date)}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E87532" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.loader}>
        <Text style={styles.emptyText}>
          Project details not available.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>{project.title}</Text>

        <Text style={styles.status}>
          {project.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Project Details</Text>

          <Text style={styles.info}>
            📅 {new Date(project.activity_date).toLocaleDateString()}
          </Text>

          <Text style={styles.info}>
            📍 {project.location || 'Location not specified'}
          </Text>

          <Text style={styles.description}>
            {project.description || 'No description available.'}
          </Text>
        </View>

        <View style={styles.galleryCard}>
          <Text style={styles.sectionTitle}>
            Social Work Video & Photo Gallery
          </Text>

          {galleryLoading ? (
            <ActivityIndicator color="#E87532" />
          ) : gallery.length === 0 ? (
            <Text style={styles.emptyGallery}>
              No gallery media has been added for this project yet.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
            >
              {gallery.map(renderGalleryItem)}
            </ScrollView>
          )}
        </View>

        <Text style={styles.sectionTitle}>Financial Summary</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Total Collected</Text>
          <Text style={styles.collected}>
            ₹{totalCollected.toFixed(2)}
          </Text>

          <Text style={styles.label}>Total Expenses</Text>
          <Text style={styles.expenses}>
            ₹{totalExpenses.toFixed(2)}
          </Text>

          <Text style={styles.label}>Remaining Balance</Text>
          <Text style={styles.balance}>
            ₹{(totalCollected - totalExpenses).toFixed(2)}
          </Text>
        </View>

        {/* Your Social Work Payment Details */}
        <Text style={styles.sectionTitle}>Your Contribution</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Your Total Verified Payment</Text>
          <Text style={styles.collected}>
            ₹{myTotalPaid.toLocaleString('en-IN')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.label}>
            Payment History ({myContributions.length})
          </Text>

          {myContributions.length === 0 ? (
            <Text style={styles.contributionNote}>
              No payments recorded yet.
            </Text>
          ) : (
            myContributions.map((item) => (
              <View key={item.id} style={styles.summaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>
                    ₹{Number(item.amount).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.galleryDate}>
                    {formatDate(item.contribution_date)}
                  </Text>
                  <Text style={styles.galleryDate}>
                    {item.payment_method
                      ? item.payment_method.replace('_', ' ').toUpperCase()
                      : 'Payment method not specified'}
                  </Text>
                </View>

                <Text
                  style={{
                    color:
                      item.payment_status === 'paid'
                        ? '#16865B'
                        : '#E87532',
                    fontWeight: '800',
                  }}
                >
                  {item.payment_status.toUpperCase()}
                </Text>
              </View>
            ))
          )}

          {myTotalPaid > 0 ? (
            <View style={styles.paidStatusButton}>
              <Text style={styles.paidStatusText}>✓ PAID</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => {
                setPaymentSubmitted(false);
                setPaymentModalVisible(true);
              }}
            >
              <Text style={styles.payNowButtonText}>Pay Now →</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            router.push({
              pathname: '/social-work-contributions',
              params: { id: project.id },
            })
          }
        >
          <Text style={styles.actionButtonText}>
            View All Contributions →
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.expenseButton}
          onPress={() =>
            router.push({
              pathname: '/social-work-expenses',
              params: { id: project.id },
            })
          }
        >
          <Text style={styles.actionButtonText}>
            View All Expenses →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment QR Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Social Work Contribution</Text>
            <Text style={styles.modalSubtitle}>Scan QR Code to Pay</Text>

            {paymentQrUrl ? (
              <Image
                source={{ uri: paymentQrUrl }}
                style={styles.paymentQr}
                resizeMode="contain"
              />
            ) : (
              <Text>QR Code not available</Text>
            )}

            <Text style={styles.upiLabel}>UPI ID</Text>
            <Text style={styles.upiValue}>
              {paymentUpiId || 'UPI ID not available'}
            </Text>

            <Text style={styles.paymentInstruction}>
              Pay using Google Pay, PhonePe or Paytm.
              After payment, inform the project admin.
            </Text>

            <TouchableOpacity
              style={styles.paidButton}
              onPress={() => setPaymentSubmitted(true)}
            >
              <Text style={styles.paidButtonText}>I Have Paid</Text>
            </TouchableOpacity>

            {paymentSubmitted && (
              <View style={styles.paymentSuccessBox}>
                <Text style={styles.paymentSuccessTitle}>
                  Payment Submitted!
                </Text>
                <Text style={styles.paymentSuccessText}>
                  Please share your payment confirmation with the project
                  admin. Your contribution will be verified by admin.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  backText: {
    color: '#123B63',
    fontWeight: '800',
  },
  header: {
    backgroundColor: '#123B63',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
  },
  status: {
    color: '#F5C49E',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  sectionTitle: {
    color: '#123B63',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  info: {
    color: '#123B63',
    fontSize: 14,
    marginTop: 10,
  },
  description: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },
  label: {
    color: '#718096',
    fontSize: 13,
    marginTop: 12,
  },
  collected: {
    color: '#15965A',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 5,
  },
  expenses: {
    color: '#D97706',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 5,
  },
  balance: {
    color: '#123B63',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 5,
  },
  emptyText: {
    color: '#718096',
    marginBottom: 15,
  },
  galleryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  galleryScroll: {
    paddingRight: 8,
  },
  emptyGallery: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 21,
  },
  galleryItem: {
    width: 125,
    marginRight: 12,
  },
  galleryPhoto: {
    width: 125,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#EDF0F3',
  },
  galleryLinkPreview: {
    width: 125,
    height: 90,
    backgroundColor: '#123B63',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPlayIcon: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },
  galleryType: {
    color: '#F5C49E',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
  },
  galleryTitle: {
    color: '#123B63',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 7,
  },
  galleryDate: {
    color: '#8291A3',
    fontSize: 10,
    marginTop: 3,
  },
  actionButton: {
    backgroundColor: '#123B63',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  expenseButton: {
    backgroundColor: '#E87532',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E8DC',
    marginTop: 16,
  },
  contributionNote: {
    color: '#718096',
    fontSize: 13,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DC',
  },
  summaryLabel: {
    color: '#123B63',
    fontSize: 14,
    fontWeight: '800',
  },
  payNowButton: {
    backgroundColor: '#E87532',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  payNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  paidStatusButton: {
    backgroundColor: '#E8F7EF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#16865B',
  },
  paidStatusText: {
    color: '#16865B',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentModal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalCloseText: {
    color: '#123B63',
    fontSize: 22,
    fontWeight: '800',
  },
  modalTitle: {
    color: '#123B63',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 5,
  },
  modalSubtitle: {
    color: '#718096',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 15,
  },
  paymentQr: {
    width: 210,
    height: 210,
    backgroundColor: '#FFFFFF',
  },
  upiLabel: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 15,
  },
  upiValue: {
    color: '#123B63',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
  },
  paymentInstruction: {
    color: '#718096',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 15,
  },
  paidButton: {
    backgroundColor: '#15965A',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 18,
  },
  paidButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  paymentSuccessBox: {
    backgroundColor: '#E8F7EF',
    padding: 14,
    borderRadius: 12,
    marginTop: 15,
    width: '100%',
  },
  paymentSuccessTitle: {
    color: '#16865B',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  paymentSuccessText: {
    color: '#426B57',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
});
