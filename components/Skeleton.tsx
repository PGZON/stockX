import { useTheme } from '@/context/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
    width?: ViewStyle['width'];
    height?: ViewStyle['height'];
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                    backgroundColor: colors.card,
                    borderColor: colors.border
                },
                style
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        borderWidth: 1,
    },
});
