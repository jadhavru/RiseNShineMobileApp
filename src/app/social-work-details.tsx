
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
const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);
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

 const generateReceipt = async (item: ContributionItem) => {
  if (item.payment_status !== 'paid') {
    Alert.alert(
      'Receipt unavailable',
      'Only paid contributions have receipts.'
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
    const projectName = project?.title || 'Social Work Project';

    const amount = Number(item.amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const paymentDate = new Date(
      item.contribution_date
    ).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const paymentMethod = (
      item.payment_method || 'N/A'
    ).replace(/_/g, ' ').toUpperCase();

    const receiptNumber = `RNS-SW-${item.id
      .slice(0, 8)
      .toUpperCase()}`;

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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
            word-break: break-word;
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
            SOCIAL WORK PAYMENT RECEIPT
          </div>

          <div class="paid">PAID</div>

          <div class="amount">₹${amount}</div>

          <div class="row">
            <span class="label">Project Name</span>
            <span class="value">${escapeHtml(projectName)}</span>
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
            <span class="label">Payment Status</span>
            <span class="value" style="color:#16865B">
              PAID
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
          dialogTitle: 'Rise N Shine Social Work Receipt',
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
    console.log('Social Work Receipt Error:', error);

    Alert.alert(
      'Receipt Error',
      error?.message || 'Unable to generate receipt.'
    );
  } finally {
    setReceiptLoadingId(null);
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

            <View style={{ alignItems: 'flex-end', gap: 8 }}>
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

  {item.payment_status === 'paid' && (
    <TouchableOpacity
      style={styles.receiptButton}
      onPress={() => generateReceipt(item)}
      disabled={receiptLoadingId === item.id}
    >
      {receiptLoadingId === item.id ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.receiptButtonText}>
          PDF Receipt ↓
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
