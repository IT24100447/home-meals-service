import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const BottomNavBar = ({ role = 'seller' }: { role?: 'seller' | 'student' }) => {
    const router = useRouter();
    const pathname = usePathname();

    const sellerTabs = [
        { name: 'Dashboard', icon: 'grid-outline', path: '/SellerDashboard' },
        { name: 'Menu', icon: 'fast-food-outline', path: '/SellerMenuScreen' },
        { name: 'Orders', icon: 'clipboard-outline', path: '/SellerOrders' },
        { name: 'Requests', icon: 'pencil-outline', path: '/SellerRequests' },
        { name: 'Alerts', icon: 'notifications-outline', path: '/SellerAlerts' },
    ];

    const studentTabs = [
        { name: 'Home', icon: 'home-outline', path: '/StudentDashboard' },
        { name: 'Orders', icon: 'list-outline', path: '/StudentOrders' },
        { name: 'Requests', icon: 'create-outline', path: '/StudentRequests' },
        { name: 'Alerts', icon: 'notifications-outline', path: '/StudentAlerts' },
    ];

    const tabs = role === 'seller' ? sellerTabs : studentTabs;

    return (
        <View style={styles.container}>
            {tabs.map((tab, index) => {
                const isActive = pathname.startsWith(tab.path);
                return (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.tab} 
                        onPress={() => router.push(tab.path as any)}
                    >
                        <View style={[styles.iconContainer, isActive && styles.activeIconBg]}>
                            <Ionicons 
                                name={tab.icon as any} 
                                size={24} 
                                color={isActive ? '#30C65A' : '#A0A0A0'} 
                            />
                        </View>
                        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                            {tab.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        height: 80,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingBottom: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tab: {
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeIconBg: {
        backgroundColor: '#E8F9EE',
    },
    tabText: {
        fontSize: 10,
        color: '#A0A0A0',
        marginTop: 4,
    },
    activeTabText: {
        color: '#30C65A',
        fontWeight: '600',
    },
});

export default BottomNavBar;
