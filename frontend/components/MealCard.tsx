import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MealCardProps {
    meal: {
        mealName: string;
        description: string;
        price: number;
        image: string;
    };
    onDelete?: () => void;
    onEdit?: () => void;
}

const MealCard = ({ meal, onDelete, onEdit }: MealCardProps) => {
    return (
        <View style={styles.card}>
            <Image source={{ uri: meal.image }} style={styles.image} />
            
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{meal.mealName}</Text>
                <Text style={styles.description} numberOfLines={2}>{meal.description}</Text>
                
                <View style={styles.footer}>
                    <Text style={styles.price}>${meal.price.toFixed(2)}</Text>
                    
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
                            <Ionicons name="pencil-outline" size={18} color="#A0A0A0" />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
                            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#F5F6FA',
    },
    content: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F3640',
        marginBottom: 4,
    },
    description: {
        fontSize: 13,
        color: '#7F8C8D',
        marginBottom: 8,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#30C65A',
    },
    actions: {
        flexDirection: 'row',
    },
    actionBtn: {
        width: 35,
        height: 35,
        borderRadius: 10,
        backgroundColor: '#F5F6FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteBtn: {
        backgroundColor: '#FFF0F0',
    },
});

export default MealCard;
