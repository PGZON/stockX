import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';

interface FadeInViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    style?: ViewStyle | ViewStyle[];
    slideUp?: boolean;
    animateOnFocus?: boolean;
}

export const FadeInView = ({
    children,
    delay = 0,
    duration = 500,
    style,
    slideUp = true,
    animateOnFocus = false
}: FadeInViewProps) => {
    const isFocused = useIsFocused();
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(slideUp ? 20 : 0);

    const runAnimation = () => {
        // Reset values if animating on focus
        if (animateOnFocus) {
            opacity.value = 0;
            translateY.value = slideUp ? 20 : 0;
        }

        opacity.value = withDelay(delay, withTiming(1, {
            duration,
            easing: Easing.out(Easing.cubic)
        }));

        if (slideUp) {
            translateY.value = withDelay(delay, withTiming(0, {
                duration,
                easing: Easing.out(Easing.cubic)
            }));
        }
    };

    useEffect(() => {
        if (animateOnFocus) {
            if (isFocused) {
                runAnimation();
            }
        } else {
            runAnimation();
        }
    }, [delay, isFocused, animateOnFocus]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }]
    }));

    return (
        <Animated.View style={[style, animatedStyle]}>
            {children}
        </Animated.View>
    );
};
