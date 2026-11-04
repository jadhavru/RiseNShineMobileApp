
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  payment_method: string;
  transaction_reference: string | null;
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
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

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
        .select(
          'id, member_id, amount, paid_at, payment_status, payment_method, transaction_reference'
        )
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

 const generateReceipt = async (item: ContributionItem) => {
  if (item.payment_status !== 'verified') {
    Alert.alert(
      'Receipt unavailable',
      'Only verified payments have receipts.'
    );
    return;
  }

  try {
    setReceiptLoadingId(item.id);

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError) throw userError;

    const userId = userData.user?.id;
    if (!userId) throw new Error('Please sign in again.');

    const { data: profile, error: profileError } = await supabase
      .from('approved_member_directory')
      .select('full_name, member_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const memberName = profile?.full_name || 'Member';
    const memberCode = profile?.member_id || 'N/A';
    const eventName = event?.title || 'Event';

    const amount = Number(item.amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const paymentDate = new Date(item.paid_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const paymentMethod = (item.payment_method || 'N/A')
      .replace(/_/g, ' ')
      .toUpperCase();

    const receiptNumber = `RNS-${item.id.slice(0, 8).toUpperCase()}`;

    const escapeHtml = (value: string) =>
      value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        };
        return entities[character];
      });

    // Load local Rise N Shine logo
    const logoAsset = Asset.fromModule(
      require('../../assets/logo.png')
    );

    await logoAsset.downloadAsync();

    let logoUri = logoAsset.uri;

    // Embed logo as Base64 for native PDF
    if (Platform.OS !== 'web') {
      const logoPath = logoAsset.localUri || logoAsset.uri;

      const logoBase64 = await FileSystem.readAsStringAsync(
        logoPath,
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );

      logoUri = `data:image/png;base64,${logoBase64}`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            background: #f4f6f8;
            color: #123B63;
            padding: 20px;
          }

          .receipt {
            max-width: 520px;
            margin: auto;
            background: white;
            border: 1.5px solid #123B63;
            border-radius: 12px;
            padding: 22px;
          }

          .logo {
            display: block;
            width: 110px;
            height: 110px;
            object-fit: contain;
            margin: 0 auto 10px;
          }

          .brand {
            text-align: center;
            font-size: 23px;
            font-weight: 900;
            letter-spacing: 2px;
          }

          .tagline {
            text-align: center;
            color: #718096;
            font-size: 10px;
            margin-top: 5px;
          }

          .heading {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
          }

          .paid {
            text-align: center;
            color: #16865B;
            border: 2px solid #16865B;
            border-radius: 6px;
            padding: 7px;
            font-size: 19px;
            font-weight: 900;
            letter-spacing: 3px;
            margin: 15px auto;
            width: 125px;
          }

          .amount {
            text-align: center;
            font-size: 29px;
            font-weight: 900;
            color: #16865B;
            margin: 12px 0 18px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 9px 0;
            border-bottom: 1px solid #edf0f3;
            font-size: 12px;
          }

          .label {
            color: #718096;
          }

          .value {
            color: #123B63;
            font-weight: bold;
            text-align: right;
            max-width: 60%;
            overflow-wrap: anywhere;
          }

          .receipt-no {
            text-align: center;
            color: #718096;
            font-size: 10px;
            margin-top: 17px;
          }

          .footer {
            text-align: center;
            color: #718096;
            font-size: 10px;
            line-height: 1.6;
            margin-top: 17px;
          }

          @media print {
            body {
              background: white;
            }

            .receipt {
              border: 1.5px solid #123B63;
              box-shadow: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="receipt">

          <img
            class="logo"
            src="${logoUri}"
            alt="Rise N Shine Logo"
          />

          <div class="brand">RISE N SHINE</div>

          <div class="tagline">
            Together we grow. Together we shine.
          </div>

          <div class="heading">
            EVENT PAYMENT RECEIPT
          </div>

          <div class="paid">VERIFIED</div>

          <div class="amount">₹${amount}</div>

          <div class="row">
            <span class="label">Event Name</span>
            <span class="value">${escapeHtml(eventName)}</span>
          </div>

          <div class="row">
            <span class="label">Member Name</span>
            <span class="value">${escapeHtml(memberName)}</span>
          </div>

          <div class="row">
            <span class="label">Member ID</span>
            <span class="value">${escapeHtml(memberCode)}</span>
          </div>

          <div class="row">
            <span class="label">Payment Date</span>
            <span class="value">${escapeHtml(paymentDate)}</span>
          </div>

          <div class="row">
            <span class="label">Payment Method</span>
            <span class="value">${escapeHtml(paymentMethod)}</span>
          </div>

          <div class="row">
            <span class="label">Transaction Reference</span>
            <span class="value">${escapeHtml(
              item.transaction_reference || 'N/A'
            )}</span>
          </div>

          <div class="row">
            <span class="label">Payment Status</span>
            <span class="value" style="color:#16865B">
              VERIFIED
            </span>
          </div>

          <div class="receipt-no">
            Receipt No: ${receiptNumber}
          </div>

          <div class="footer">
            Thank you for your contribution!<br />
            Rise N Shine<br />
            This is a computer-generated receipt.
          </div>

        </div>
      </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      const printFrame = document.createElement('iframe');

      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';

      document.body.appendChild(printFrame);

      const frameDocument = printFrame.contentDocument;

      if (!frameDocument) {
        printFrame.remove();
        throw new Error('Unable to create receipt document.');
      }

      frameDocument.open();
      frameDocument.write(html);
      frameDocument.close();

      setTimeout(() => {
        const frameWindow = printFrame.contentWindow;

        if (frameWindow) {
          frameWindow.focus();
          frameWindow.print();
        }

        setTimeout(() => {
          printFrame.remove();
        }, 1500);
      }, 700);
    } else {
      const file = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Rise N Shine Event Payment Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          'Sharing unavailable',
          'PDF तयार झाला आहे, पण Share सुविधा उपलब्ध नाही.'
        );
      }
    }
  } catch (error: any) {
    console.log('Event Receipt Error:', error);

    Alert.alert(
      'Receipt Error',
      error?.message || 'Unable to generate payment receipt.'
    );
  } finally {
    setReceiptLoadingId(null);
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
          payment_method: '',
          transaction_reference: null,
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
              <View key={item.id} style={styles.paymentHistoryRow}>
                <View style={styles.paymentHistoryInfo}>
                  <Text style={styles.summaryLabel}>
                    ₹{Number(item.amount).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.galleryDate}>
                    {formatDate(item.paid_at)}
                  </Text>
                  <Text style={styles.paymentMethodText}>
                    {item.payment_method?.replace('_', ' ') || 'Payment'}
                  </Text>
                </View>

                <View style={styles.paymentHistoryActions}>
                  <Text
                    style={{
                      color:
                        item.payment_status === 'verified'
                          ? '#16865B'
                          : '#E87532',
                      fontWeight: '800',
                      marginBottom: 7,
                    }}
                  >
                    {item.payment_status.toUpperCase()}
                  </Text>

                  {item.payment_status === 'verified' && (
                    <TouchableOpacity
                      style={styles.receiptButton}
                      onPress={() => generateReceipt(item)}
                      disabled={receiptLoadingId === item.id}
                    >
                      {receiptLoadingId === item.id ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.receiptButtonText}>
                          PDF Receipt
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
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
    marginTop: 8,
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
  paymentHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F3',
  },
  paymentHistoryInfo: {
    flex: 1,
    paddingRight: 8,
  },
  paymentMethodText: {
    color: '#718096',
    fontSize: 11,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  paymentHistoryActions: {
    alignItems: 'flex-end',
  },
  receiptButton: {
    backgroundColor: '#123B63',
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  receiptButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
