import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all the fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/login`, {
        email: email,
        password: password
      });

      if (response.status === 200) {
        const { token, user } = response.data;
        console.log("LOGIN SUCCESS! Token exists:", !!token);

        if (!token) throw new Error("No token received from server");

        const tokenString = String(token);
        const userString = JSON.stringify(user || {});

        if (Platform.OS === 'web') { //For desktops
          localStorage.setItem('userToken', tokenString);
          localStorage.setItem('userData', userString);
          localStorage.setItem('userId', user.id);
        } else {
          await SecureStore.setItemAsync('userToken', tokenString);
          await SecureStore.setItemAsync('userData', userString);
          await SecureStore.setItemAsync('userId', user.id);
        }

        Alert.alert("Welcome!", "You have successfully logged in.");
        router.push("/SellerDashboard");
      }
    } catch (err: any) {
      console.log("Error Login: ", err);
      Alert.alert("Login Failed", "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton}>
          <Link href="/" asChild>
            <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
          </Link>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Seller Portal</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder='example@gmail.com'
                placeholderTextColor="#A0A0A0"
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail} />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#A0A0A0" style={styles.inputIcon} />
              <TextInput
                placeholder='••••••••'
                placeholderTextColor="#A0A0A0"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword} />
            </View>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New Seller? </Text>
            <Link href="/SellerRegisterScreen" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Register Now</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1C1E',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1C1E',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 15,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1A1C1E',
  },
  loginButton: {
    backgroundColor: '#30C65A',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#30C65A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#7F8C8D',
    fontSize: 15,
  },
  registerLink: {
    color: '#30C65A',
    fontSize: 15,
    fontWeight: 'bold',
  }
});

export default LoginScreen;