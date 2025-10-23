
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createProduct, updateProduct } from "../services/productService";

export default function ProductFormScreen({ route, navigation }) {
  const { product, mode } = route.params || {};
  const isEditMode = mode === "edit";

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && product) {
      setName(product.name || "");
      setPrice(product.price?.toString() || "");
      setDescription(product.description || "");
      setCategoryName(product.categoryName || "");
      setImageUrl(product.imageUrl || "");
    }
  }, [product, isEditMode]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Necesitamos permiso para acceder a tus fotos"
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage({
        uri: result.assets[0].uri,
        type: result.assets[0].type || "image/jpeg",
        fileName: result.assets[0].fileName || "product.jpg",
      });
    }
  };

  const validateFields = () => {
    const newErrors = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio.";
      isValid = false;
    }

    if (!price.trim()) {
      newErrors.price = "El precio es obligatorio.";
      isValid = false;
    } else if (isNaN(price) || parseFloat(price) <= 0) {
      newErrors.price = "El precio debe ser un número mayor a 0.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const productData = {
      name: name.trim(),
      price: parseFloat(price),
      description: description.trim(),
      categoryName: categoryName.trim(),
    };

    if (image) {
      productData.image = image;
    } else if (isEditMode && imageUrl) {
      productData.imageUrl = imageUrl;
    }

    try {
      setLoading(true);
      let response;

      if (isEditMode) {
        response = await updateProduct(product.productId, productData);
      } else {
        response = await createProduct(productData);
      }

      if (response.isSuccess) {
        Alert.alert(
          "Éxito",
          `Producto ${isEditMode ? "actualizado" : "creado"} correctamente`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          response.message || `No se pudo ${isEditMode ? "actualizar" : "crear"} el producto`
        );
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un problema al guardar el producto");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditMode ? "Editar Producto" : "Nuevo Producto"}
        </Text>
      </View>

      <View style={styles.form}>
        {/* Imagen */}
        <View style={styles.imageContainer}>
          {image?.uri || imageUrl ? (
            <Image
              source={{
                uri: image?.uri || `https://product-microservice-cwk6.onrender.com${imageUrl}`,
              }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImagePreview}>
              <Text style={styles.noImageText}>Sin imagen</Text>
            </View>
          )}
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>
              {image || imageUrl ? "Cambiar Imagen" : "Seleccionar Imagen"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nombre */}
        <Text style={styles.label}>Nombre del Producto *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: iPhone 16"
          value={name}
          onChangeText={setName}
        />
        {errors.name && <Text style={styles.error}>{errors.name}</Text>}

        {/* Precio */}
        <Text style={styles.label}>Precio *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 100000"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        {errors.price && <Text style={styles.error}>{errors.price}</Text>}

        {/* Categoría */}
        <Text style={styles.label}>Categoría</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Celulares"
          value={categoryName}
          onChangeText={setCategoryName}
        />

        {/* Descripción */}
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descripción del producto..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Botón Guardar */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? "Actualizar Producto" : "Crear Producto"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3CB371",
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  form: {
    padding: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imagePreview: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 10,
  },
  noImagePreview: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  noImageText: {
    color: "#999",
    fontSize: 16,
  },
  imageButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#3CB371",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 5,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  error: {
    color: "#f44336",
    fontSize: 13,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: "#3CB371",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: "#a0d4b4",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});