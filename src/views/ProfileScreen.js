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
// Asegúrate de que esta sea la importación correcta de FontAwesome5
import Icon from 'react-native-vector-icons/FontAwesome5'; 
import { useNavigation } from "@react-navigation/native"; 
import storageService from "../services/Storage.service";
import CONFIG from "../config/app.config"; 
import authService from "../services/Auth.service";

// ASUMIMOS que tienes este hook disponible para la gestión centralizada de sesión
import { useAuthViewModel } from '../viewmodels/Auth.viewmodel'; 

// =========================================================================
// CONSTANTES Y UTILIDADES
// =========================================================================


const colors = {
    primaryDark: '#065f46', 
    primaryLight: '#10b981',
    backgroundLight: '#f0fdf4',
    textDark: '#1f2937',
    textMedium: '#6b7280',
    danger: '#dc2626',
    dangerLight: '#fee2e2',
    warning: '#f59e0b',       // Amarillo fuerte para Logout
    warningLight: '#fef3c7',  // Amarillo claro para Logout
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


// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================

const ProfileScreen = () => {
    const navigation = useNavigation();
   const { user, logout, reloadUser } = useAuthViewModel(); 
//                                   ^^^^^^^^^^^ <-- ¡Te faltó esto!
    
    // --- ESTADOS PRINCIPALES ---
    const [form, setForm] = useState({
        id: null, name: "", email: "", phoneNumber: "", password: "",
    });
    const [originalForm, setOriginalForm] = useState(null); 
    const [isLoading, setIsLoading] = useState(false); 

    // --- ESTADOS DE MODALES ---
    const [isModalVisible, setIsModalVisible] = useState(false);         // Modal de Edición
    const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false); // Modal de Logout
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);   // Modal de Errores/Validación
    const [errorModalMessage, setErrorModalMessage] = useState('');          // Mensaje para el Modal de Errores

    // --- ESTADOS DE ELIMINACIÓN (3 pasos) ---
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false); 
    const [deleteStep, setDeleteStep] = useState(1); // 1: Confirmación Inicial, 2: Advertencia Final
    const [confirmText, setConfirmText] = useState(''); // Para que el usuario escriba "ELIMINAR"


    useEffect(() => {
        loadUser();
    }, []);

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

    /**
     * Valida el formulario y muestra un modal de error si falla.
     */
    const validate = () => {
        const { NAME_MAX_LENGTH, EMAIL_REGEX, PHONE_REGEX, PASSWORD_PATTERN } = CONFIG.VALIDATION;
        const { name, email, phoneNumber, password } = form;

        let errorMessage = null;

        if (name.length > NAME_MAX_LENGTH) {
            errorMessage = `El nombre no puede exceder ${NAME_MAX_LENGTH} caracteres.`;
        } else if (!EMAIL_REGEX.test(email)) {
            // Mejor feedback para el usuario
            errorMessage = "Formato de correo electrónico inválido.\n\nEl correo debe ser como: 'ejemplo@dominio.com'";
        } else if (phoneNumber && !PHONE_REGEX.test(phoneNumber)) {
            errorMessage = "El número de teléfono debe tener 10 dígitos (o dejar vacío).";
        } else if (password && password.length > 0 && !PASSWORD_PATTERN.test(password)) {
            // Mejor feedback para el usuario
            errorMessage = "La contraseña debe tener:\n\n- Mínimo 8 caracteres\n- Al menos una mayúscula\n- Al menos un número\n- Al menos un carácter especial";
        }

        if (errorMessage) {
            setErrorModalMessage(errorMessage);
            setIsErrorModalVisible(true);
            return false;
        }

        return true;
    };

  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
const [successModalMessage, setSuccessModalMessage] = useState('');


// =========================================================================
// FUNCIÓN updateUser CORREGIDA
// =========================================================================

/**
 * Maneja el proceso de actualización de usuario.
 * Actualiza el AsyncStorage, el estado global y refresca la UI.
 */
