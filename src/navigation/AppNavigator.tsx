import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { StudentDashboardScreen } from '../screens/StudentDashboardScreen';
import { CoachDashboardScreen } from '../screens/CoachDashboardScreen';

export type RootStackParamList = {
    Login: { role: 'coach' | 'student' };
    StudentDashboard: undefined;
    CoachDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: '#010103' },
                }}
            >
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    initialParams={{ role: 'student' }}
                />
                <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
                <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
