import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform, } from 'react-native';
import { useState } from "react";
import axios from "axios";
import { Link, useRouter } from 'expo-router';


function UserRegisterScreen (){

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [address, setAddress] = useState('');
    const role = 'seller';
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState('');
    const [businessName, setBusinessName] = useState('');

    const router = useRouter();


    const handleRegister = async () => {

     
        setLoading(true);

        try{
            const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/user/register`, {
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                phoneNumber: phoneNumber,
                profileImage: profileImage,
                address: address,
                role: role,
                description: description,
                businessName: businessName

            });

            if(confirmPassword !== password){
                Alert.alert("Password and Confirm Password do not match");
                return;
            }

            if(response.status === 201){
                Alert.alert("Registration Successful! Please Log in.");
                console.log("User Data:", response.data);
                router.push("/SellerLoginScreen");
            }
        }catch(err){
            console.log("Error Registering Seller: ", err);
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

          <Text style={styles.label}>Profile Image URL</Text>
          <TextInput
            style={styles.input}
            placeholder="Profile Image URL"
            value={profileImage}
            onChangeText={setProfileImage}
          />

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