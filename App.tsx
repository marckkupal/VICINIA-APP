import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SEED_USERS } from './src/data';
import { saveUsers, loadUsers } from './src/storage';
import { s } from './src/styles';
import { C } from './src/theme';
import type { TabKey, Stage, User } from './src/types';
import {
  SplashScreen,
  Onboarding,
  WelcomeScreen,
  LoginScreen,
  SignUpScreen,
  HomeScreen,
  ExploreScreen,
  BoardsScreen,
  EventsScreen,
  ProfileScreen,
  EditProfileScreen,
} from './src/screens';
import { LogoutModal } from './src/components';

const SPLASH_DURATION_MS = 3000; // how long the splash stays visible

export default function App() {
  const [stage, setStage] = useState<Stage>('onboarding');
  const [tab, setTab] = useState<TabKey>('home');
  const [editing, setEditing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await loadUsers();
      if (saved) setUsers(saved);
      else await saveUsers(SEED_USERS);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) saveUsers(users);
  }, [users, loaded]);

  const start = (u: User) => { setCurrentUser(u); setTab('home'); setEditing(false); setStage('app'); };

  const handleSignUp = (u: User) => { setUsers([...users, u]); start(u); };

  const handleSave = (updated: User) => {
    if (!currentUser) return;
    setUsers(users.map((u) => (u.email === currentUser.email ? updated : u)));
    setCurrentUser(updated);
    setEditing(false);
  };

  const handleLogout = () => {
    setConfirmLogout(false);
    setCurrentUser(null);
    setEditing(false);
    setStage('login');
  };

  if (showSplash) return <SplashScreen />;

  if (!loaded) {
    return <SafeAreaView style={s.fill}><ActivityIndicator style={{ flex: 1 }} color={C.yellow} /></SafeAreaView>;
  }

  if (stage === 'onboarding') return <Onboarding onDone={() => setStage('welcome')} />;
  if (stage === 'welcome') return <WelcomeScreen onSignUp={() => setStage('signup')} onLogin={() => setStage('login')} />;

  if (stage === 'login' || stage === 'signup' || !currentUser) {
    return (
      <SafeAreaView style={s.fill}>
        <StatusBar barStyle="dark-content" />
        {stage === 'signup' ? (
          <SignUpScreen users={users} onSignUp={handleSignUp} onBack={() => setStage('welcome')} onSwitch={() => setStage('login')} />
        ) : (
          <LoginScreen users={users} onLogin={start} onBack={() => setStage('welcome')} onSwitch={() => setStage('signup')} />
        )}
      </SafeAreaView>
    );
  }

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'explore', label: 'Explore', icon: '🧭' },
    { key: 'boards', label: 'Boards', icon: '💬' },
    { key: 'events', label: 'Events', icon: '🗓️' },
    { key: 'profile', label: 'Profile', icon: '👤' },
  ];

  const renderScreen = () => {
    if (editing) return <EditProfileScreen user={currentUser} onSave={handleSave} onClose={() => setEditing(false)} />;
    switch (tab) {
      case 'home': return <HomeScreen user={currentUser} goProfile={() => setTab('profile')} />;
      case 'explore': return <ExploreScreen />;
      case 'boards': return <BoardsScreen />;
      case 'events': return <EventsScreen />;
      case 'profile': return <ProfileScreen user={currentUser} onEdit={() => setEditing(true)} onLogout={() => setConfirmLogout(true)} />;
    }
  };

  return (
    <SafeAreaView style={s.fill}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      <View style={s.tabBar}>
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} style={s.tabItem} onPress={() => { setTab(t.key); setEditing(false); }}>
              <Text style={[s.tabIcon, active && { opacity: 1 }]}>{t.icon}</Text>
              <Text style={[s.tabLabel, active && { color: C.yellow, fontWeight: '700' }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <LogoutModal visible={confirmLogout} onCancel={() => setConfirmLogout(false)} onConfirm={handleLogout} />
    </SafeAreaView>
  );
}