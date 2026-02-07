import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { StudentDashboardScreen } from '../screens/StudentDashboardScreen';
import { CoachDashboardScreen } from '../screens/CoachDashboardScreen';

export type RootStackParamList = {
    RoleSelection: undefined;
    Login: { role: 'coach' | 'student' };
    StudentDashboard: undefined;
    CoachDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="RoleSelection"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: '#111827' },
                }}
            >
                <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
                <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
