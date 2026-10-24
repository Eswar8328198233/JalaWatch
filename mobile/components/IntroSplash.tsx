import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplet, Waves, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface IntroSplashProps {
  onFinish: () => void;
}

export default function IntroSplash({ onFinish }: IntroSplashProps) {
  // Master container fade (fades out at 4.2s - 5.0s)
  const masterFade = useRef(new Animated.Value(1)).current;

  // Staged timeline animations
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkFade = useRef(new Animated.Value(0)).current;
  const wordmarkTranslateY = useRef(new Animated.Value(12)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(8)).current;

  // Ripple animations
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;

  // Gently pulsing logo float
  const floatAnim = useRef(new Animated.Value(0)).current;

  // 5-second progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 0.0s - 0.8s: Background fades in and water-drop logo appears
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 0.8s - 2.0s: Wordmark and CSP badge appear
    const wordmarkTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(wordmarkFade, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkTranslateY, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    // 2.0s - 4.2s: Tagline appears & water ripples play
    const taglineTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineFade, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);

    // Ripple loops
    const createRipple = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const rippleLoop1 = createRipple(ripple1, 0);
    const rippleLoop2 = createRipple(ripple2, 1100);
    rippleLoop1.start();
    rippleLoop2.start();

    // Subtle gentle float for the logo icon
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    // 5-second linear progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4800,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // 4.2s - 5.0s: Fade smoothly into existing app
    const exitTimer = setTimeout(() => {
      Animated.timing(masterFade, {
        toValue: 0,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 4200);

    return () => {
      clearTimeout(wordmarkTimer);
      clearTimeout(taglineTimer);
      clearTimeout(exitTimer);
      rippleLoop1.stop();
      rippleLoop2.stop();
      floatLoop.stop();
    };
  }, [
    floatAnim,
    logoOpacity,
    logoScale,
    masterFade,
    onFinish,
    progressAnim,
    ripple1,
    ripple2,
    taglineFade,
    taglineTranslateY,
    wordmarkFade,
    wordmarkTranslateY,
  ]);

  const handleSkip = () => {
    Animated.timing(masterFade, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onFinish();
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: masterFade }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header with NUTAKKI CSP Badge and Skip Button */}
        <View style={styles.topBar}>
          <Animated.View
            style={[
              styles.cspBadge,
              {
                opacity: wordmarkFade,
                transform: [{ translateY: wordmarkTranslateY }],
              },
            ]}
          >
            <View style={styles.pulseDot} />
            <Text style={styles.cspBadgeText}>NUTAKKI CSP</Text>
          </Animated.View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            accessibilityLabel="Skip 5-second intro"
          >
            <Text style={styles.skipButtonText}>Skip</Text>
            <ChevronRight size={13} color="#17B8DB" />
          </TouchableOpacity>
        </View>

        {/* Center JalaWatch Water-Drop Logo, Wordmark & Tagline */}
        <View style={styles.centerContainer}>
          {/* Animated Ripples and Logo Container */}
          <View style={styles.logoWrapper}>
            {/* Soft expanding water ripple rings */}
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [
                    {
                      scale: ripple1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.3],
                      }),
                    },
                  ],
                  opacity: ripple1.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.5, 0.2, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [
                    {
                      scale: ripple2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.9],
                      }),
                    },
                  ],
                  opacity: ripple2.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [0.4, 0.15, 0],
                  }),
                },
              ]}
            />

            {/* Centered White Circle Logo with Drop */}
            <Animated.View
              style={[
                styles.logoCircle,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }, { translateY: floatAnim }],
                },
              ]}
            >
              <Droplet size={46} color="#0F766E" strokeWidth={2.4} />
              <View style={styles.dropletAccent} />
            </Animated.View>
          </View>

          {/* Large, elegant JalaWatch Wordmark */}
          <Animated.View
            style={[
              styles.brandContainer,
              {
                opacity: wordmarkFade,
                transform: [{ translateY: wordmarkTranslateY }],
              },
            ]}
          >
            <View style={styles.wordmarkRow}>
              <Text style={styles.wordmarkJala}>Jala</Text>
              <Text style={styles.wordmarkWatch}>Watch</Text>
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitleText}>
              Groundwater & Seepage Monitor
            </Text>

            <View style={styles.locationPill}>
              <Waves size={12} color="#17B8DB" />
              <Text style={styles.locationText}>
                Nutakki Village • Mangalagiri Mandal • AP
              </Text>
            </View>
          </Animated.View>

          {/* Tagline (Appears 2.0s - 4.2s) */}
          <Animated.View
            style={[
              styles.taglineContainer,
              {
                opacity: taglineFade,
                transform: [{ translateY: taglineTranslateY }],
              },
            ]}
          >
            <Text style={styles.taglineText}>
              “Every observation helps protect our groundwater.”
            </Text>
          </Animated.View>
        </View>

        {/* Bottom Progress Bar & Loading Message */}
        <View style={styles.bottomContainer}>
          {/* Tasteful "Loading your community map…" message */}
          <View style={styles.loadingMessageRow}>
            <View style={styles.loadingPingDot} />
            <Text style={styles.loadingMessageText}>
              Loading your community map…
            </Text>
          </View>

          {/* Smooth 5-second Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>

          {/* Academic Footer Note */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>CSP STUDY 2026</Text>
            <Text style={styles.footerBrand}>JALA-SEVA</Text>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F2FAF7',
    zIndex: 999999,
    elevation: 999,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  cspBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C3EDDC',
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.25)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F766E',
  },
  cspBadgeText: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C3EDDC',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 3,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  skipButtonText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  rippleRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#17B8DB',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C3EDDC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
    position: 'relative',
  },
  dropletAccent: {
    position: 'absolute',
    bottom: 22,
    right: 23,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#17B8DB',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  brandContainer: {
    alignItems: 'center',
    gap: 4,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkJala: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: -0.5,
  },
  wordmarkWatch: {
    fontSize: 42,
    fontWeight: '900',
    color: '#17B8DB',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  locationText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  taglineContainer: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  taglineText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E3A34',
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 280,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
  },
  loadingMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  loadingPingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#17B8DB',
  },
  loadingMessageText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#C3EDDC',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0F766E',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footerBrand: {
    color: '#0F766E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
