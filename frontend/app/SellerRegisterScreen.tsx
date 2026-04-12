import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, Image } from 'react-native';
import { useState } from "react";
import axios from "axios";
import { Link, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';


function UserRegisterScreen (){

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const role = 'seller';
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [image, setImage] = useState<string | null>(null);

    const router = useRouter();

    //Pick the Profile Image
    const pickImage = async () => {

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if(status !== 'granted'){
        Alert.alert("Permission Denied", "Please allow access to your media library to upload a profile image.");
        return;
      }

      const results = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1,1],
        quality: 0.5,
      });

      if(!results.canceled){
          setImage(results.assets[0].uri);
      }
    };

    const handleRegister = async () => {

        // Validate passwords BEFORE making the API call
        if(confirmPassword !== password){
            Alert.alert("Password Mismatch", "Password and Confirm Password do not match.");
            return;
        }

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !phoneNumber || !address) {
            Alert.alert("Missing Fields", "Please fill in all required fields.");
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
        formData.append('role', role);
        formData.append('description', description);
        formData.append('businessName', businessName);

        if (image) {
            const fileName = image.split('/').pop() || 'profile.jpg';
            const fileType = fileName.split('.').pop() || 'jpeg';

            formData.append('profileImage', {
                uri: image,
                name: fileName,
                type: `image/${fileType}`,
            } as any);
        }

        try{
            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/user/register`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log("Response status:", response.status);
            console.log("User Data:", response.data);

            if(response.status === 201){
                Alert.alert("Registration Successful", "Your account has been created. Please log in.");
                router.push("/SellerLoginScreen");
            }
        }catch(err: any){
            console.log("Error Registering Seller: ", err);
            Alert.alert("Registration Failed", err.response?.data?.message || "An error occurred during registration.");
        } finally{
            setLoading(false);
        }

    }
    
return (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F6FA" }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.inputCard}>
          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

           <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Business Name"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter a brief description"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <Text style={styles.label}>Profile Picture</Text>
          <TouchableOpacity onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 50 }} />
            ) : (
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                <Text>Upload</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={address}
            onChangeText={setAddress}
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          <Link href="/StudentLoginScreen" style={styles.registerLink}>
            Already have an account? Log in here
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 40,
  },
  logo: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 25,
    color: "#CC1B1B",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2F3640",
  },
  inputCard: {
    backgroundColor: "#F79A19",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    elevation: 4,
    width: "100%",
    alignSelf: "center",
  },
  label: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DCDDE1",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 14,
    backgroundColor: "#FAFAFA",
  },
  button: {
    backgroundColor: "#F5F6FA",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
  registerLink: {
    textAlign: "center",
    color: "#ffffff",
    marginTop: 15,
    fontSize: 14,
  },
});

export default UserRegisterScreen;