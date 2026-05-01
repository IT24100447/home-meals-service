import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Image, ActivityIndicator } from 'react-native';
import { useState } from "react";
import axios from "axios";
import { Link, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LOCATIONS } from '../constants/locations';

function UserRegisterScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const role = 'student';
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Track which fields have been touched for inline validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // ── Validation helpers ──

  const isAlphaOnly = (value: string) => /^[A-Za-z\s]+$/.test(value);

  const isValidEmail = (value: string) => {
    // Only allows alphanumeric, @, and . — no other special characters
    if (/[^A-Za-z0-9@.]/.test(value)) return false;
    // Standard email pattern with valid domain
    return /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(\.[A-Za-z]{2,})+$/.test(value);
  };

  const isValidPhone = (value: string) => /^[0-9]{10}$/.test(value);

  const passwordChecks = {
    length: password.length >= 8 && password.length <= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const isValidCity = (value: string) => /^[A-Za-z\s]+$/.test(value);

  const isValidAddress = (value: string) => /^[A-Za-z0-9\s\/.,-]+$/.test(value);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Please allow access to your media library to upload a profile image.");
      return;
    }

    const results = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!results.canceled) {
      setImage(results.assets[0].uri);
    }
  }

  const handleRegister = async () => {
    // Mark all fields as touched to show errors
    const allFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'password', 'confirmPassword', 'city', 'address'];
    const allTouched: Record<string, boolean> = {};
    allFields.forEach(f => allTouched[f] = true);
    setTouched(allTouched);

    // 1. All fields required (except profile photo)
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phoneNumber || !address || !city) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    // 2. Name validation
    if (!isAlphaOnly(firstName) || !isAlphaOnly(lastName)) {
      Alert.alert("Invalid Name", "First name and last name should contain only letters.");
      return;
    }

    // 3. Email validation
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    // 4. Phone validation
    if (!isValidPhone(phoneNumber)) {
      Alert.alert("Invalid Phone", "Phone number must be exactly 10 digits.");
      return;
    }

    // 5. Password validation
    if (!isPasswordValid) {
      Alert.alert("Weak Password", "Password must meet all the listed requirements.");
      return;
    }

    // 6. Confirm password
    if (confirmPassword !== password) {
      Alert.alert("Password Mismatch", "Password and Confirm Password do not match");
      return;
    }

    // 7. City & Address validation
    if (!isValidCity(city)) {
      Alert.alert("Invalid City", "City should contain only letters.");
      return;
    }

    if (!isValidAddress(address)) {
      Alert.alert("Invalid Address", "Address can only contain letters, numbers, spaces, '/', '.', ',' and '-'.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('phoneNumber', phoneNumber);
    formData.append('address', address);
    formData.append('city', city);
    formData.append('role', role);

    if (image) {
      if (Platform.OS === 'web') {
        const fetchResponse = await fetch(image);
        const blob = await fetchResponse.blob();
        const fileName = `profile_${Date.now()}.jpg`;
        formData.append('profileImage', blob, fileName);
      } else {
        const fileName = image.split('/').pop() || 'profile.jpg';
        const fileType = fileName.split('.').pop() || 'jpeg';
        formData.append('profileImage', {
          uri: image,
          name: fileName,
          type: `image/${fileType}`,
        } as any);
      }
    }

    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        Alert.alert(
          "Success",
          "Your account has been created successfully!",
          [{ text: "Login Now", onPress: () => router.push("/StudentLoginScreen") }]
        );
      }
    } catch (err: any) {
      console.log("Error Registering Student: ", err);
      Alert.alert("Registration Failed", err.response?.data?.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  // ── Inline validation indicator component ──
  const ValidationRow = ({ valid, label }: { valid: boolean; label: string }) => (
    <View style={styles.validationRow}>
      <Ionicons
        name={valid ? "checkmark-circle" : "close-circle"}
        size={16}
        color={valid ? "#30C65A" : "#E74C3C"}
      />
      <Text style={[styles.validationText, { color: valid ? "#30C65A" : "#E74C3C" }]}>
        {label}
      </Text>
    </View>
  );

  const FieldError = ({ message }: { message: string }) => (
    <Text style={styles.errorText}>{message}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1C1E" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create an Account</Text>
          </View>

          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera" size={30} color="#30C65A" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.imageLabel}>Upload Profile Photo</Text>
            <Text style={styles.optionalLabel}>(Optional)</Text>
          </View>

          <View style={styles.form}>
            {/* ── First Name & Last Name ── */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>First Name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, touched.firstName && firstName.length > 0 && !isAlphaOnly(firstName) && styles.inputError]}
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  onBlur={() => markTouched('firstName')}
                />
                {touched.firstName && firstName.length === 0 && (
                  <FieldError message="First name is required" />
                )}
                {touched.firstName && firstName.length > 0 && !isAlphaOnly(firstName) && (
                  <FieldError message="Only letters allowed" />
                )}
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={[styles.input, touched.lastName && lastName.length > 0 && !isAlphaOnly(lastName) && styles.inputError]}
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  onBlur={() => markTouched('lastName')}
                />
                {touched.lastName && lastName.length === 0 && (
                  <FieldError message="Last name is required" />
                )}
                {touched.lastName && lastName.length > 0 && !isAlphaOnly(lastName) && (
                  <FieldError message="Only letters allowed" />
                )}
              </View>
            </View>

            {/* ── Email ── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, touched.email && email.length > 0 && !isValidEmail(email) && styles.inputError]}
                placeholder="john@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onBlur={() => markTouched('email')}
              />
              {touched.email && email.length === 0 && (
                <FieldError message="Email is required" />
              )}
              {touched.email && email.length > 0 && !isValidEmail(email) && (
                <FieldError message="Enter a valid email (only letters, numbers, @ and . allowed)" />
              )}
            </View>

            {/* ── Phone Number with character count ── */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
                <Text style={[
                  styles.charCount,
                  phoneNumber.length === 10 ? styles.charCountValid : (phoneNumber.length > 10 ? styles.charCountError : {})
                ]}>
                  {phoneNumber.length}/10
                </Text>
              </View>
              <TextInput
                style={[styles.input, touched.phoneNumber && phoneNumber.length > 0 && !isValidPhone(phoneNumber) && styles.inputError]}
                placeholder="0771234567"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                onBlur={() => markTouched('phoneNumber')}
              />
              {touched.phoneNumber && phoneNumber.length === 0 && (
                <FieldError message="Phone number is required" />
              )}
              {touched.phoneNumber && phoneNumber.length > 0 && phoneNumber.length !== 10 && (
                <FieldError message="Phone number must be exactly 10 digits" />
              )}
            </View>

            {/* ── Password with live strength checklist ── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper]}>
                <TextInput
                  style={[styles.passwordInput]}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => markTouched('password')}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#A0A0A0" 
                  />
                </TouchableOpacity>
              </View>
              {password.length > 0 && (
                <View style={styles.passwordChecklist}>
                  <ValidationRow valid={passwordChecks.length} label="8–12 characters" />
                  <ValidationRow valid={passwordChecks.uppercase} label="Uppercase letter (A–Z)" />
                  <ValidationRow valid={passwordChecks.lowercase} label="Lowercase letter (a–z)" />
                  <ValidationRow valid={passwordChecks.number} label="Number (0–9)" />
                  <ValidationRow valid={passwordChecks.special} label="Special character (!, @, #, $, etc.)" />
                </View>
              )}
              {touched.password && password.length === 0 && (
                <FieldError message="Password is required" />
              )}
            </View>

            {/* ── Confirm Password with match indicator ── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password <Text style={styles.required}>*</Text></Text>
              <View style={[styles.inputWrapper, confirmPassword.length > 0 && (passwordsMatch ? styles.inputSuccess : styles.inputError)]}>
                <TextInput
                  style={[styles.passwordInput]}
                  placeholder="••••••••"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() => markTouched('confirmPassword')}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#A0A0A0" 
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && (
                <View style={styles.matchIndicator}>
                  <Ionicons
                    name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={passwordsMatch ? "#30C65A" : "#E74C3C"}
                  />
                  <Text style={{ color: passwordsMatch ? "#30C65A" : "#E74C3C", fontSize: 13, marginLeft: 4 }}>
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Current City ── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current City <Text style={styles.required}>*</Text></Text>
              
              <View style={styles.cityRow}>
                {LOCATIONS.map((loc) => (
                  <TouchableOpacity 
                    key={loc} 
                    style={[styles.cityChip, city === loc && !isOtherSelected && styles.activeCityChip]} 
                    onPress={() => {
                      setCity(loc);
                      setIsOtherSelected(false);
                    }}
                  >
                    <Text style={[styles.cityChipText, city === loc && !isOtherSelected && styles.activeCityChipText]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity 
                  style={[styles.cityChip, isOtherSelected && styles.activeCityChip]} 
                  onPress={() => {
                    setIsOtherSelected(true);
                    setCity('');
                  }}
                >
                  <Text style={[styles.cityChipText, isOtherSelected && styles.activeCityChipText]}>Other</Text>
                </TouchableOpacity>
              </View>

              {isOtherSelected && (
                <View style={styles.customCityContainer}>
                  <TextInput
                    style={[styles.input, touched.city && city.length > 0 && !isValidCity(city) && styles.inputError]}
                    placeholder="Enter your city"
                    value={city}
                    onChangeText={setCity}
                    onBlur={() => markTouched('city')}
                    autoFocus
                  />
                  {touched.city && city.length === 0 && (
                    <FieldError message="City name is required" />
                  )}
                  {touched.city && city.length > 0 && !isValidCity(city) && (
                    <FieldError message="City should contain only letters" />
                  )}
                </View>
              )}
            </View>

            {/* ── Address ── */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea, touched.address && address.length > 0 && !isValidAddress(address) && styles.inputError]}
                placeholder="123/A, Main Street"
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={setAddress}
                onBlur={() => markTouched('address')}
              />
              {touched.address && address.length === 0 && (
                <FieldError message="Address is required" />
              )}
              {touched.address && address.length > 0 && !isValidAddress(address) && (
                <FieldError message="Only letters, numbers, spaces, '/', '.', ',' and '-' are allowed" />
              )}
            </View>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/StudentLoginScreen" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 30,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FFF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#30C65A',
    borderStyle: 'dashed',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    color: '#30C65A',
    fontWeight: '600',
  },
  optionalLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 15,
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
  required: {
    color: '#E74C3C',
    fontSize: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  charCountValid: {
    color: '#30C65A',
  },
  charCountError: {
    color: '#E74C3C',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#1A1C1E',
  },
  inputError: {
    borderColor: '#E74C3C',
    borderWidth: 1.5,
  },
  inputSuccess: {
    borderColor: '#30C65A',
    borderWidth: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 15,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1A1C1E',
  },
  eyeIcon: {
    padding: 5,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  passwordChecklist: {
    marginTop: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validationText: {
    fontSize: 13,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 5,
  },
  registerButton: {
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
  registerButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    paddingBottom: 20,
  },
  footerText: {
    color: '#7F8C8D',
    fontSize: 15,
  },
  loginLink: {
    color: '#30C65A',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  cityChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  activeCityChip: {
    backgroundColor: '#E8F9EE',
    borderColor: '#30C65A',
    borderWidth: 1,
  },
  cityChipText: {
    color: '#7F8C8D',
    fontSize: 14,
    fontWeight: '500',
  },
  activeCityChipText: {
    color: '#30C65A',
    fontWeight: 'bold',
  },
  customCityContainer: {
    marginTop: 5,
  }
});

export default UserRegisterScreen;