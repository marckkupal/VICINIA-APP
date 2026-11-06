import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getApp } from '@react-native-firebase/app';

import {
  SplashScreen,
  Onboarding,
  WelcomeScreen,
  LoginScreen,
  SignUpScreen,
  RecoveryFlow,
  HomeScreen,
  ExploreScreen,
  BoardsScreen,
  EventsScreen,
  ProfileScreen,
  EditProfileScreen,
} from './src/screens';
import { TabBar } from './src/components/TabBar';
import { LogoutModal } from './src/components/LogoutModal';
import { SEED_USERS } from './src/data';
import { loadUsers, saveUsers } from './src/storage';
import { C } from './src/theme';
import type { Stage, TabKey, User } from './src/types';

// Temporary check: confirms Firebase is connected. Remove once confirmed.
console.log('Firebase project:', getApp().options.projectId);

// Shows any crash on screen instead of a blank/white screen.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={styles.errorBox} contentContainerStyle={styles.errorContent}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{String(this.state.error.message)}</Text>
          <Text style={styles.errorText}>{String(this.state.error.stack ?? '')}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

function Main(): React.JSX.Element {
  const [showSplash, setShowSplash] = useState(true);
  const [stage, setStage] = useState<Stage>('onboarding');
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabKey>('home');
  const [editing, setEditing] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  // The emailed vicinia://reset-password?... link, waiting for RecoveryFlow to use it.
  const [resetLink, setResetLink] = useState<string | null>(null);

  // Splash for ~1.8s, and load any accounts saved on this device.
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    loadUsers()
      .then((saved) => {
        if (saved && saved.length) setUsers(saved);
      })
      .catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  // Catches the password-reset link wherever the app is: closed (cold start), on any screen, or in the background.
  // It jumps straight to the Change Password screen, which finishes the reset.
  useEffect(() => {
    const open = (url?: string | null) => {
      if (!url || !url.includes('reset-password')) return;
      setResetLink(url);
      setEditing(false);
      setConfirmLogout(false);
      setStage('forgot');
    };
    Linking.getInitialURL().then(open).catch(() => {});
    const sub = Linking.addEventListener('url', (ev) => open(ev.url));
    return () => sub.remove();
  }, []);

  const addUser = (u: User) => {
    const next = [...users, u];
    setUsers(next);
    saveUsers(next);
    setUser(u);
    setTab('home');
    setStage('app');
  };

  const logIn = (u: User) => {
    setUser(u);
    setTab('home');
    setStage('app');
  };

  const logOut = () => {
    setConfirmLogout(false);
    setUser(null);
    setEditing(false);
    setProfileSaved(false);
    setStage('welcome');
  };

  const saveProfile = (updated: User) => {
    const next = users.map((u) => (user && u.email === user.email ? updated : u));
    setUsers(next);
    saveUsers(next);
    setUser(updated);
    setEditing(false);
    setProfileSaved(true);
  };

  if (showSplash) return <SplashScreen />;

  const renderStage = () => {
    switch (stage) {
      case 'onboarding':
        return <Onboarding onDone={() => setStage('welcome')} />;
      case 'welcome':
        return <WelcomeScreen onSignUp={() => setStage('signup')} onLogin={() => setStage('login')} />;
      case 'login':
        return (
          <LoginScreen
            users={users}
            onLogin={logIn}
            onBack={() => setStage('welcome')}
            onSwitch={() => setStage('signup')}
            onForgot={() => setStage('forgot')}
          />
        );
      case 'signup':
        return (
          <SignUpScreen
            users={users}
            onSignUp={addUser}
            onBack={() => setStage('welcome')}
            onSwitch={() => setStage('login')}
          />
        );
      case 'forgot':
        return (
          <RecoveryFlow
            onExit={() => setStage('login')}
            link={resetLink}
            onLinkHandled={() => setResetLink(null)}
          />
        );
      case 'app':
        if (!user) {
          return <WelcomeScreen onSignUp={() => setStage('signup')} onLogin={() => setStage('login')} />;
        }
        if (editing) {
          return <EditProfileScreen user={user} onSave={saveProfile} onClose={() => setEditing(false)} />;
        }
        return (
          <View style={styles.fill}>
            <View style={styles.fill}>
              {tab === 'home' ? <HomeScreen user={user} goProfile={() => setTab('profile')} /> : null}
              {tab === 'explore' ? <ExploreScreen user={user} /> : null}
              {tab === 'boards' ? <BoardsScreen user={user} /> : null}
              {tab === 'events' ? <EventsScreen user={user} /> : null}
              {tab === 'profile' ? (
                <ProfileScreen
                  user={user}
                  onEdit={() => setEditing(true)}
                  onLogout={() => setConfirmLogout(true)}
                  saved={profileSaved}
                  onDismissSaved={() => setProfileSaved(false)}
                  goExplore={() => setTab('explore')}
                  goEvents={() => setTab('events')}
                  goBoards={() => setTab('boards')}
                />
              ) : null}
            </View>
            <TabBar tab={tab} onChange={setTab} />
            <LogoutModal
              visible={confirmLogout}
              onCancel={() => setConfirmLogout(false)}
              onConfirm={logOut}
            />
          </View>
        );
    }
  };

  // Onboarding and Welcome are full-yellow screens, so the area behind the clock/notch
  // must be yellow too. Every other screen keeps the cream background.
  const yellowTop = stage === 'onboarding' || stage === 'welcome' || (stage === 'app' && !user);

  return (
    <SafeAreaView style={[styles.safe, yellowTop && styles.safeYellow]} edges={['top']}>
      {renderStage()}
    </SafeAreaView>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <ErrorBoundary>
        <Main />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: C.cream },
  safeYellow: { backgroundColor: C.yellow },
  errorBox: { flex: 1, backgroundColor: '#fff' },
  errorContent: { padding: 24, paddingTop: 80 },
  errorTitle: { fontSize: 22, fontWeight: '800', color: '#B00020', marginBottom: 12 },
  errorText: { fontSize: 13, color: '#222', marginBottom: 12 },
});