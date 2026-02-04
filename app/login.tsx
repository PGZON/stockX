import { FadeInView } from '@/components/FadeInView';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn: authSignIn } = useAuth(); // Action from AuthContext

    const signInMutation = useMutation(api.auth.signIn); // Action from Convex Backend

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            // 1. Verify credentials with Convex Backend
            const result = await signInMutation({ email, password });

            if (result.error) {
                Alert.alert('Login Failed', result.error);
            } else if (result.token && result.user) {
                // 2. If valid, persist session locally via AuthContext (SecureStore)
                await authSignIn(result.token, result.user);
                // Navigation to (tabs) is handled automatically by AuthProvider
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        <FadeInView delay={100} style={styles.headerContainer}>
                            <Image
                                source={require('@/assets/images/stockX.png')}
                                style={styles.logo}
                                contentFit="contain"
                            />
                            <Text style={styles.welcomeText}>Welcome Back</Text>
                            <Text style={styles.subText}>Log in to your account</Text>
                        </FadeInView>

                        <FadeInView delay={200} style={styles.formContainer}>

                            {/* Email Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholderTextColor="#CBD5E1"
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        placeholderTextColor="#CBD5E1"
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeIcon}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#94A3B8"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.buttonText}>Log In</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Dummy Social Buttons for Premium Look */}
                            <View style={styles.socialRow}>
                                <TouchableOpacity style={styles.socialBtn}>
                                    <Ionicons name="logo-google" size={24} color="#EA4335" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialBtn}>
                                    <Ionicons name="logo-apple" size={24} color="#000000" />
                                </TouchableOpacity>
                            </View>

                        </FadeInView>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>By continuing, you agree to our Terms & Privacy</Text>
                        </View>


                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 32,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        width: 120, // Slightly larger for emphasis
        height: 120,
        marginBottom: 32,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '800', // Bolder typography
        color: '#1E293B',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5, // Thicker border
        borderColor: '#E2E8F0',
        borderRadius: 20, // More rounded
        paddingHorizontal: 16,
        height: 56, // Taller inputs
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '500',
        height: '100%',
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '500',
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    button: {
        backgroundColor: '#0F172A',
        height: 58,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#94A3B8',
        fontWeight: '600',
        fontSize: 14,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialBtn: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 12,
    }
});
