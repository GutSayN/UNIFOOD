/**
 * ProfileScreen - CON ESTILOS MEJORADOS DEL FORMULARIO
 * ✅ Formulario con diseño moderno siguiendo ProductFormScreen
 * ✅ Inputs con bordes y focus states mejorados
 * ✅ Secciones con indicadores visuales
 * ✅ Labels con asteriscos para campos requeridos
 * ✅ Validación visual con contadores de caracteres
 */

import React, { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Alert, 
    StyleSheet, 
    ScrollView,
    Modal, 
    SafeAreaView,
    ActivityIndicator
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native"; 
import storageService from "../services/Storage.service";
import CONFIG from "../config/app.config"; 
import authService from "../services/Auth.service";
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel'; 

const colors = {
    primaryDark: '#065f46', 
    primaryLight: '#10b981',
    backgroundLight: '#f0fdf4',
    textDark: '#1f2937',
    textMedium: '#6b7280',
    danger: '#dc2626',
    dangerLight: '#fee2e2',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    accentGreen: '#d1fae5', 
    white: '#ffffff',
    gray: '#e5e7eb',
    darkOverlay: 'rgba(0, 0, 0, 0.7)',
};

const getInitials = (fullName) => {
    const names = fullName ? fullName.trim().split(/\s+/).filter(Boolean) : [];
    if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
    }
    if (names.length === 1) {
        return names[0][0].toUpperCase();
    }
    return 'US'; 
};

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { user, logout, reloadUser } = useAuthViewModel(); 
    
    const [form, setForm] = useState({
        id: null, name: "", email: "", phoneNumber: "", password: "",
    });
    const [originalForm, setOriginalForm] = useState(null); 
    const [isLoading, setIsLoading] = useState(false); 
    const [isEditMode, setIsEditMode] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);
    const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [successModalMessage, setSuccessModalMessage] = useState('');
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); 
    const [deleteStep, setDeleteStep] = useState(1);
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadUser();
        });
        return unsubscribe;
    }, [navigation]);

    const loadUser = async () => {
        const data = await storageService.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
        if (!data) return;
        
        const initialForm = {
            id: data.id, 
            name: data.name || "Usuario",
            email: data.email || "",
            phoneNumber: data.phoneNumber || "",
            password: "" 
        };

        setForm(initialForm);
        setOriginalForm(initialForm); 
    };

    const hasChanges = () => {
        if (!originalForm) return false;
        
        return (
            form.name !== originalForm.name ||
            form.email !== originalForm.email ||
            form.phoneNumber !== originalForm.phoneNumber ||
            form.password.length > 0
        );
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        if (!phone) return true;
        return /^\d{10}$/.test(phone);
    };

    const validate = () => {
        const { name, email, phoneNumber, password } = form;

        if (!name || name.trim().length < 3) {
            setErrorModalMessage("El nombre debe tener al menos 3 caracteres.");
            setIsErrorModalVisible(true);
            return false;
        }

        if (name.trim().length > 30) {
            setErrorModalMessage("El nombre no puede exceder 30 caracteres.");
            setIsErrorModalVisible(true);
            return false;
        }

        if (!email || !validateEmail(email.trim())) {
            setErrorModalMessage("Formato de correo electrónico inválido.\n\nEl correo debe ser como: 'ejemplo@dominio.com'");
            setIsErrorModalVisible(true);
            return false;
        }

        if (phoneNumber && !validatePhone(phoneNumber.trim())) {
            setErrorModalMessage("El número de teléfono debe tener 10 dígitos (o dejar vacío).");
            setIsErrorModalVisible(true);
            return false;
        }

        if (password && password.length > 0) {
            if (password.length < 8) {
                setErrorModalMessage("La contraseña debe tener al menos 8 caracteres.");
                setIsErrorModalVisible(true);
                return false;
            }
            if (!/[A-Z]/.test(password)) {
                setErrorModalMessage("La contraseña debe contener al menos una letra mayúscula.");
                setIsErrorModalVisible(true);
                return false;
            }
            if (!/[0-9]/.test(password)) {
                setErrorModalMessage("La contraseña debe contener al menos un número.");
                setIsErrorModalVisible(true);
                return false;
            }
        }

        return true;
    };

    const updateUser = async () => {
        if (!validate()) return; 

        setIsLoading(true);

        if (!user || !form.id) {
            setIsLoading(false);
            Alert.alert("Sesión Expirada", "Tu sesión ha expirado. Serás redirigido al inicio de sesión.");
            await logout();
            navigation.replace('Login'); 
            return;
        }

        try {
            const { id, password, ...payloadWithoutPassword } = form;
            let payload = password.length > 0 ? { ...payloadWithoutPassword, password } : payloadWithoutPassword;

            const response = await authService.updateUser(payload);

            console.log('📦 Response completa:', JSON.stringify(response, null, 2));

            setIsLoading(false);

            const isSuccess = response.success === true || 
                            (response.result && response.message) || 
                            (response.message && response.message.toLowerCase().includes('correctamente'));

            if (isSuccess) {
                const updatedUserData = response.result || response.data || {
                    id: form.id,
                    name: form.name,
                    email: form.email,
                    phoneNumber: form.phoneNumber,
                    roles: user.roles || ['USER'],
                    status: user.status || 1
                };
                
                console.log('✅ Usuario actualizado:', updatedUserData);
                
                await storageService.setItem(CONFIG.STORAGE_KEYS.USER_DATA, updatedUserData);
                await reloadUser();
                
                const newFormState = { 
                    id: updatedUserData.id,
                    name: updatedUserData.name || "",
                    email: updatedUserData.email || "",
                    phoneNumber: updatedUserData.phoneNumber || "",
                    password: "" 
                };
                
                setForm(newFormState);
                setOriginalForm(newFormState);
                setIsEditMode(false);
                
                setTimeout(() => {
                    setSuccessModalMessage(response.message || "¡Usuario actualizado correctamente!");
                    setIsSuccessModalVisible(true);
                }, 300);

            } else {
                console.log('❌ Error en actualización:', response);
                const errorMessage = response.message || response.error || "Actualización fallida. Inténtalo de nuevo.";
                setErrorModalMessage(errorMessage);
                setIsErrorModalVisible(true);
            }
        } catch (error) {
            console.error('💥 Error en updateUser:', error);
            setIsLoading(false);
            setErrorModalMessage("Error inesperado. Por favor intenta de nuevo.");
            setIsErrorModalVisible(true);
        }
    };

    const handleLogoutConfirm = async () => {
        setIsLoading(true);
        const result = await logout();
        setIsLoading(false);
        setIsLogoutModalVisible(false);

        if (result.success) {
            navigation.replace('Login');
        } else {
            setErrorModalMessage(result.error || 'No se pudo cerrar sesión. Inténtalo de nuevo.');
            setIsErrorModalVisible(true);
        }
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setDeleteStep(1);
        setConfirmText('');
        setIsLoading(false);
    }
    
    const handleDeleteAccount = async () => {
        if (deleteStep === 1) {
            setDeleteStep(2);
            return;
        }

        if (deleteStep === 2) {
            if (confirmText.trim() !== 'ELIMINAR') {
                setErrorModalMessage("Debes escribir la palabra 'ELIMINAR' (en mayúsculas) para proceder.");
                setIsErrorModalVisible(true);
                return;
            }
            
            closeDeleteModal(); 

            if (!user || !user.id) {
                setErrorModalMessage("Sesión Inválida. Por favor, inicia sesión de nuevo.");
                setIsErrorModalVisible(true);
                navigation.replace('Login');
                return;
            }

            setIsLoading(true);
            const response = await authService.deleteAccount();
            setIsLoading(false); 

            if (response.success) {
                Alert.alert("Adiós", "Tu cuenta ha sido eliminada permanentemente. ¡Lamentamos verte partir!");
                navigation.replace('Login');
            } else {
                setErrorModalMessage(response.message || "No se pudo eliminar la cuenta. Intenta más tarde.");
                setIsErrorModalVisible(true);
            }
        }
    };

    const handleEditPress = () => {
        if (!user || !user.id) {
            Alert.alert(
                "Inicia Sesión",
                "Debes iniciar sesión para editar tu perfil.",
                [{ text: "Ir a Iniciar Sesión", onPress: () => navigation.replace('Login') }]
            );
            return;
        }
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setForm(originalForm);
        setIsEditMode(false);
    };

    const InfoItemDisplay = ({ label, value, iconName, secureTextEntry = false }) => {
        const displayValue = secureTextEntry ? (value ? '********' : 'Sin definir') : (value || 'Sin definir');
        
        return (
            <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                    <Ionicons name={iconName} size={20} color={colors.primaryDark} />
                </View>
                <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>
                        {displayValue}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 🎨 HEADER VERDE CON CÍRCULOS DECORATIVOS */}
                <View style={styles.header}>
                    <View style={styles.headerBackground}>
                        <View style={styles.circle1} />
                        <View style={styles.circle2} />
                        <View style={styles.circle3} />
                    </View>

                    <View style={styles.headerContent}>
                        <TouchableOpacity 
                            style={styles.backButton} 
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.white} />
                        </TouchableOpacity>
                        
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerSubtitle}>CONFIGURACIÓN DE CUENTA</Text>
                            <Text style={styles.headerTitle}>Mi Perfil</Text>
                            <Text style={styles.headerDescription}>Información personal y acciones de cuenta.</Text>
                        </View>
                    </View>
                </View>

                {/* CONTENIDO BLANCO CON ESQUINAS REDONDEADAS SUPERIORES */}
                <View style={styles.contentWrapper}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{getInitials(originalForm?.name || 'US')}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{originalForm?.name || 'Usuario'}</Text>
                            <View style={styles.profileBadge}>
                                <Ionicons name="star" size={10} color={colors.white} style={{ marginRight: 5 }} />
                                <Text style={styles.badgeText}>USUARIO</Text>
                            </View>
                        </View>
                    </View>

                    {/* 🎨 HEADER DE SECCIÓN CON INDICADOR */}
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIndicator} />
                        <Text style={styles.sectionTitle}>Datos Personales</Text>
                        {!isEditMode && (
                            <TouchableOpacity style={styles.editAllButton} onPress={handleEditPress} disabled={isLoading}>
                                <Ionicons name="create" size={16} color={colors.white} style={{ marginRight: 5 }} />
                                <Text style={styles.editAllText}>Editar</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isEditMode ? (
                        <>
                            {/* 🎨 FORMULARIO CON ESTILOS MEJORADOS */}
                            <View style={styles.editCard}>
                                {/* Nombre Completo */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        Nombre Completo <Text style={styles.required}>*</Text>
                                    </Text>
                                    <View
                                        style={[
                                            styles.inputWrapper,
                                            focusedInput === 'name' && styles.inputWrapperFocused,
                                        ]}
                                    >
                                        <Ionicons
                                            name="person-outline"
                                            size={20}
                                            color={focusedInput === 'name' ? '#059669' : '#6b7280'}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Tu nombre completo"
                                            placeholderTextColor="#9ca3af"
                                            value={form.name}
                                            maxLength={30}
                                            onChangeText={(v) => setForm({ ...form, name: v })}
                                            onFocus={() => setFocusedInput('name')}
                                            onBlur={() => setFocusedInput(null)}
                                            editable={!isLoading}
                                        />
                                    </View>
                                    {form.name.length > 0 && (
                                        <Text
                                            style={[
                                                styles.charCounter,
                                                form.name.length >= 20 && styles.charCounterWarning,
                                            ]}
                                        >
                                            {form.name.length}/30 caracteres
                                        </Text>
                                    )}
                                </View>
                                
                                {/* Correo Electrónico */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        Correo Electrónico <Text style={styles.required}>*</Text>
                                    </Text>
                                    <View
                                        style={[
                                            styles.inputWrapper,
                                            focusedInput === 'email' && styles.inputWrapperFocused,
                                        ]}
                                    >
                                        <Ionicons
                                            name="mail-outline"
                                            size={20}
                                            color={focusedInput === 'email' ? '#059669' : '#6b7280'}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="ejemplo@dominio.com"
                                            placeholderTextColor="#9ca3af"
                                            value={form.email}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            onChangeText={(v) => setForm({ ...form, email: v })}
                                            onFocus={() => setFocusedInput('email')}
                                            onBlur={() => setFocusedInput(null)}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>
                                
                                {/* Teléfono de Contacto */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        Teléfono de Contacto
                                    </Text>
                                    <View
                                        style={[
                                            styles.inputWrapper,
                                            focusedInput === 'phone' && styles.inputWrapperFocused,
                                        ]}
                                    >
                                        <Ionicons
                                            name="call-outline"
                                            size={20}
                                            color={focusedInput === 'phone' ? '#059669' : '#6b7280'}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="1234567890 (Opcional)"
                                            placeholderTextColor="#9ca3af"
                                            value={form.phoneNumber}
                                            keyboardType="numeric"
                                            maxLength={10}
                                            onChangeText={(v) => setForm({ ...form, phoneNumber: v })}
                                            onFocus={() => setFocusedInput('phone')}
                                            onBlur={() => setFocusedInput(null)}
                                            editable={!isLoading}
                                        />
                                    </View>
                                    <Text style={styles.helperText}>
                                        10 dígitos sin espacios
                                    </Text>
                                </View>
                                
                                {/* Nueva Contraseña */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>
                                        Nueva Contraseña
                                    </Text>
                                    <View
                                        style={[
                                            styles.inputWrapper,
                                            focusedInput === 'password' && styles.inputWrapperFocused,
                                        ]}
                                    >
                                        <Ionicons
                                            name="lock-closed-outline"
                                            size={20}
                                            color={focusedInput === 'password' ? '#059669' : '#6b7280'}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Dejar vacío para no cambiar"
                                            placeholderTextColor="#9ca3af"
                                            value={form.password}
                                            secureTextEntry
                                            onChangeText={(v) => setForm({ ...form, password: v })}
                                            onFocus={() => setFocusedInput('password')}
                                            onBlur={() => setFocusedInput(null)}
                                            editable={!isLoading}
                                        />
                                    </View>
                                    <Text style={styles.helperText}>
                                        Mínimo 8 caracteres, 1 mayúscula y 1 número
                                    </Text>
                                </View>

                                {/* 🎨 BOTONES DE ACCIÓN MEJORADOS */}
                                <View style={styles.editActions}>
                                    <TouchableOpacity 
                                        style={styles.cancelButton} 
                                        onPress={handleCancelEdit}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="close-circle-outline" size={20} color="#6b7280" />
                                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[
                                            styles.saveButton,
                                            (!hasChanges() || isLoading) && styles.saveButtonDisabled
                                        ]} 
                                        onPress={updateUser}
                                        disabled={!hasChanges() || isLoading}
                                        activeOpacity={0.8}
                                    >
                                        {isLoading ? (
                                            <>
                                                <ActivityIndicator size="small" color={colors.white} />
                                                <Text style={styles.saveButtonText}>Guardando...</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                                                <Text style={styles.saveButtonText}>Guardar</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <InfoItemDisplay label="Nombre Completo" value={originalForm?.name} iconName="person" />
                            <InfoItemDisplay label="Correo Electrónico" value={originalForm?.email} iconName="mail" />
                            <InfoItemDisplay label="Teléfono de Contacto" value={originalForm?.phoneNumber} iconName="call" />
                            
                            <View style={styles.sectionSpacing}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionIndicator} />
                                    <Text style={styles.sectionTitle}>Seguridad</Text>
                                </View>
                                <View style={styles.securitySpacing}>
                                    <InfoItemDisplay label="Contraseña" value="********" iconName="lock-closed" secureTextEntry={true} />
                                </View>
                            </View>
                        </>
                    )}

                    <View style={styles.sectionSpacingLarge}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIndicator} />
                            <Text style={styles.sectionTitle}>Acciones de Cuenta</Text>
                        </View>

                        <View style={styles.actionsSpacing}>
                            <TouchableOpacity style={styles.actionButtonLogout} onPress={() => setIsLogoutModalVisible(true)} disabled={isLoading}>
                                <View style={styles.actionIconLogout}>
                                    <Ionicons name="log-out" size={20} color={colors.warning} />
                                </View>
                                <View style={styles.actionText}>
                                    <Text style={styles.actionLabelLogout}>Cerrar Sesión</Text>
                                    <Text style={styles.actionDescriptionLogout}>Finaliza tu sesión actual de forma segura.</Text>
                                </View>
                                <View style={styles.arrowIcon}>
                                    <Ionicons name="chevron-forward" size={16} color={colors.warning} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.actionButtonDelete} 
                                onPress={() => setIsDeleteModalVisible(true)}
                                disabled={isLoading}
                            >
                                <View style={styles.actionIconDelete}>
                                    <Ionicons name="trash" size={20} color={colors.danger} />
                                </View>
                                <View style={styles.actionText}>
                                    <Text style={styles.actionLabelDelete}>Eliminar Cuenta</Text>
                                    <Text style={styles.actionDescriptionDelete}>Elimina permanentemente tu cuenta y todos tus datos asociados.</Text>
                                </View>
                                <View style={styles.arrowIcon}>
                                    <Ionicons name="chevron-forward" size={16} color={colors.danger} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* MODAL DE ERROR */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isErrorModalVisible}
                onRequestClose={() => setIsErrorModalVisible(false)}
            >
                <View style={styles.errorModalOverlay}>
                    <View style={styles.errorModalContent}>
                        <View style={styles.errorModalIcon}>
                            <Ionicons name="alert-circle" size={48} color={colors.danger} />
                        </View>

                        <Text style={styles.errorModalTitle}>Alerta</Text>
                        <Text style={styles.errorModalMessage}>
                            {errorModalMessage}
                        </Text>

                        <TouchableOpacity 
                            style={styles.errorModalButton} 
                            onPress={() => setIsErrorModalVisible(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.errorModalButtonText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL DE ÉXITO */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isSuccessModalVisible}
                onRequestClose={() => setIsSuccessModalVisible(false)}
            >
                <View style={styles.successModalOverlay}>
                    <View style={styles.successModalContent}>
                        <View style={styles.successModalIcon}>
                            <Ionicons name="checkmark-circle" size={64} color={colors.primaryLight} />
                        </View>

                        <Text style={styles.successModalTitle}>¡Actualización Exitosa!</Text>
                        <Text style={styles.successModalMessage}>
                            {successModalMessage}
                        </Text>

                        <TouchableOpacity 
                            style={styles.successModalButton} 
                            onPress={() => setIsSuccessModalVisible(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.successModalButtonText}>Perfecto</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL DE LOGOUT */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isLogoutModalVisible}
                onRequestClose={() => setIsLogoutModalVisible(false)}
            >
                <View style={styles.confirmModalOverlay}>
                    <View style={styles.confirmModalContent}>
                        <View style={styles.confirmModalIcon}>
                            <Ionicons name="help-circle" size={48} color={colors.warning} />
                        </View>
                        <Text style={styles.confirmModalTitle}>¿Cerrar Sesión?</Text>
                        <Text style={styles.confirmModalMessage}>
                            ¿Estás seguro de que deseas cerrar tu sesión actual? Tendrás que ingresar tus credenciales de nuevo.
                        </Text>
                        
                        <View style={styles.confirmModalButtons}>
                            <TouchableOpacity 
                                style={styles.confirmModalCancelButton} 
                                onPress={() => setIsLogoutModalVisible(false)}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.confirmModalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.confirmModalConfirmButton} 
                                onPress={handleLogoutConfirm}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={styles.confirmModalConfirmText}>Sí, Cerrar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL DE ELIMINACIÓN */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isDeleteModalVisible}
                onRequestClose={closeDeleteModal}
            >
                <View style={styles.confirmModalOverlay}>
                    <View style={styles.confirmModalContent}>
                        <View style={[styles.confirmModalIcon, { backgroundColor: '#fee2e215' }]}>
                            <Ionicons name={deleteStep === 1 ? "alert-circle" : "skull"} size={48} color={colors.danger} />
                        </View>
                        <Text style={styles.confirmModalTitle}>
                            {deleteStep === 1 ? "Confirmar Eliminación" : "Advertencia: Pérdida de Datos"}
                        </Text>
                        
                        {deleteStep === 1 && (
                            <Text style={styles.confirmModalMessage}>
                                Estás a punto de iniciar el proceso de eliminación de tu cuenta. ¿Estás absolutamente seguro de continuar?
                            </Text>
                        )}
                        
                        {deleteStep === 2 && (
                            <>
                                <Text style={styles.confirmModalMessage}>
                                    La eliminación es PERMANENTE. Perderás todos tus datos y productos asociados. Para confirmar y aceptar la pérdida de datos, escribe la palabra "ELIMINAR" a continuación:
                                </Text>

                                <TextInput
                                    style={styles.deleteConfirmInput} 
                                    placeholder="Escribe ELIMINAR"
                                    placeholderTextColor="#dc262680"
                                    value={confirmText}
                                    maxLength={8}
                                    onChangeText={setConfirmText}
                                    autoCapitalize="characters"
                                    editable={!isLoading}
                                />
                            </>
                        )}
                        
                        <View style={styles.confirmModalButtons}>
                            <TouchableOpacity 
                                style={styles.confirmModalCancelButton} 
                                onPress={closeDeleteModal} 
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.confirmModalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.confirmModalConfirmButton, { backgroundColor: colors.danger }]} 
                                onPress={handleDeleteAccount}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={styles.confirmModalConfirmText}>
                                        {deleteStep === 1 ? 'Continuar' : 'Eliminar'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: colors.backgroundLight,
    },
    scrollContent: { 
        paddingBottom: 20,
    },
    
    // 🎨 HEADER VERDE CON CÍRCULOS
    header: { 
        position: 'relative',
        paddingHorizontal: 20, 
        paddingTop: 50, 
        paddingBottom: 30,
        overflow: 'hidden',
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.primaryDark,
    },
    circle1: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#059669',
        opacity: 0.2,
        top: -75,
        right: -50,
    },
    circle2: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#10b981',
        opacity: 0.15,
        bottom: -50,
        left: -30,
    },
    circle3: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#34d399',
        opacity: 0.1,
        top: 15,
        left: '40%',
    },
    
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerSubtitle: { 
        fontSize: 12, 
        fontWeight: '600', 
        opacity: 0.8, 
        letterSpacing: 1, 
        marginBottom: 5, 
        textTransform: 'uppercase', 
        color: colors.white, 
    },
    headerTitle: { 
        fontSize: 34, 
        fontWeight: '800', 
        marginBottom: 5, 
        color: colors.white, 
    },
    headerDescription: { 
        fontSize: 14, 
        opacity: 0.9, 
        fontWeight: '400', 
        color: colors.white, 
    },
    
    // CONTENIDO BLANCO
    contentWrapper: { 
        backgroundColor: colors.backgroundLight, 
        borderTopLeftRadius: 30, 
        borderTopRightRadius: 30, 
        marginTop: -20,  
        paddingHorizontal: 25, 
        paddingTop: 30, 
        paddingBottom: 0,
    },
    
    profileCard: { 
        backgroundColor: colors.white, 
        borderRadius: 20, 
        padding: 25, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 15, 
        elevation: 5, 
        marginBottom: 25, 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 20, 
        borderLeftWidth: 5, 
        borderLeftColor: colors.primaryDark, 
    },
    avatarContainer: { 
        width: 70, 
        height: 70, 
        borderRadius: 35, 
        backgroundColor: colors.primaryDark, 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexShrink: 0, 
    },
    avatarText: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: colors.white, 
    },
    profileName: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: colors.primaryDark, 
        marginBottom: 4, 
    },
    profileInfo: { 
        flex: 1 
    },
    profileBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.primaryLight, 
        paddingVertical: 4, 
        paddingHorizontal: 10, 
        borderRadius: 20, 
        alignSelf: 'flex-start', 
    },
    badgeText: { 
        color: colors.white, 
        fontSize: 11, 
        fontWeight: '700', 
        letterSpacing: 0.5, 
        textTransform: 'uppercase', 
    },
    
    // 🎨 HEADERS DE SECCIÓN CON INDICADOR (ESTILO PRODUCTFORM)
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    sectionIndicator: {
        width: 4,
        height: 20,
        backgroundColor: '#059669',
        borderRadius: 2,
        marginRight: 12,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#065f46',
    },
    editAllButton: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.primaryLight, 
        paddingVertical: 10, 
        paddingHorizontal: 15, 
        borderRadius: 12, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.1, 
        elevation: 3, 
    },
    editAllText: { 
        color: colors.white, 
        fontWeight: 'bold', 
        fontSize: 14, 
    },
    
    // 🎨 FORMULARIO CON ESTILOS MEJORADOS (ESTILO PRODUCTFORM)
    editCard: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#065f46',
        marginBottom: 10,
    },
    required: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        paddingHorizontal: 14,
        minHeight: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputWrapperFocused: {
        borderColor: '#059669',
        backgroundColor: '#f0fdf4',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1f2937',
        fontWeight: '500',
    },
    charCounter: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    },
    charCounterWarning: {
        color: '#f59e0b',
        fontWeight: '600',
    },
    helperText: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 6,
        fontStyle: 'italic',
    },
    
    // 🎨 BOTONES DE ACCIÓN MEJORADOS (ESTILO PRODUCTFORM)
    editActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#059669',
        paddingVertical: 16,
        borderRadius: 14,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0.1,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.3,
    },
    
    // INFO ITEMS (VISTA NORMAL)
    infoItem: { 
        backgroundColor: colors.white, 
        borderRadius: 16, 
        padding: 18, 
        marginBottom: 12, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 8, 
        elevation: 3, 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        gap: 15, 
    },
    infoIcon: { 
        width: 48, 
        height: 48, 
        borderRadius: 12, 
        backgroundColor: colors.accentGreen, 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexShrink: 0, 
    },
    infoContent: { 
        flex: 1, 
    },
    infoLabel: { 
        fontSize: 11, 
        fontWeight: '700', 
        color: colors.textMedium, 
        marginBottom: 4, 
        textTransform: 'uppercase', 
        letterSpacing: 0.8, 
    },
    infoValue: { 
        fontSize: 16, 
        color: colors.textDark, 
        fontWeight: '500', 
        flex: 1, 
    },
    
    sectionSpacing: { 
        marginTop: 28,
        marginBottom: 10, 
    },
    securitySpacing: {
        marginTop: 18,
    },
    sectionSpacingLarge: {
        marginTop: 28,   
        marginBottom: 10, 
    },
    actionsSpacing: {
        marginTop: 18,
    },
    
    // BOTONES DE ACCIÓN
    arrowIcon: { 
        marginLeft: 10, 
    },
    actionText: { 
        flex: 1, 
    },
    actionButtonLogout: { 
        backgroundColor: colors.white, 
        borderWidth: 1, 
        borderColor: colors.warningLight, 
        borderRadius: 16, 
        padding: 18, 
        marginBottom: 12, 
        flexDirection: 'row', 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.04, 
        shadowRadius: 8, 
        elevation: 2, 
    },
    actionIconLogout: { 
        width: 45, 
        height: 45, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexShrink: 0, 
        marginRight: 15, 
        backgroundColor: colors.warningLight, 
    },
    actionLabelLogout: { 
        fontSize: 16, 
        fontWeight: '700', 
        marginBottom: 2, 
        color: colors.warning, 
    },
    actionDescriptionLogout: { 
        fontSize: 12, 
        opacity: 0.9, 
        fontWeight: '400', 
        color: colors.warning, 
    },
    actionButtonDelete: { 
        backgroundColor: colors.white, 
        borderWidth: 1, 
        borderColor: colors.dangerLight, 
        borderRadius: 16, 
        padding: 18, 
        marginBottom: 12, 
        flexDirection: 'row', 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.04, 
        shadowRadius: 8, 
        elevation: 2, 
    },
    actionIconDelete: { 
        width: 45, 
        height: 45, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center', 
        flexShrink: 0, 
        marginRight: 15, 
        backgroundColor: colors.dangerLight, 
    },
    actionLabelDelete: { 
        fontSize: 16, 
        fontWeight: '700', 
        marginBottom: 2, 
        color: colors.danger, 
    },
    actionDescriptionDelete: { 
        fontSize: 12, 
        opacity: 0.9, 
        fontWeight: '400', 
        color: colors.danger, 
    },
    
    // 🎨 MODALES ESTILO PRODUCTFORM
    errorModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorModalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    errorModalIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fee2e215',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 12,
    },
    errorModalMessage: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    errorModalButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: colors.danger,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    errorModalButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    
    successModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    successModalIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#d1fae515',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 12,
    },
    successModalMessage: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    successModalButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    successModalButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    
    confirmModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    confirmModalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    confirmModalIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fef3c715',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmModalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 12,
    },
    confirmModalMessage: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    confirmModalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    confirmModalCancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    confirmModalCancelText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: 'bold',
    },
    confirmModalConfirmButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: colors.warning,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmModalConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    deleteConfirmInput: {
        backgroundColor: colors.dangerLight,
        borderWidth: 2,
        borderColor: colors.danger,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        fontWeight: '700',
        color: colors.danger,
        textAlign: 'center',
        width: '100%',
        marginBottom: 20,
    },
});

export default ProfileScreen;