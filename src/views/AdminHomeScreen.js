import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function AdminHomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("userData");
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      const response = await fetch("https://auth-microservice-tfql.onrender.com/api/auth/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.isSuccess) {
        setUsers(result.result || []);
      } else {
        Alert.alert("Error", "No se pudieron cargar los usuarios");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error al obtener los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (email, newStatus) => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      const response = await fetch(`https://auth-microservice-tfql.onrender.com/api/auth/status/${email}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.isSuccess) {
        Alert.alert("Éxito", "Estado actualizado correctamente");
        loadUserData();
        setModalVisible(false);
      } else {
        Alert.alert("Error", result.message || "No se pudo cambiar el estado");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar el estado del usuario");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("userToken");
              await AsyncStorage.removeItem("userData");
              navigation.reset({ index: 0, routes: [{ name: 'Login' }],});
              Alert.alert("Sesión cerrada", "Has cerrado sesión exitosamente");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "No se pudo cerrar sesión");
            }
          }
        }
      ]
    );
  };

  const totalActivos = users.filter((u) => u.status === 1).length;
  const totalInactivos = users.filter((u) => u.status === 2).length;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4' }}>
        <View style={{ 
          backgroundColor: 'white', 
          padding: 40, 
          borderRadius: 20, 
          alignItems: 'center',
          shadowColor: '#059669',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 8
        }}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={{ marginTop: 16, color: '#065f46', fontSize: 16, fontWeight: '600' }}>
            Cargando información...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      {/* Header con diseño premium estilo "Book Your Flight" */}
      <View style={{
        backgroundColor: '#065f46',
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Patrón decorativo de fondo */}
        <View style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 200,
          height: 200,
          backgroundColor: '#059669',
          borderRadius: 100,
          opacity: 0.1,
          transform: [{ translateX: 50 }, { translateY: -50 }]
        }} />
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: 150,
          height: 150,
          backgroundColor: '#10b981',
          borderRadius: 75,
          opacity: 0.1,
          transform: [{ translateX: -40 }, { translateY: 40 }]
        }} />
        
        {/* Contenido del header */}
        <View style={{ position: 'relative', zIndex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: '#d1fae5', fontWeight: '600', marginBottom: 8, letterSpacing: 1 }}>
                PANEL DE ADMINISTRACIÓN
              </Text>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 4 }}>
                Hola, {user?.name?.split(' ')[0] || 'Usuario'}! 👋
              </Text>
              <Text style={{ fontSize: 15, color: '#a7f3d0', marginBottom: 16 }}>
                Gestiona tu sistema de manera eficiente
              </Text>
            </View>
            
            {/* Botón de cerrar sesión */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                width: 48,
                height: 48,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Avatar y rol */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              backgroundColor: 'white',
              width: 60,
              height: 60,
              borderRadius: 20,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8
            }}>
              <Ionicons name="person" size={32} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                {user?.name}
              </Text>
              <View style={{
                backgroundColor: 'rgba(209, 250, 229, 0.2)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                alignSelf: 'flex-start'
              }}>
                <Text style={{ color: '#d1fae5', fontSize: 13, fontWeight: '600' }}>
                  👑 {user?.roles?.[0] || "Administrador"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ padding: 16 }}>

        {/* Estadísticas mejoradas */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <View style={{ 
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 20,
            width: '48%',
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 5,
            borderLeftWidth: 4,
            borderLeftColor: '#10b981'
          }}>
            <View style={{
              backgroundColor: '#d1fae5',
              width: 50,
              height: 50,
              borderRadius: 15,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <Ionicons name="people" size={28} color="#10b981" />
            </View>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#065f46', marginBottom: 4 }}>
              {totalActivos}
            </Text>
            <Text style={{ fontSize: 14, color: '#059669', fontWeight: '600' }}>
              Usuarios Activos
            </Text>
          </View>

          <View style={{ 
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 20,
            width: '48%',
            shadowColor: '#6b7280',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5,
            borderLeftWidth: 4,
            borderLeftColor: '#6b7280'
          }}>
            <View style={{
              backgroundColor: '#f3f4f6',
              width: 50,
              height: 50,
              borderRadius: 15,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <Ionicons name="person-remove" size={28} color="#6b7280" />
            </View>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#374151', marginBottom: 4 }}>
              {totalInactivos}
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600' }}>
              Usuarios Inactivos
            </Text>
          </View>
        </View>

        {/* Lista de usuarios con diseño premium */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
          paddingHorizontal: 4
        }}>
          <View style={{
            width: 4,
            height: 24,
            backgroundColor: '#059669',
            borderRadius: 2,
            marginRight: 12
          }} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#065f46' }}>
            Gestión de Usuarios
          </Text>
        </View>

        {users.map((u, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setSelectedUser(u);
              setModalVisible(true);
            }}
            style={{
              backgroundColor: 'white',
              padding: 18,
              borderRadius: 18,
              marginBottom: 12,
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
              borderLeftWidth: 4,
              borderLeftColor: u.status === 1 ? '#10b981' : '#9ca3af'
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{
                  backgroundColor: u.status === 1 ? '#d1fae5' : '#f3f4f6',
                  width: 50,
                  height: 50,
                  borderRadius: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14
                }}>
                  <Ionicons 
                    name={u.status === 1 ? "person" : "person-outline"} 
                    size={24} 
                    color={u.status === 1 ? '#059669' : '#6b7280'} 
                  />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: '#065f46', fontWeight: '700', marginBottom: 4 }}>
                    {u.name}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                    {u.email}
                  </Text>
                  <View style={{
                    backgroundColor: u.status === 1 ? '#d1fae5' : '#f3f4f6',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    alignSelf: 'flex-start'
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: u.status === 1 ? '#059669' : '#6b7280'
                    }}>
                      {u.status === 1 ? '● Activo' : '○ Inactivo'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={{
                backgroundColor: '#f0fdf4',
                width: 36,
                height: 36,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Ionicons name="chevron-forward" size={22} color="#059669" />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </View>

      {/* Modal mejorado */}
      <Modal 
        visible={modalVisible} 
        animationType="slide"
        transparent={true}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end'
        }}>
          <View style={{ 
            backgroundColor: 'white',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            padding: 24,
            maxHeight: '85%'
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 24
            }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#065f46' }}>
                Detalles del Usuario
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  backgroundColor: '#fee2e2',
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Ionicons name="close" size={24} color="#dc2626" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{
                  backgroundColor: selectedUser.status === 1 ? '#d1fae5' : '#f3f4f6',
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 20,
                  alignItems: 'center'
                }}>
                  <View style={{
                    backgroundColor: 'white',
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <Ionicons 
                      name="person" 
                      size={40} 
                      color={selectedUser.status === 1 ? '#059669' : '#6b7280'} 
                    />
                  </View>
                  <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#065f46', marginBottom: 8 }}>
                    {selectedUser.name}
                  </Text>
                  <View style={{
                    backgroundColor: selectedUser.status === 1 ? '#10b981' : '#6b7280',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20
                  }}>
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                      {selectedUser.status === 1 ? '✓ ACTIVO' : '✕ INACTIVO'}
                    </Text>
                  </View>
                </View>

                <View style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 24
                }}>
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '600' }}>
                      CORREO ELECTRÓNICO
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="mail" size={20} color="#059669" style={{ marginRight: 10 }} />
                      <Text style={{ fontSize: 15, color: '#065f46', fontWeight: '500' }}>
                        {selectedUser.email}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '600' }}>
                      NÚMERO DE TELÉFONO
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="call" size={20} color="#059669" style={{ marginRight: 10 }} />
                      <Text style={{ fontSize: 15, color: '#065f46', fontWeight: '500' }}>
                        {selectedUser.phoneNumber}
                      </Text>
                    </View>
                  </View>

                  <View>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '600' }}>
                      ROL EN EL SISTEMA
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="shield-checkmark" size={20} color="#059669" style={{ marginRight: 10 }} />
                      <Text style={{ fontSize: 15, color: '#065f46', fontWeight: '500' }}>
                        {selectedUser.roles?.[0] || "Usuario"}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    handleChangeStatus(
                      selectedUser.email,
                      selectedUser.status === 1 ? 2 : 1
                    )
                  }
                  style={{
                    backgroundColor: selectedUser.status === 1 ? '#dc2626' : '#10b981',
                    padding: 18,
                    borderRadius: 16,
                    shadowColor: selectedUser.status === 1 ? '#dc2626' : '#10b981',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons 
                      name={selectedUser.status === 1 ? "close-circle" : "checkmark-circle"} 
                      size={24} 
                      color="white" 
                      style={{ marginRight: 10 }}
                    />
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700', fontSize: 17 }}>
                      {selectedUser.status === 1 ? 'Desactivar Usuario' : 'Activar Usuario'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}