const updateUser = async () => {
    if (!validate()) return; 

    setIsLoading(true);

    if (!user || !form.id) {
         setIsLoading(false);
         setIsModalVisible(false);
         Alert.alert("Sesión Expirada", "Tu sesión ha expirado. Serás redirigido al inicio de sesión.");
         await logout();
         navigation.replace('Login'); 
         return;
    }

    const { id, password, ...payloadWithoutPassword } = form;
    let payload = password.length > 0 ? { ...payloadWithoutPassword, password } : payloadWithoutPassword;

    const response = await authService.updateUser(payload);

    if (response.success && response.result) {
        // ✅ PASO 1: Usar directamente los datos que vienen de la API
        const updatedUserData = response.result;
        
        // ✅ PASO 2: Actualizar AsyncStorage con los nuevos datos
        await storageService.setItem(CONFIG.STORAGE_KEYS.USER_DATA, updatedUserData);
        
        // ✅ PASO 3: Recargar el usuario en el AuthViewModel desde el storage actualizado
        await reloadUser();
        
        // ✅ PASO 4: Actualizar los estados locales con los datos frescos de la API
        const newFormState = { 
            id: updatedUserData.id,
            name: updatedUserData.name || "",
            email: updatedUserData.email || "",
            phoneNumber: updatedUserData.phoneNumber || "",
            password: "" 
        };
        
        setForm(newFormState);
        setOriginalForm(newFormState); 
       setIsLoading(false);
        setIsModalVisible(false);
        
        setSuccessModalMessage(response.message || "Usuario actualizado correctamente");
        setIsSuccessModalVisible(true);

    } else {
        // Si la actualización falló
        setIsLoading(false);
        
        const errorMessage = response.message || "Actualización fallida. Inténtalo de nuevo.";
        setErrorModalMessage(errorMessage);
        setIsErrorModalVisible(true);
        
        // NO cerramos el modal de edición para que el usuario pueda corregir
    }
};

    /**
     * Maneja el Logout usando un Modal personalizado (Amarillo).
     */
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

    /**
     * Maneja el cierre y reinicio del modal de eliminación.
     */
    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setDeleteStep(1);
        setConfirmText('');
        setIsLoading(false);
    }
    
    /**
     * Implementación de Eliminar Cuenta (3 pasos)
     */
    const handleDeleteAccount = async () => {
        
        if (deleteStep === 1) {
            setDeleteStep(2); // Pasa al paso de advertencia (2do click)
            return;
        }

        if (deleteStep === 2) {
            // Tercer Nivel de Confirmación (3er click real)
            if (confirmText.trim() !== 'ELIMINAR') {
                setErrorModalMessage("Debes escribir la palabra 'ELIMINAR' (en mayúsculas) para proceder.");
                setIsErrorModalVisible(true);
                return;
            }
            
            // --- INICIA PROCESO DE ELIMINACIÓN REAL ---
            closeDeleteModal(); 

            if (!user || !user.id) {
                 setErrorModalMessage("Sesión Inválida. Por favor, inicia sesión de nuevo.");
                 setIsErrorModalVisible(true);
                 navigation.replace('Login');
                 return;
            }

            // Usamos un loading temporal para la llamada a la API de eliminación
            const tempLoading = setTimeout(() => setIsLoading(true), 10); 

            const response = await authService.deleteAccount();
            
            clearTimeout(tempLoading);
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
        // Restaurar form al original y abrir el modal
        setForm(originalForm); 
        setIsModalVisible(true);
    };


    const InfoItemDisplay = ({ label, value, iconName, secureTextEntry = false }) => {
        const displayValue = secureTextEntry ? (value ? '********' : 'Sin definir') : (value || 'Sin definir');
        
        return (
            <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                    {/* CORRECCIÓN DE ÍCONOS */}
                    <Icon name={iconName} size={20} color={colors.primaryDark} solid /> 
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerSubtitle}>CONFIGURACIÓN DE CUENTA</Text>
                        <Text style={styles.headerTitle}>Mi Perfil</Text>
                        <Text style={styles.headerDescription}>Información personal y acciones de cuenta.</Text>
                    </View>
                </View>

                <View style={styles.contentWrapper}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{getInitials(originalForm?.name || 'US')}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{originalForm?.name || 'Usuario'}</Text>
                            <View style={styles.profileBadge}>
                                <Icon name="crown" size={10} color={colors.white} style={{ marginRight: 5 }} solid />
                                <Text style={styles.badgeText}>USUARIO</Text>
                            </View>
                        </View>
                    </View>

                    {/* Información y Botón de Edición */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Datos Personales</Text>
                        <TouchableOpacity style={styles.editAllButton} onPress={handleEditPress} disabled={isLoading}>
                            <Icon name="edit" size={16} color={colors.white} style={{ marginRight: 5 }} solid />
                            <Text style={styles.editAllText}>Editar Datos</Text>
                        </TouchableOpacity>
                    </View>

                    <InfoItemDisplay label="Nombre Completo" value={originalForm?.name} iconName="user" />
                    <InfoItemDisplay label="Correo Electrónico" value={originalForm?.email} iconName="at" />
                    <InfoItemDisplay label="Teléfono de Contacto" value={originalForm?.phoneNumber} iconName="phone" />
                    
                    <View style={styles.sectionSpacing}>
                        <Text style={styles.sectionTitle}>Seguridad</Text>
                        <InfoItemDisplay label="Contraseña" value="********" iconName="lock" secureTextEntry={true} />
                    </View>

                    {/* Acciones de cuenta */}
                    <View style={styles.sectionSpacing}>
                        <Text style={styles.sectionTitle}>Acciones de Cuenta</Text>

                        {/* Botón de Cerrar Sesión (Abre Modal de Logout) */}
                        <TouchableOpacity style={styles.actionButtonLogout} onPress={() => setIsLogoutModalVisible(true)} disabled={isLoading}>
                            <View style={styles.actionIconLogout}>
                                <Icon name="sign-out-alt" size={20} color={colors.warning} solid />
                            </View>
                            <View style={styles.actionText}>
                                <Text style={styles.actionLabelLogout}>Cerrar Sesión</Text>
                                <Text style={styles.actionDescriptionLogout}>Finaliza tu sesión actual de forma segura.</Text>
                            </View>
                            <View style={styles.arrowIcon}>
                                <Icon name="chevron-right" size={16} color={colors.warning} />
                            </View>
                        </TouchableOpacity>

                        {/* Botón de Eliminar Cuenta (Abre Modal de Eliminación) */}
                        <TouchableOpacity 
                            style={styles.actionButtonDelete} 
                            onPress={() => setIsDeleteModalVisible(true)}
                            disabled={isLoading}
                        >
                            <View style={styles.actionIconDelete}>
                                <Icon name="trash-alt" size={20} color={colors.danger} solid />
                            </View>
                            <View style={styles.actionText}>
                                <Text style={styles.actionLabelDelete}>Eliminar Cuenta</Text>
                                <Text style={styles.actionDescriptionDelete}>Elimina permanentemente tu cuenta y todos tus datos asociados.</Text>
                            </View>
                            <View style={styles.arrowIcon}>
                                {/* Indicador de carga para la eliminación */}
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={colors.danger} />
                                ) : (
                                    <Icon name="chevron-right" size={16} color={colors.danger} />
                                )}
                            </View>
                        </TouchableOpacity>

                    </View>
                </View>
            </ScrollView>

            {/* ======================================= */}
            {/* 1. MODAL DE EDICIÓN CENTRALIZADA */}
            {/* ======================================= */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => {
                    setIsModalVisible(false);
                    setForm(originalForm); 
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Editar Mi Perfil</Text>
                        <Text style={styles.modalSubtitle}>Modifica tu información y contraseña. La contraseña solo se actualizará si ingresas un valor.</Text>

                        {/* INPUTS DE EDICIÓN */}
                        <Text style={styles.inputLabel}>Nombre Completo</Text>
                        <TextInput
                            style={styles.inputModal}
                            placeholder="Nombre"
                            value={form.name}
                            maxLength={30}
                            onChangeText={(v) => setForm({ ...form, name: v })}
                        />
                        <Text style={styles.inputLabel}>Correo Electrónico</Text>
                        <TextInput
                            style={styles.inputModal}
                            placeholder="Correo"
                            value={form.email}
                            keyboardType="email-address"
                            onChangeText={(v) => setForm({ ...form, email: v })}
                        />
                        <Text style={styles.inputLabel}>Teléfono de Contacto</Text>
                        <TextInput
                            style={styles.inputModal}
                            placeholder="Teléfono (Opcional)"
                            value={form.phoneNumber}
                            keyboardType="numeric"
                            maxLength={10}
                            onChangeText={(v) => setForm({ ...form, phoneNumber: v })}
                        />
                        <Text style={styles.inputLabel}>Nueva Contraseña (Dejar vacío para no cambiar)</Text>
                        <TextInput
                            style={styles.inputModal}
                            placeholder="Contraseña"
                            value={form.password}
                            secureTextEntry
                            onChangeText={(v) => setForm({ ...form, password: v })}
                        />

                        {/* BOTONES */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalButtonCancel} 
                                onPress={() => {
                                    setIsModalVisible(false);
                                    setForm(originalForm); 
                                }}
                            >
                                <Text style={styles.modalTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.modalButtonSave} 
                                onPress={updateUser}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={styles.modalTextSave}>Guardar Cambios</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            {/* ======================================= */}
            {/* 2. MODAL DE ERROR/VALIDACIÓN (BONITO) */}
            {/* ======================================= */}
             <Modal
            animationType="fade"
            transparent={true}
            visible={isErrorModalVisible}
            onRequestClose={() => setIsErrorModalVisible(false)}
        >
            <View style={styles.centeredView}>
                <View style={styles.errorModalView}>
                    <View style={styles.errorIcon}> 
                        <Icon name="times-circle" size={40} color={colors.danger} solid />
                    </View>

                    <Text style={styles.errorModalTitle}>Alerta</Text>
                    <Text style={styles.errorModalMessage}>
                        {errorModalMessage}
                    </Text>

                    <TouchableOpacity style={styles.errorModalButton} onPress={() => setIsErrorModalVisible(false)} >
                        <Text style={styles.errorModalText}>Entendido</Text>
                        </TouchableOpacity>
                </View>
            </View>
        </Modal>
{/* ======================================= */}
{/* MODAL DE ÉXITO */}
{/* ======================================= */}
<Modal
    animationType="fade"
    transparent={true}
    visible={isSuccessModalVisible}
    onRequestClose={() => setIsSuccessModalVisible(false)}
>
    <View style={styles.centeredView}>
        <View style={styles.successModalView}>
            <View style={styles.successIcon}> 
                <Icon name="check-circle" size={40} color={colors.primaryLight} solid />
            </View>

            <Text style={styles.successModalTitle}>¡Actualización Exitosa!</Text>
            <Text style={styles.successModalMessage}>
                {successModalMessage}
            </Text>

            <TouchableOpacity 
                style={styles.successModalButton} 
                onPress={() => setIsSuccessModalVisible(false)}
            >
                <Text style={styles.successModalText}>Perfecto</Text>
            </TouchableOpacity>
        </View>
    </View>
</Modal>

            {/* ======================================= */}
            {/* 3. MODAL DE LOGOUT (AMARILLO) */}
            {/* ======================================= */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isLogoutModalVisible}
                onRequestClose={() => setIsLogoutModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.logoutModalView}>
                        <View style={styles.logoutModalIcon}> 
                            <Icon name="exclamation-circle" size={40} color={colors.warning} solid />
                        </View>
                        <Text style={styles.logoutModalTitle}>¿Cerrar Sesión?</Text>
                        <Text style={styles.logoutModalMessage}>
                            ¿Estás seguro de que deseas cerrar tu sesión actual? Tendrás que ingresar tus credenciales de nuevo.
                        </Text>
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalButtonCancel} 
                                onPress={() => setIsLogoutModalVisible(false)}
                                disabled={isLoading}
                            >
                                <Text style={styles.modalTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.modalButtonLogoutConfirm} 
                                onPress={handleLogoutConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={styles.modalTextLogoutConfirm}>Sí, Cerrar Sesión</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>


            {/* ======================================= */}
            {/* 4. MODAL DE ELIMINACIÓN (3 PASOS, ROJO) */}
            {/* ======================================= */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isDeleteModalVisible}
                onRequestClose={closeDeleteModal}
            >
                <View style={styles.centeredView}>
                    <View style={styles.deleteModalView}>
                        
                        {/* ICONO Y TÍTULO DINÁMICO */}
                        <View style={styles.deleteModalIcon}> 
                            <Icon name={deleteStep === 1 ? "exclamation-triangle" : "skull-crossbones"} size={40} color={colors.danger} solid/>
                        </View>
                        <Text style={styles.deleteModalTitle}>{deleteStep === 1 ? "Confirmar Eliminación" : "Advertencia: Pérdida de Datos"}</Text>
                        
                        {/* CONTENIDO DEL PASO 1 */}
                        {deleteStep === 1 && (
                            <Text style={styles.deleteModalMessage}>
                                Estás a punto de iniciar el proceso de eliminación de tu cuenta. ¿Estás absolutamente seguro de continuar?
                            </Text>
                        )}
                        
                        {/* CONTENIDO DEL PASO 2 */}
                        {deleteStep === 2 && (
                            <>
                                <Text style={styles.deleteModalMessage}>
                                    La eliminación es **PERMANENTE**. Perderás todos tus datos y productos asociados. 
                                    Para confirmar y aceptar la pérdida de datos, **escribe la palabra "ELIMINAR"** a continuación:
                                </Text>

                                <TextInput
                                    style={styles.confirmTextInput} 
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
                        
                        {/* BOTONES DEL MODAL */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalButtonCancel} 
                                onPress={closeDeleteModal} 
                                disabled={isLoading}
                            >
                                <Text style={styles.modalTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.modalButtonDeleteConfirm} 
                                onPress={handleDeleteAccount}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Text style={styles.modalTextDeleteConfirm}>
                                        {deleteStep === 1 ? 'Sí, Continuar' : 'Confirmar Eliminación'}
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

// =========================================================================
// HOJA DE ESTILOS (STYLING)
// =========================================================================

const styles = StyleSheet.create({
    // --- LAYOUT ---
    safeArea: { flex: 1, backgroundColor: colors.primaryDark, },
    scrollContent: { paddingBottom: 40, },

    // --- HEADER Y CONTENIDO ---
    header: { backgroundColor: colors.primaryDark, paddingHorizontal: 25, paddingTop: 0, paddingBottom: 30, },
    headerContent: { marginTop: 0, },
    headerSubtitle: { fontSize: 12, fontWeight: '600', opacity: 0.8, letterSpacing: 1, marginBottom: 5, textTransform: 'uppercase', color: colors.white, },
    headerTitle: { fontSize: 34, fontWeight: '800', marginBottom: 5, color: colors.white, },
    headerDescription: { fontSize: 14, opacity: 0.9, fontWeight: '400', color: colors.white, },
    contentWrapper: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, paddingHorizontal: 25, paddingTop: 30, },
    
    // --- PROFILE CARD ---
    profileCard: { backgroundColor: colors.white, borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 5, marginBottom: 25, flexDirection: 'row', alignItems: 'center', gap: 20, borderLeftWidth: 5, borderLeftColor: colors.primaryDark, },
    avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primaryDark, justifyContent: 'center', alignItems: 'center', flexShrink: 0, },
    avatarText: { fontSize: 28, fontWeight: 'bold', color: colors.white, },
    profileName: { fontSize: 22, fontWeight: 'bold', color: colors.primaryDark, marginBottom: 4, },
    profileBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, },
    badgeText: { color: colors.white, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', },
    
    // --- SECCIONES Y BOTONES DE EDICIÓN ---
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.primaryDark, paddingLeft: 12, borderLeftWidth: 4, borderLeftColor: colors.primaryLight, },
    editAllButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3, },
    editAllText: { color: colors.white, fontWeight: 'bold', fontSize: 14, },
    infoItem: { backgroundColor: colors.white, borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, flexDirection: 'row', alignItems: 'flex-start', gap: 15, },
    infoIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.accentGreen, justifyContent: 'center', alignItems: 'center', flexShrink: 0, },
    infoContent: { flex: 1, },
    infoLabel: { fontSize: 11, fontWeight: '700', color: colors.textMedium, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8, },
    infoValue: { fontSize: 16, color: colors.textDark, fontWeight: '500', flex: 1, },
    sectionSpacing: { marginTop: 35, marginBottom: 20, },
    arrowIcon: { marginLeft: 10, },
    actionText: { flex: 1, },

    // --- ACCIONES DE LOGOUT (AMARILLO) ---
    actionButtonLogout: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.warningLight, borderRadius: 16, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, },
    actionIconLogout: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginRight: 15, backgroundColor: colors.warningLight, },
    actionLabelLogout: { fontSize: 16, fontWeight: '700', marginBottom: 2, color: colors.warning, },
    actionDescriptionLogout: { fontSize: 12, opacity: 0.9, fontWeight: '400', color: colors.warning, },

    // --- ACCIONES DE DELETE (ROJO) ---
    actionButtonDelete: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.dangerLight, borderRadius: 16, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, },
    actionIconDelete: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginRight: 15, backgroundColor: colors.dangerLight, },
    actionLabelDelete: { fontSize: 16, fontWeight: '700', marginBottom: 2, color: colors.danger, },
    actionDescriptionDelete: { fontSize: 12, opacity: 0.9, fontWeight: '400', color: colors.danger, },

    // --- MODAL BASE Y ACCIONES ---
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.darkOverlay, },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, gap: 10, },
    modalButtonCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.gray, justifyContent: 'center', alignItems: 'center', },
    modalTextCancel: { color: colors.textDark, fontWeight: 'bold', },

    // --- MODAL DE EDICIÓN ---
    modalView: { width: '90%', backgroundColor: colors.white, borderRadius: 20, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 10, },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: colors.primaryDark, },
    modalSubtitle: { fontSize: 14, color: colors.textMedium, marginBottom: 20, },
    inputLabel: { fontSize: 12, fontWeight: '600', color: colors.textDark, marginTop: 15, marginBottom: 5, },
    inputModal: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 16, color: colors.textDark, marginBottom: 5, },
    modalButtonSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.primaryDark, justifyContent: 'center', alignItems: 'center', },
    modalTextSave: { color: colors.white, fontWeight: 'bold', },

    // --- MODAL DE LOGOUT (AMARILLO) ---
    logoutModalView: { width: '90%', backgroundColor: colors.white, borderRadius: 20, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 10, alignItems: 'center', },
    logoutModalIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.warningLight, justifyContent: 'center', alignItems: 'center', marginBottom: 15, },
    logoutModalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: colors.warning, textAlign: 'center', },
    logoutModalMessage: { fontSize: 14, color: colors.textMedium, marginBottom: 20, textAlign: 'center', },
    modalButtonLogoutConfirm: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.warning, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3, },
    modalTextLogoutConfirm: { color: colors.white, fontWeight: 'bold', },

    // --- MODAL DE ELIMINACIÓN (ROJO) ---
    deleteModalView: { width: '90%', backgroundColor: colors.white, borderRadius: 20, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 10, alignItems: 'center', },
    deleteModalIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.dangerLight, justifyContent: 'center', alignItems: 'center', marginBottom: 15, },
    deleteModalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: colors.danger, textAlign: 'center', },
    deleteModalMessage: { fontSize: 14, color: colors.textMedium, marginBottom: 20, textAlign: 'center', },
    modalButtonDeleteConfirm: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3, },
    modalTextDeleteConfirm: { color: colors.white, fontWeight: 'bold', },
    confirmTextInput: { backgroundColor: colors.dangerLight, borderWidth: 2, borderColor: colors.danger, borderRadius: 12, padding: 15, fontSize: 16, fontWeight: '700', color: colors.danger, textAlign: 'center', width: '100%', marginBottom: 20, },

    // --- MODAL DE ERROR/VALIDACIÓN ---
    errorModalView: { width: '85%', backgroundColor: colors.white, borderRadius: 20, padding: 30, alignItems: 'center', shadowColor: '#07dc39c3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 10, },
    errorIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.dangerLight, justifyContent: 'center', alignItems: 'center', marginBottom: 15, },
    errorModalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: colors.danger, textAlign: 'center', },
    errorModalMessage: { fontSize: 14, color: colors.textDark, marginBottom: 25, textAlign: 'center', lineHeight: 20, },
    errorModalButton: { width: '100%', padding: 14, borderRadius: 12, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center', },
    errorModalText: { color: colors.white, fontWeight: 'bold', },
    // --- MODAL DE ÉXITO ---
successModalView: { 
    width: '85%', 
    backgroundColor: colors.white, 
    borderRadius: 20, 
    padding: 30, 
    alignItems: 'center', 
    shadowColor: '#15835dff', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 4, 
    elevation: 10, 
},
successIcon: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: colors.accentGreen, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15, 
},
successModalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    color: colors.primaryDark, 
    textAlign: 'center', 
},
successModalMessage: { 
    fontSize: 14, 
    color: colors.textDark, 
    marginBottom: 25, 
    textAlign: 'center', 
    lineHeight: 20, 
},
successModalButton: { 
    width: '100%', 
    padding: 14, 
    borderRadius: 12, 
    backgroundColor: colors.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center', 
},
successModalText: { 
    color: colors.white, 
    fontWeight: 'bold', 
},
});

export default ProfileScreen;