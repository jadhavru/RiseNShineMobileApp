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
  View
} from 'react-native';
import { supabase } from '../lib/supabase';

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  fee: number;
  fee_type: string;
};

type ContributionItem = {
  id: string;
  member_id: string | null;
  amount: number;
  paid_at: string;
  payment_status: string;
  member_name: string;
};

type ExpenseItem = {
  id: string;
  expense_title: string;
  amount: number;
  expense_date: string;
  notes: string | null;
};

type MemberItem = {
  id: string;
  full_name: string;
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

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
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
    loadEvent();
    loadContributions();
    loadExpenses();
    loadGallery();
    loadPaymentSettings();
    loadMyContributions();
  
  }, [id]);
 const loadMyContributions = async () => {
  try {
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError) throw userError;

    const userId = userData.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('event_contributions')
      .select('id, member_id, amount, paid_at, payment_status')
      .eq('event_id', id)
      .eq('member_id', userId)
      .order('paid_at', { ascending: false });

    if (error) throw error;

    const records = (data || []).map((item) => ({
      ...item,
      member_name: 'You',
    })) as ContributionItem[];

    setMyContributions(records);

    const verifiedTotal = records
      .filter((item) => item.payment_status === 'verified')
      .reduce((sum, item) => sum + Number(item.amount), 0);

    setMyTotalPaid(verifiedTotal);
  } catch (error: any) {
    console.log('My Contributions Error:', error.message);
  }
};
  const loadContributions = async () => {
    try {
      const { data, error } = await supabase
        .from('event_contributions')
        .select('id, member_id, amount, paid_at, payment_status')
        .eq('event_id', id)
        .eq('payment_status', 'verified')
        .order('paid_at', { ascending: false });

      if (error) throw error;

      const contributionData = data || [];
      const memberIds = [
        ...new Set(
          contributionData
            .map((item) => item.member_id)
            .filter((memberId): memberId is string => memberId !== null)
        ),
      ];

      let memberMap: Record<string, string> = {};

      if (memberIds.length > 0) {
        const { data: members, error: memberError } = await supabase
          .from('approved_member_directory')
          .select('id, full_name')
          .in('id', memberIds);

        if (memberError) throw memberError;

        memberMap = (members || []).reduce(
          (map: Record<string, string>, member: MemberItem) => {
            map[member.id] = member.full_name;
            return map;
          },
          {}
        );
      }

      const formattedData: ContributionItem[] = contributionData.map(
        (item) => ({
          ...item,
          member_name: item.member_id
            ? memberMap[item.member_id] || 'Member name unavailable'
            : 'Anonymous Contributor',
        })
      );

      setContributions(formattedData);

      const total = formattedData.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );
      setTotalCollected(total);
    } catch (error: any) {
      console.log('Contributions Error:', error.message);
    }
  };

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('event_expenses')
        .select('id, expense_title, amount, expense_date, notes')
        .eq('event_id', id)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      const expenseData = (data || []) as ExpenseItem[];
      setExpenses(expenseData);

      const total = expenseData.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );
      setTotalExpenses(total);
    } catch (error: any) {
      console.log('Expenses Error:', error.message);
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
  const loadGallery = async () => {
    try {
      setGalleryLoading(true);

      const { data, error } = await supabase
        .from('gallery_media')
        .select(
          'id, category, related_record_id, media_type, title, media_url, media_date, description'
        )
        .eq('category', 'event')
        .eq('related_record_id', id)
        .order('media_date', { ascending: false });

      if (error) throw error;
      setGallery((data || []) as GalleryItem[]);
    } catch (error: any) {
      console.log('Event Gallery Error:', error.message);
    } finally {
      setGalleryLoading(false);
    }
  };

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, event_date, location, fee, fee_type')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEvent(data as EventItem);
    } catch (error: any) {
      Alert.alert('Event Error', error.message);
    } finally {
      setLoading(false);
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

  const renderGalleryItem = (item: GalleryItem) => {
    const isPhoto = item.media_type === 'photo';

    return (
      <View key={item.id} style={styles.galleryItem}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openGalleryMedia(item.media_url)}
          disabled={!item.media_url}
        >
          {isPhoto ? (
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
              <Text style={styles.galleryOpenHint}>Tap to open</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.galleryTitle}>{item.title}</Text>
        <Text style={styles.galleryDate}>{formatDate(item.media_date)}</Text>
        {!!item.description && (
          <Text style={styles.galleryDescription}>{item.description}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E87532" />
        <Text style={styles.loadingText}>Loading Event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Event not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.headerLabel}>RISE N SHINE</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.subtitle}>
          Together we grow. Together we shine.
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Event Details</Text>

          <Text style={styles.label}>Date & Time</Text>
          <Text style={styles.value}>
            {new Date(event.event_date).toLocaleString()}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>
            {event.location || 'Location not specified'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>
            {event.description || 'No description available.'}
          </Text>
        </View>

<View style={styles.galleryCard}>
  <Text style={styles.sectionTitle}>Event Video & Photo Gallery</Text>

  {galleryLoading ? (
    <ActivityIndicator color="#E87532" />
  ) : gallery.length === 0 ? (
    <Text style={styles.emptyGallery}>
      No gallery media has been added for this event yet.
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

        <View style={styles.contributionCard}>
          <Text style={styles.sectionTitle}>Event Contribution</Text>
          <Text style={styles.amount}>
            {Number(event.fee) > 0
              ? `₹${Number(event.fee).toLocaleString('en-IN')}`
              : 'Optional'}
          </Text>
          <Text style={styles.contributionNote}>
            {event.fee_type === 'mandatory_fee'
              ? 'Mandatory event fee'
              : 'Contribution is optional.'}
          </Text>

<View style={styles.divider} />

<Text style={styles.label}>Your Total Verified Payment</Text>
<Text style={styles.amount}>
  ₹{myTotalPaid.toLocaleString('en-IN')}
</Text>

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
      <View>
        <Text style={styles.summaryLabel}>
          ₹{Number(item.amount).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.galleryDate}>
          {formatDate(item.paid_at)}
        </Text>
      </View>

      <Text
        style={{
          color: item.payment_status === 'verified' ? '#16865B' : '#E87532',
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
    onPress={() => setPaymentModalVisible(true)}
  >
    <Text style={styles.payNowButtonText}>Pay Now →</Text>
  </TouchableOpacity>
)}

        </View>

        <View style={styles.contributionCard}>
          <Text style={styles.sectionTitle}>Verified Contributions</Text>

          <Text style={styles.amount}>
            ₹{totalCollected.toLocaleString('en-IN')}
          </Text>

          <Text style={styles.contributionNote}>
            Total Verified Collection
          </Text>

          <View style={styles.divider} />

          <Text style={styles.label}>
            Total Contributors: {contributions.length}
          </Text>

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() =>
              router.push({
                pathname: '/all-contributions',
                params: { id: event.id },
              })
            }
          >
            <Text style={styles.viewAllText}>
              View All Contributions →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contributionCard}>
          <Text style={styles.sectionTitle}>Event Financial Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Collected</Text>
            <Text style={styles.summaryValue}>
              ₹{totalCollected.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={styles.expenseValue}>
              ₹{totalExpenses.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.summaryLabel}>Remaining Balance</Text>
          <Text style={styles.balanceValue}>
            ₹{(totalCollected - totalExpenses).toLocaleString('en-IN')}
          </Text>

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() =>
              router.push({
                pathname: '/all-expenses',
                params: { id: event.id },
              })
            }
          >
            <Text style={styles.viewAllText}>
              View All Expenses →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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

      <Text style={styles.modalTitle}>Event Contribution</Text>
      <Text style={styles.modalSubtitle}>
        Scan QR Code to Pay
      </Text>

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
        After payment, inform the event admin.
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
      Please share your payment confirmation with the event admin.
      Your contribution will be verified by admin.
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
  center: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#123B63',
    marginTop: 12,
  },
  errorText: {
    color: '#C0392B',
  },
  header: {
    backgroundColor: '#123B63',
    paddingTop: 55,
    paddingHorizontal: 24,
    paddingBottom: 35,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  backText: {
    color: '#123B63',
    fontSize: 15,
    fontWeight: '800',
  },
 logo: {
  width: 85,
  height: 85,
  borderRadius: 12,
},
  headerLabel: {
    color: '#F5C49E',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 15,
  },
  subtitle: {
    color: '#F5C49E',
    fontSize: 12,
    marginTop: 12,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  sectionTitle: {
    color: '#123B63',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 20,
  },
  label: {
    color: '#8291A3',
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    color: '#123B63',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 7,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF0F3',
    marginVertical: 16,
  },
 
  
 
  galleryOpenHint: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 5,
  },
 
  
  galleryDescription: {
    color: '#526174',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  contributionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  amount: {
    color: '#E87532',
    fontSize: 28,
    fontWeight: '800',
  },
  contributionNote: {
    color: '#718096',
    fontSize: 13,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  summaryLabel: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#16865B',
    fontSize: 18,
    fontWeight: '800',
  },
  expenseValue: {
    color: '#C0392B',
    fontSize: 18,
    fontWeight: '800',
  },
  balanceValue: {
    color: '#16865B',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },
  viewAllButton: {
    backgroundColor: '#123B63',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  galleryCard: {
  backgroundColor: '#FFFFFF',
  padding: 16,
  borderRadius: 18,
  marginTop: 18,
  borderWidth: 1,
  borderColor: '#F0E8DC',
},
emptyGallery: {
  color: '#718096',
  fontSize: 14,
  lineHeight: 21,
},
galleryScroll: {
  paddingRight: 8,
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
payNowButton: {
  backgroundColor: '#E87532',
  padding: 14,
  borderRadius: 12,
  alignItems: 'center',
  marginTop: 16,
},
payNowButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '800',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.65)',
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
  fontSize: 22,
  fontWeight: '800',
  marginTop: 5,
},
modalSubtitle: {
  color: '#718096',
  fontSize: 14,
  marginTop: 7,
},
paymentQr: {
  width: 220,
  height: 220,
  marginVertical: 15,
},
upiLabel: {
  color: '#8291A3',
  fontSize: 12,
  fontWeight: '700',
},
upiValue: {
  color: '#123B63',
  fontSize: 18,
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
  backgroundColor: '#16865B',
  padding: 15,
  borderRadius: 12,
  width: '100%',
  alignItems: 'center',
  marginTop: 20,
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
  width: '100%',
  marginTop: 15,
},
paymentSuccessTitle: {
  color: '#16865B',
  fontSize: 16,
  fontWeight: '800',
  marginBottom: 6,
},
paymentSuccessText: {
  color: '#315B48',
  fontSize: 13,
  lineHeight: 20,
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
});
