
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
    light: {
        text: '#11181C',
        background: '#fff',
        tint: tintColorLight,
        icon: '#687076',
        tabIconDefault: '#687076',
        tabIconSelected: tintColorLight,
    },
    dark: {
        text: '#ECEDEE',
        background: '#151718',
        tint: tintColorDark,
        icon: '#9BA1A6',
        tabIconDefault: '#9BA1A6',
        tabIconSelected: tintColorDark,
    },
    // Premium Fintech Colors
    professionalDark: {
        background: '#09090B', // Zinc 950
        card: '#18181B', // Zinc 900
        text: '#FAFAFA', // Zinc 50
        textMuted: '#A1A1AA', // Zinc 400
        primary: '#38BDF8', // Sky 400
        success: '#4ADE80', // Green 400
        danger: '#F87171', // Red 400
        warning: '#FACC15', // Yellow 400
        border: '#27272A', // Zinc 800
        chartLine: '#38BDF8',
        chartGradientStart: 'rgba(56, 189, 248, 0.3)',
        chartGradientEnd: 'rgba(56, 189, 248, 0.0)',
    },
    professionalLight: {
        background: '#F8FAFC', // Slate 50
        card: '#FFFFFF',
        text: '#0F172A', // Slate 900
        textMuted: '#64748B', // Slate 500
        primary: '#2563EB', // Blue 600
        success: '#16A34A', // Green 600
        danger: '#DC2626', // Red 600
        warning: '#CA8A04', // Yellow 600
        border: '#E2E8F0', // Slate 200
        chartLine: '#2563EB',
        chartGradientStart: 'rgba(37, 99, 235, 0.2)',
        chartGradientEnd: 'rgba(37, 99, 235, 0.0)',
    },
    // Backward compatibility (default to dark for now until Context switches)
    get professional() { return this.professionalDark; }
};
