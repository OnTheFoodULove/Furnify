import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme';

export default function UserProfileScreen({ navigation }) {
  const { profile, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.username}>{profile?.username || 'User'}</Text>
          
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoBox}>
             <View style={styles.infoRow}>
               <Ionicons name="call-outline" size={20} color={Colors.primary} />
               <View style={styles.infoTextContainer}>
                 <Text style={styles.infoLabel}>Mobile Number</Text>
                 <Text style={styles.infoValue}>
                   {profile?.mobile_number || 'Not provided'}
                 </Text>
               </View>
             </View>
             
             <View style={styles.divider} />
             
             <View style={styles.infoRow}>
               <Ionicons name="location-outline" size={20} color={Colors.primary} />
               <View style={styles.infoTextContainer}>
                 <Text style={styles.infoLabel}>Delivery Address</Text>
                 <Text style={styles.infoValue}>
                   {profile?.address || 'Not provided'}
                 </Text>
               </View>
             </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.actionList}>
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="cube-outline" size={20} color={Colors.text} />
              <Text style={styles.actionItemText}>My Orders</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.border} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="heart-outline" size={20} color={Colors.text} />
              <Text style={styles.actionItemText}>Wishlist</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.border} />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="settings-outline" size={20} color={Colors.text} />
              <Text style={styles.actionItemText}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.border} />
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title="Sign Out"
          onPress={async () => {
            await signOut();
            // Navigate to root navigator's AuthStack (tab navigator → HomeStack → root)
            const rootNav = navigation.getParent()?.getParent() ?? navigation.getParent() ?? navigation;
            rootNav.reset({
              index: 0,
              routes: [{ name: 'AuthStack' }],
            });
          }}
          variant="ghost"
          icon={<Ionicons name="log-out-outline" size={20} color={Colors.error} />}
          style={styles.signOutBtn}
          textStyle={{ color: Colors.error }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extraBold,
    color: Colors.text,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: Typography.size.display,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  username: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  editBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  editBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: Typography.size.base,
    color: Colors.text,
    fontWeight: Typography.weight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  actionList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    ...Shadows.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  actionItemText: {
    flex: 1,
    fontSize: Typography.size.base,
    color: Colors.text,
    fontWeight: Typography.weight.medium,
  },
  signOutBtn: {
    marginTop: Spacing.md,
  },
});
