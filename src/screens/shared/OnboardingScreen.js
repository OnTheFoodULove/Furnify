import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: require('../../../assets/images/onboarding1.png'),
    title: 'Discover Premium Furniture',
    subtitle:
      'Browse thousands of handcrafted pieces from top designers. Find the perfect match for your style.',
    accent: Colors.primary,
  },
  {
    id: '2',
    image: require('../../../assets/images/onboarding2.png'),
    title: 'Design Your Space',
    subtitle:
      'Preview how furniture looks in your room with our smart placement tool before you buy.',
    accent: Colors.categories.bedroom,
  },
  {
    id: '3',
    image: require('../../../assets/images/onboarding3.png'),
    title: 'Shop with Confidence',
    subtitle:
      'Secure checkout, flexible delivery, and hassle-free returns. Comfort starts here.',
    accent: Colors.categories.dining,
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex((i) => i + 1);
    } else {
      navigation.replace('AuthStack');
    }
  };

  const handleSkip = () => {
    navigation.replace('AuthStack');
  };

  const handleMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  const renderSlide = ({ item, index }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
        <View style={[styles.imageOverlay, { backgroundColor: item.accent + '15' }]} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: item.accent }]}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={renderSlide}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * width,
              i * width,
              (i + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: SLIDES[currentIndex].accent,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: SLIDES[currentIndex].accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: Spacing.xl,
    zIndex: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  slide: {
    width,
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  textContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 20,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extraBold,
    marginBottom: Spacing.md,
    lineHeight: Typography.size.xxl * 1.25,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: Typography.size.base * 1.7,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 48,
    paddingTop: Spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    height: 50,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
});
