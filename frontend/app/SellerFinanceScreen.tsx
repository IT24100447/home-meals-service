import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import BottomNavBar from '../components/BottomNavBar';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const SellerFinanceScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [showSlipModal, setShowSlipModal] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    const fetchFinanceData = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const sellerId = Platform.OS === 'web' ? localStorage.getItem('userId') : await SecureStore.getItemAsync('userId');
            
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            // Fetch Report Stats
            const reportRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/report/${sellerId}?month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(reportRes.data);

            // Fetch Pending Payments
            const paymentsRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/seller/payments/${sellerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingPayments(paymentsRes.data.filter((p: any) => p.status === 'pending' && p.paymentMethod === 'bank_transfer'));

        } catch (err) {
            console.error("Error fetching finance data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async () => {
        if (!reportData || reportData.transactions?.length === 0) {
            Alert.alert("No Data", "There are no verified transactions for this month yet.");
            return;
        }

        setGeneratingReport(true);
        const html = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1A1C1E; }
                        .header { text-align: center; border-bottom: 4px solid #30C65A; padding-bottom: 25px; margin-bottom: 40px; }
                        .title { font-size: 32px; font-weight: 900; color: #1A1C1E; margin-bottom: 5px; }
                        .subtitle { font-size: 16px; color: #7F8C8D; }
                        .summary-grid { display: flex; justify-content: space-between; margin-bottom: 50px; gap: 20px; }
                        .stat-card { flex: 1; background: #F8F9FA; padding: 20px; border-radius: 15px; text-align: center; border: 1px solid #EEE; }
                        .stat-label { font-size: 12px; color: #7F8C8D; text-transform: uppercase; font-weight: 700; margin-bottom: 10px; }
                        .stat-value { font-size: 22px; font-weight: 800; color: #1A1C1E; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #30C65A; color: white; padding: 15px; text-align: left; font-size: 14px; text-transform: uppercase; }
                        td { padding: 15px; border-bottom: 1px solid #F0F0F0; font-size: 14px; color: #4A4A4A; }
                        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #BDC3C7; border-top: 1px solid #EEE; padding-top: 20px; }
                        .status-verified { color: #30C65A; font-weight: 700; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">HOME BITES</div>
                        <div class="subtitle">Monthly Financial Statement - ${reportData.period}</div>
                    </div>
                    
                    <div class="summary-grid">
                        <div class="stat-card">
                            <div class="stat-label">Total Revenue</div>
                            <div class="stat-value">LKR ${reportData.stats?.totalRevenue?.toLocaleString()}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Platform Fee</div>
                            <div class="stat-value" style="color: #E74C3C;">LKR ${reportData.stats?.totalCommission?.toLocaleString()}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Net Profit</div>
                            <div class="stat-value" style="color: #30C65A;">LKR ${reportData.stats?.netProfit?.toLocaleString()}</div>
                        </div>
                    </div>

                    <h3 style="margin-bottom: 20px; color: #1A1C1E;">Transaction Details</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Order ID</th>
                                <th>Student</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.transactions.map((t: any) => `
                                <tr>
                                    <td>${new Date(t.verifiedAt).toLocaleDateString()}</td>
                                    <td>#${t.orderId?._id?.substring(0, 8).toUpperCase()}</td>
                                    <td>${t.studentId?.firstName} ${t.studentId?.lastName}</td>
                                    <td>LKR ${t.amount?.toLocaleString()}</td>
                                    <td class="status-verified">VERIFIED</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        This is a computer-generated document. No signature required. <br/>
                        &copy; 2024 Home Bites SLIIT Project
                    </div>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                await Sharing.shareAsync(uri);
            } else {
                // For web, just print
                await Print.printAsync({ html });
            }
        } catch (error) {
            console.error("Report error:", error);
            Alert.alert("Error", "Failed to generate PDF report");
        } finally {
            setGeneratingReport(false);
        }
    };

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const handleVerify = async (paymentId: string, status: 'verified' | 'rejected') => {
        setVerifying(true);
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            await axios.patch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/verify/${paymentId}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert("Success", `Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
            setShowSlipModal(false);
            fetchFinanceData();
        } catch (err) {
            Alert.alert("Error", "Failed to verify payment");
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#30C65A" />
                    <Text style={styles.loadingText}>Loading Financial Data...</Text>
                </View>
                <BottomNavBar role="seller" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Financials</Text>
                    <Text style={styles.subtitle}>Manage earnings and verify payments</Text>
                </View>

                {/* Monthly Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View>
                            <Text style={styles.summaryLabel}>This Month's Revenue</Text>
                            <Text style={styles.summaryValue}>LKR {reportData?.stats?.totalRevenue?.toLocaleString() || 0}</Text>
                        </View>
                        <View style={styles.iconCircle}>
                            <Ionicons name="wallet" size={28} color="#30C65A" />
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Platform Fee (10%)</Text>
                            <Text style={[styles.statValue, { color: '#E74C3C' }]}>- LKR {reportData?.stats?.totalCommission?.toLocaleString() || 0}</Text>
                        </View>
                        <View style={[styles.statItem, { alignItems: 'flex-end' }]}>
                            <Text style={styles.statLabel}>Net Profit</Text>
                            <Text style={[styles.statValue, { color: '#30C65A' }]}>LKR {reportData?.stats?.netProfit?.toLocaleString() || 0}</Text>
                        </View>
                    </View>
                </View>

                {/* Verification Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Slip Verifications</Text>
                    {pendingPayments.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingPayments.length} New</Text>
                        </View>
                    )}
                </View>

                {pendingPayments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="checkmark-done" size={40} color="#30C65A" />
                        </View>
                        <Text style={styles.emptyText}>All payments are up to date!</Text>
                    </View>
                ) : (
                    pendingPayments.map((payment) => (
                        <TouchableOpacity 
                            key={payment._id} 
                            style={styles.paymentCard}
                            onPress={() => { setSelectedPayment(payment); setShowSlipModal(true); }}
                        >
                            <View style={styles.paymentMain}>
                                <View style={styles.paymentText}>
                                    <Text style={styles.studentName}>{payment.studentId?.firstName} {payment.studentId?.lastName}</Text>
                                    <Text style={styles.orderRef}>Order #{payment.orderId?._id?.substring(0, 8).toUpperCase()}</Text>
                                </View>
                                <View style={styles.amountInfo}>
                                    <Text style={styles.amountText}>LKR {payment.amount?.toLocaleString()}</Text>
                                    <View style={styles.viewLink}>
                                        <Text style={styles.viewLinkText}>View Slip</Text>
                                        <Ionicons name="chevron-forward" size={14} color="#30C65A" />
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <TouchableOpacity 
                    style={styles.downloadButton}
                    onPress={handleDownloadReport}
                    disabled={generatingReport}
                >
                    {generatingReport ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="cloud-download-outline" size={22} color="#FFF" />
                            <Text style={styles.downloadText}>Download Monthly Report (PDF)</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Slip Preview Modal */}
            <Modal visible={showSlipModal} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Bank Slip Verification</Text>
                                <Text style={styles.modalSubtitle}>Check details carefully before confirming</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowSlipModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#1A1C1E" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.imageContainer}>
                            <Image 
                                source={{ uri: selectedPayment?.bankSlipUrl }} 
                                style={styles.fullSlipImage} 
                                resizeMode="contain"
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.btnReject]} 
                                onPress={() => handleVerify(selectedPayment._id, 'rejected')}
                                disabled={verifying}
                            >
                                <Text style={[styles.btnText, { color: '#E74C3C' }]}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.btnVerify]} 
                                onPress={() => handleVerify(selectedPayment._id, 'verified')}
                                disabled={verifying}
                            >
                                {verifying ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={[styles.btnText, { color: '#FFF' }]}>Confirm Payment</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <BottomNavBar role="seller" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#7F8C8D', fontSize: 15 },
    scrollView: { flex: 1, paddingHorizontal: 20 },
    header: { marginTop: 20, marginBottom: 25 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1A1C1E' },
    subtitle: { fontSize: 16, color: '#7F8C8D', marginTop: 4 },
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 25,
        shadowColor: '#30C65A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 30
    },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 14, color: '#7F8C8D', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    summaryValue: { fontSize: 32, fontWeight: 'bold', color: '#1A1C1E', marginTop: 8 },
    iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8F9EE', justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { flex: 1 },
    statLabel: { fontSize: 12, color: '#A0A0A0', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1C1E' },
    badge: { backgroundColor: '#FF6B6B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 12 },
    badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    paymentCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 2
    },
    paymentMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    paymentText: { flex: 1 },
    studentName: { fontSize: 17, fontWeight: 'bold', color: '#1A1C1E' },
    orderRef: { fontSize: 13, color: '#A0A0A0', marginTop: 3 },
    amountInfo: { alignItems: 'flex-end' },
    amountText: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E' },
    viewLink: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    viewLinkText: { fontSize: 13, color: '#30C65A', fontWeight: '600', marginRight: 2 },
    emptyState: { 
        backgroundColor: '#FFF', 
        borderRadius: 25, 
        padding: 30, 
        alignItems: 'center', 
        borderStyle: 'dashed', 
        borderWidth: 1, 
        borderColor: '#DDD' 
    },
    emptyIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0FFF4', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    emptyText: { color: '#7F8C8D', fontSize: 16, fontWeight: '500' },
    downloadButton: {
        backgroundColor: '#1A1C1E',
        borderRadius: 20,
        flexDirection: 'row',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4
    },
    downloadText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { 
        backgroundColor: '#FFF', 
        borderTopLeftRadius: 35, 
        borderTopRightRadius: 35, 
        padding: 25, 
        height: '85%' 
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E' },
    modalSubtitle: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
    closeBtn: { padding: 5 },
    imageContainer: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
    fullSlipImage: { width: '100%', height: '100%' },
    modalFooter: { flexDirection: 'row', gap: 15, marginTop: 25, marginBottom: 10 },
    actionBtn: { flex: 1, padding: 20, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    btnReject: { backgroundColor: '#FFF0F0' },
    btnVerify: { backgroundColor: '#30C65A' },
    btnText: { fontSize: 17, fontWeight: 'bold' }
});

export default SellerFinanceScreen;
