import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  PanResponder,
  Animated,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

const { width, height } = Dimensions.get('window');

export default function ImagePlacementScreen({ route, navigation }) {
  const { item } = route.params;
  const [backgroundUri, setBackgroundUri] = useState(null);
  
  // Furniture scaling and positioning
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  
  // Simple pan responder for dragging the furniture around
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const pickBackground = async (fromCamera = false) => {
    const permissions = fromCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
      
    if (permissions.status !== 'granted') {
      Alert.alert('Permission Required', `Please allow access to your ${fromCamera ? 'camera' : 'photo library'}.`);
      return;
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets?.length > 0) {
      setBackgroundUri(result.assets[0].uri);
      // Reset position when loading new background
      pan.setValue({ x: 0, y: 0 });
      scale.setValue(1);
    }
  };

  const adjustScale = (amount) => {
    const currentScale = scale._value;
    const newScale = Math.max(0.5, Math.min(currentScale + amount, 2.5));
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: false, // PanResponder needs false
    }).start();
  };

  const handleSave = () => {
    Toast.show({
      type: 'success',
      text1: 'Saved',
      text2: 'Photo saved to your device',
    });
  };

  if (!backgroundUri) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="scan-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Try in your room</Text>
          <Text style={styles.subtitle}>
            Take a photo of your room or choose one from your gallery to see how {item.name} looks in your space.
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.btn, styles.primaryBtn]} 
              onPress={() => pickBackground(true)}
            >
              <Ionicons name="camera-outline" size={20} color={Colors.textInverse} />
              <Text style={styles.primaryBtnText}>Open Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.secondaryBtn]} 
              onPress={() => pickBackground(false)}
            >
              <Ionicons name="images-outline" size={20} color={Colors.text} />
              <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Background Image */}
      <Image source={{ uri: backgroundUri }} style={styles.background} resizeMode="cover" />

      {/* Furniture Overlay */}
      <Animated.View
        style={[
          styles.furnitureWrapper,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Image
          source={item.image_url ? { uri: item.image_url } : require('../../../assets/images/empty-list.png')}
          style={styles.furnitureImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.iconBtn} onPress={() => pickBackground(false)}>
          <Ionicons name="images" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <Text style={styles.instructionText}>Drag to move • Tap + / - to scale</Text>
        
        <View style={styles.scaleControls}>
          <TouchableOpacity style={styles.scaleBtn} onPress={() => adjustScale(-0.2)}>
            <Ionicons name="remove" size={24} color={Colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="download-outline" size={20} color={Colors.textInverse} />
            <Text style={styles.saveBtnText}>Save Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.scaleBtn} onPress={() => adjustScale(0.2)}>
            <Ionicons name="add" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  actionButtons: {
    width: '100%',
    gap: Spacing.md,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  secondaryBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  primaryBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
  },
  secondaryBtnText: {
    color: Colors.text,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
  },
  
  // AR View Styles
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  furnitureWrapper: {
    position: 'absolute',
    top: height / 2 - 100,
    left: width / 2 - 100,
    width: 200,
    height: 200,
  },
  furnitureImage: {
    width: '100%',
    height: '100%',
    // Adding a subtle shadow to make it look a bit more realistic
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: Spacing.xl,
    right: Spacing.xl,
    alignItems: 'center',
  },
  instructionText: {
    color: Colors.textInverse,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  scaleControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  scaleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    height: 44,
    borderRadius: 22,
    gap: Spacing.xs,
  },
  saveBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.weight.bold,
  },
});
