import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Modal, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import BottomNavBar from '../components/BottomNavBar';
import * as ImagePicker from 'expo-image-picker';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const SellerFinanceScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [showSlipModal, setShowSlipModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [savingExpense, setSavingExpense] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Expense Form State
    const [expenseForm, setExpenseForm] = useState({
        category: 'materials',
        amount: '',
        description: '',
        billImage: null as any
    });

    const fetchFinanceData = async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const sellerId = Platform.OS === 'web' ? localStorage.getItem('userId') : await SecureStore.getItemAsync('userId');
            
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            const reportRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/report/${sellerId}?month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(reportRes.data);

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

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            setExpenseForm({ ...expenseForm, billImage: result.assets[0] });
        }
    };

    const handleEditExpense = (expense: any) => {
        setExpenseForm({
            category: expense.category,
            amount: expense.amount.toString(),
            description: expense.description,
            billImage: expense.billImageUrl ? { uri: expense.billImageUrl } : null
        });
        setEditingId(expense._id);
        setIsEditing(true);
        setShowExpenseModal(true);
    };

    const handleDeleteExpense = async (id: string) => {
        Alert.alert(
            "Delete Expense",
            "Are you sure you want to remove this record?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
                            await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/expenses/${id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            Alert.alert("Success", "Expense deleted");
                            fetchFinanceData();
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete expense");
                        }
                    }
                }
            ]
        );
    };

    const handleSaveExpense = async () => {
        if (!expenseForm.amount || !expenseForm.description) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setSavingExpense(true);
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const sellerId = Platform.OS === 'web' ? localStorage.getItem('userId') : await SecureStore.getItemAsync('userId');
            
            const formData = new FormData();
            formData.append('sellerId', sellerId!);
            formData.append('category', expenseForm.category);
            formData.append('amount', expenseForm.amount);
            formData.append('description', expenseForm.description);

            if (expenseForm.billImage && expenseForm.billImage.uri && !expenseForm.billImage.uri.startsWith('http')) {
                const uri = expenseForm.billImage.uri;
                const type = 'image/jpeg';
                const name = 'bill.jpg';
                formData.append('bill', { uri, type, name } as any);
            }

            if (isEditing && editingId) {
                await axios.patch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/expenses/${editingId}`, formData, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}` 
                    }
                });
                Alert.alert("Success", "Expense updated");
            } else {
                await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/finance/expenses`, formData, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}` 
                    }
                });
                Alert.alert("Success", "Expense recorded");
            }

            setShowExpenseModal(false);
            setExpenseForm({ category: 'materials', amount: '', description: '', billImage: null });
            setIsEditing(false);
            setEditingId(null);
            fetchFinanceData();
        } catch (err) {
            console.error(err);
            Alert.alert("Error", `Failed to ${isEditing ? 'update' : 'save'} expense`);
        } finally {
            setSavingExpense(false);
        }
    };

    const handleFinalPDFDownload = async () => {
        if (!reportData) return;
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
                        .summary-grid { display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 50px; gap: 20px; }
                        .stat-card { flex: 1; min-width: 150px; background: #F8F9FA; padding: 20px; border-radius: 15px; text-align: center; border: 1px solid #EEE; }
                        .stat-label { font-size: 12px; color: #7F8C8D; text-transform: uppercase; font-weight: 700; margin-bottom: 10px; }
                        .stat-value { font-size: 20px; font-weight: 800; color: #1A1C1E; }
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
                            <div class="stat-label">Revenue</div>
                            <div class="stat-value">LKR ${reportData.stats?.totalRevenue?.toLocaleString()}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Platform Fee</div>
                            <div class="stat-value" style="color: #E74C3C;">LKR ${reportData.stats?.totalCommission?.toLocaleString()}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Gross Profit</div>
                            <div class="stat-value">LKR ${reportData.stats?.grossProfit?.toLocaleString()}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Expenses</div>
                            <div class="stat-value" style="color: #E67E22;">LKR ${reportData.stats?.totalExpenses?.toLocaleString()}</div>
                        </div>
                        <div class="stat-card" style="border: 2px solid #30C65A;">
                            <div class="stat-label">Net Profit</div>
                            <div class="stat-value" style="color: #30C65A;">LKR ${reportData.stats?.netProfit?.toLocaleString()}</div>
                        </div>
                    </div>

                    <h3 style="margin-bottom: 20px; color: #1A1C1E;">Income (Orders)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Order ID</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.transactions.map((t: any) => `
                                <tr>
                                    <td>${new Date(t.verifiedAt).toLocaleDateString()}</td>
                                    <td>#${t.orderId?._id?.substring(0, 8).toUpperCase()}</td>
                                    <td>LKR ${t.amount?.toLocaleString()}</td>
                                    <td class="status-verified">COMPLETED</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <h3 style="margin-top: 40px; margin-bottom: 20px; color: #1A1C1E;">Expenditure (Bills/Materials)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.expenses.map((e: any) => `
                                <tr>
                                    <td>${new Date(e.date).toLocaleDateString()}</td>
                                    <td>${e.category.toUpperCase()}</td>
                                    <td>${e.description}</td>
                                    <td>LKR ${e.amount?.toLocaleString()}</td>
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
                await Print.printAsync({ html });
            }
        } catch (error) {
            console.error("Report error:", error);
            Alert.alert("Error", "Failed to generate PDF report");
        } finally {
            setGeneratingReport(false);
            setShowReportModal(false);
        }
    };

    const handlePreviewReport = async () => {
        if (!reportData || (reportData.transactions?.length === 0 && reportData.expenses?.length === 0)) {
            Alert.alert("No Data", "There are no transactions or expenses for this month yet.");
            return;
        }
        setShowReportModal(true);
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
                    <Text style={styles.subtitle}>Manage earnings, bills and expenses</Text>
                </View>

                {/* Advanced Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View>
                            <Text style={styles.summaryLabel}>This Month's Net Profit</Text>
                            <Text style={styles.summaryValue}>LKR {reportData?.stats?.netProfit?.toLocaleString() || 0}</Text>
                        </View>
                        <View style={styles.iconCircle}>
                            <Ionicons name="stats-chart" size={28} color="#30C65A" />
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Revenue</Text>
                            <Text style={styles.statSubValue}>LKR {reportData?.stats?.totalRevenue?.toLocaleString() || 0}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Expenses</Text>
                            <Text style={[styles.statSubValue, { color: '#E67E22' }]}>LKR {reportData?.stats?.totalExpenses?.toLocaleString() || 0}</Text>
                        </View>
                    </View>
                </View>
                {/* Action Buttons Row */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity 
                        style={[styles.actionCard, { backgroundColor: '#30C65A' }]}
                        onPress={() => {
                            setIsEditing(false);
                            setEditingId(null);
                            setExpenseForm({ category: 'materials', amount: '', description: '', billImage: null });
                            setShowExpenseModal(true);
                        }}
                    >
                        <Ionicons name="add-circle" size={28} color="#FFF" />
                        <Text style={styles.actionCardText}>Add Expense</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionCard, { backgroundColor: '#1A1C1E' }]}
                        onPress={handlePreviewReport}
                        disabled={generatingReport}
                    >
                        <Ionicons name="document-text" size={28} color="#FFF" />
                        <Text style={styles.actionCardText}>Get Report</Text>
                    </TouchableOpacity>
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

                {/* Monthly Expenditure Section */}
                <View style={[styles.sectionHeader, { marginTop: 25 }]}>
                    <Text style={styles.sectionTitle}>Monthly Expenditure</Text>
                    {reportData?.expenses?.length > 0 && (
                        <View style={[styles.badge, { backgroundColor: '#E67E22' }]}>
                            <Text style={styles.badgeText}>{reportData.expenses.length} Records</Text>
                        </View>
                    )}
                </View>

                {reportData?.expenses?.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: '#FFF5EB' }]}>
                            <Ionicons name="receipt-outline" size={40} color="#E67E22" />
                        </View>
                        <Text style={styles.emptyText}>No expenses recorded for this month.</Text>
                    </View>
                ) : (
                    reportData.expenses.map((expense: any) => (
                        <View key={expense._id} style={styles.expenseCard}>
                            <TouchableOpacity 
                                style={styles.expenseMain}
                                onPress={() => {
                                    setSelectedPayment({ ...expense, isExpense: true }); 
                                    setShowSlipModal(true);
                                }}
                            >
                                <View style={styles.categoryIconCircle}>
                                    <Ionicons 
                                        name={
                                            expense.category === 'transport' ? 'bus' : 
                                            expense.category === 'materials' ? 'fast-food' :
                                            expense.category === 'packaging' ? 'cube' : 'pricetag'
                                        } 
                                        size={20} 
                                        color="#E67E22" 
                                    />
                                </View>
                                <View style={styles.expenseInfo}>
                                    <Text style={styles.expenseDesc}>{expense.description}</Text>
                                    <Text style={styles.expenseDate}>
                                        {new Date(expense.date).toLocaleDateString()} • {expense.category.toUpperCase()}
                                    </Text>
                                    <Text style={styles.expenseAmountTextSmall}>LKR {expense.amount?.toLocaleString()}</Text>
                                </View>
                                
                                {expense.billImageUrl && (
                                    <View style={styles.thumbnailContainer}>
                                        <Image 
                                            source={{ uri: expense.billImageUrl }} 
                                            style={styles.billThumbnail}
                                            resizeMode="cover"
                                        />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.expenseActions}>
                                <TouchableOpacity 
                                    style={styles.editActionBtn} 
                                    onPress={() => handleEditExpense(expense)}
                                >
                                    <Ionicons name="pencil" size={20} color="#3498DB" />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.deleteActionBtn} 
                                    onPress={() => handleDeleteExpense(expense._id)}
                                >
                                    <Ionicons name="trash" size={20} color="#E74C3C" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Report Preview Modal */}
            <Modal visible={showReportModal} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: 'auto', maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Report Preview</Text>
                                <Text style={styles.modalSubtitle}>Monthly Statement for {reportData?.period}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowReportModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#1A1C1E" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.previewStatsGrid}>
                            <View style={styles.previewStatRow}>
                                <Text style={styles.previewStatLabel}>Total Revenue</Text>
                                <Text style={styles.previewStatValue}>LKR {reportData?.stats?.totalRevenue?.toLocaleString()}</Text>
                            </View>
                            <View style={styles.previewStatRow}>
                                <Text style={styles.previewStatLabel}>Platform Fee (10%)</Text>
                                <Text style={[styles.previewStatValue, { color: '#E74C3C' }]}>- LKR {reportData?.stats?.totalCommission?.toLocaleString()}</Text>
                            </View>
                            <View style={styles.previewStatRow}>
                                <Text style={styles.previewStatLabel}>Total Expenses</Text>
                                <Text style={[styles.previewStatValue, { color: '#E67E22' }]}>- LKR {reportData?.stats?.totalExpenses?.toLocaleString()}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.previewStatRow}>
                                <Text style={[styles.previewStatLabel, { fontWeight: '900', color: '#1A1C1E' }]}>Net Profit</Text>
                                <Text style={[styles.previewStatValue, { fontWeight: '900', color: '#30C65A' }]}>LKR {reportData?.stats?.netProfit?.toLocaleString()}</Text>
                            </View>
                        </View>

                        <Text style={styles.previewNotice}>
                            The PDF report will include a full breakdown of all {reportData?.transactions?.length} orders and {reportData?.expenses?.length} expenditure records.
                        </Text>

                        <TouchableOpacity 
                            style={styles.saveBtn}
                            onPress={handleFinalPDFDownload}
                            disabled={generatingReport}
                        >
                            {generatingReport ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="cloud-download" size={22} color="#FFF" style={{ marginRight: 10 }} />
                                    <Text style={styles.saveBtnText}>Download Official PDF</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Expense Modal */}
            <Modal visible={showExpenseModal} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{isEditing ? 'Edit Expense' : 'Record Expense'}</Text>
                                <Text style={styles.modalSubtitle}>Materials, packaging, transport, etc.</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowExpenseModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#1A1C1E" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Category</Text>
                            <View style={styles.categoryGrid}>
                                {['materials', 'packaging', 'transport', 'utilities', 'other'].map((cat) => (
                                    <TouchableOpacity 
                                        key={cat}
                                        style={[styles.categoryBtn, expenseForm.category === cat && styles.categoryBtnActive]}
                                        onPress={() => setExpenseForm({...expenseForm, category: cat})}
                                    >
                                        <Text style={[styles.categoryText, expenseForm.category === cat && styles.categoryTextActive]}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Amount (LKR)</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="e.g. 1500"
                                keyboardType="numeric"
                                value={expenseForm.amount}
                                onChangeText={(text) => setExpenseForm({...expenseForm, amount: text})}
                            />

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput 
                                style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 15 }]}
                                placeholder="What was this for? (e.g. 5kg Chicken, Spices)"
                                multiline
                                value={expenseForm.description}
                                onChangeText={(text) => setExpenseForm({...expenseForm, description: text})}
                            />

                            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                {expenseForm.billImage ? (
                                    <Image source={{ uri: expenseForm.billImage.uri }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.pickerPlaceholder}>
                                        <Ionicons name="camera" size={32} color="#7F8C8D" />
                                        <Text style={styles.pickerText}>Upload Bill / Receipt Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.saveBtn}
                                onPress={handleSaveExpense}
                                disabled={savingExpense}
                            >
                                {savingExpense ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.saveBtnText}>{isEditing ? 'Update Expense' : 'Save Expense'}</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Expense / Slip Preview Modal */}
            <Modal visible={showSlipModal} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>
                                    {selectedPayment?.isExpense ? 'Expense Reference' : 'Bank Slip Verification'}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {selectedPayment?.isExpense ? 'Reference image for your expenditure' : 'Check details carefully before confirming'}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowSlipModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#1A1C1E" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.imageContainer}>
                            <Image 
                                source={{ uri: selectedPayment?.isExpense ? selectedPayment?.billImageUrl : selectedPayment?.bankSlipUrl }} 
                                style={styles.fullSlipImage} 
                                resizeMode="contain"
                            />
                        </View>

                        <View style={styles.modalFooter}>
                            {selectedPayment?.isExpense ? (
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.btnVerify, { backgroundColor: '#1A1C1E' }]} 
                                    onPress={() => setShowSlipModal(false)}
                                >
                                    <Text style={[styles.btnText, { color: '#FFF' }]}>Close Preview</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, styles.btnReject]} 
                                        onPress={() => handleVerify(selectedPayment?._id, 'rejected')}
                                        disabled={verifying}
                                    >
                                        <Text style={[styles.btnText, { color: '#E74C3C' }]}>Reject</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, styles.btnVerify]} 
                                        onPress={() => handleVerify(selectedPayment?._id, 'verified')}
                                        disabled={verifying}
                                    >
                                        {verifying ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Text style={[styles.btnText, { color: '#FFF' }]}>Confirm Payment</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
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
        marginBottom: 20
    },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 14, color: '#7F8C8D', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    summaryValue: { fontSize: 30, fontWeight: 'bold', color: '#1A1C1E', marginTop: 8 },
    iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8F9EE', justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statItem: { flex: 1 },
    statSubValue: { fontSize: 18, fontWeight: 'bold', color: '#1A1C1E', marginTop: 4 },
    actionGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    actionCard: { flex: 1, borderRadius: 22, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
    actionCardText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    statLabel: { fontSize: 12, color: '#A0A0A0', marginBottom: 4 },
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContent: { 
        backgroundColor: '#FFF', 
        borderTopLeftRadius: 35, 
        borderTopRightRadius: 35, 
        padding: 25, 
        height: '90%' 
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1C1E' },
    modalSubtitle: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
    closeBtn: { padding: 5 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#1A1C1E', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F0F0F0' },
    categoryBtnActive: { backgroundColor: '#30C65A' },
    categoryText: { color: '#4A4A4A', fontWeight: '600' },
    categoryTextActive: { color: '#FFF' },
    input: { backgroundColor: '#F8F9FA', borderRadius: 15, padding: 18, fontSize: 16, borderWidth: 1, borderColor: '#EEE' },
    imagePicker: { height: 180, backgroundColor: '#F8F9FA', borderRadius: 20, marginTop: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%' },
    pickerPlaceholder: { alignItems: 'center' },
    pickerText: { color: '#7F8C8D', marginTop: 10, fontWeight: '600' },
    saveBtn: { backgroundColor: '#30C65A', padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 30, shadowColor: '#30C65A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    imageContainer: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
    fullSlipImage: { width: '100%', height: '100%' },
    modalFooter: { flexDirection: 'row', gap: 15, marginTop: 25, marginBottom: 10 },
    actionBtn: { flex: 1, padding: 20, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    btnReject: { backgroundColor: '#FFF0F0' },
    btnVerify: { backgroundColor: '#30C65A' },
    btnText: { fontSize: 17, fontWeight: 'bold' },

    expenseCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    expenseMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    categoryIconCircle: { 
        width: 45, 
        height: 45, 
        borderRadius: 22, 
        backgroundColor: '#FFF5EB', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 15 
    },
    expenseInfo: { flex: 1 },
    expenseDesc: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
    expenseDate: { fontSize: 12, color: '#A0A0A0', marginTop: 3 },
    expenseAmount: { alignItems: 'flex-end' },
    expenseAmountText: { fontSize: 16, fontWeight: 'bold', color: '#E67E22' },
    expenseAmountTextSmall: { fontSize: 16, fontWeight: 'bold', color: '#E67E22', marginTop: 5 },
    hasBill: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    hasBillText: { fontSize: 10, color: '#E67E22', fontWeight: '700', marginLeft: 3, textTransform: 'uppercase' },
    thumbnailContainer: { width: 60, height: 60, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F0F0F0', position: 'relative', marginLeft: 10 },
    billThumbnail: { width: '100%', height: '100%' },
    expandIcon: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: 2 },
    
    // Expense Actions
    expenseActions: { 
        flexDirection: 'column', 
        gap: 15, 
        marginLeft: 15, 
        borderLeftWidth: 1, 
        borderLeftColor: '#EEE', 
        paddingLeft: 15,
        justifyContent: 'center',
        minWidth: 55
    },
    editActionBtn: { padding: 10, backgroundColor: '#E1F5FE', borderRadius: 12 },
    deleteActionBtn: { padding: 10, backgroundColor: '#FFEBEE', borderRadius: 12 },

    // Preview Modal Styles
    previewStatsGrid: { backgroundColor: '#F8F9FA', borderRadius: 20, padding: 20, marginVertical: 20, borderWidth: 1, borderColor: '#EEE' },
    previewStatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    previewStatLabel: { fontSize: 14, color: '#7F8C8D', fontWeight: '600' },
    previewStatValue: { fontSize: 16, fontWeight: 'bold', color: '#1A1C1E' },
    previewNotice: { fontSize: 13, color: '#A0A0A0', textAlign: 'center', marginBottom: 25, lineHeight: 18, paddingHorizontal: 10 }
});

export default SellerFinanceScreen;
