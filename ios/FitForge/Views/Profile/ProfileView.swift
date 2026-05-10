import SwiftUI

struct ProfileView: View {
    @Bindable var viewModel: ProfileViewModel
    @State private var showSignOutConfirm = false
    var onSignOut: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Profile header
                profileHeader

                // Subscription card
                subscriptionSection

                // Preferences
                preferencesSection

                // Stats summary
                statsSummary

                // Sign out
                signOutButton
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .navigationTitle("Profile")
        .task {
            await viewModel.loadProfile()
        }
        .sheet(isPresented: $viewModel.showEditSheet) {
            if let data = viewModel.onboardingData {
                EditPreferencesSheet(data: data) { updatedData in
                    Task {
                        await viewModel.updateOnboarding(updatedData)
                    }
                }
            }
        }
        .sheet(isPresented: $viewModel.showSubscriptionSheet) {
            SubscriptionSheet(isPremium: (viewModel.userProfile?.subscriptionStatus ?? .free) != .free) {
                Task {
                    await viewModel.upgradeToPremium()
                }
            } onCancel: {
                Task {
                    await viewModel.cancelSubscription()
                }
            }
        }
        .alert("Sign Out", isPresented: $showSignOutConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Sign Out", role: .destructive) {
                onSignOut()
            }
        } message: {
            Text("Are you sure you want to sign out?")
        }
    }

    private var profileHeader: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(colors: [.orange, .red], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .frame(width: 72, height: 72)

                Text(initials)
                    .font(.title2.bold())
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(viewModel.userProfile?.displayName ?? viewModel.userProfile?.email ?? "User")
                    .font(.headline)

                Text(viewModel.userProfile?.email ?? "")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(spacing: 4) {
                    Image(systemName: viewModel.userProfile?.subscriptionStatus != .free ? "crown.fill" : "person.fill")
                        .font(.caption)
                        .foregroundStyle(viewModel.userProfile?.subscriptionStatus != .free ? .yellow : .secondary)

                    Text(viewModel.userProfile?.subscriptionStatus != .free ? "Premium" : "Free Plan")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.secondarySystemBackground))
        )
    }

    private var initials: String {
        let name = viewModel.userProfile?.displayName ?? viewModel.userProfile?.email ?? "U"
        let components = name.components(separatedBy: " ")
        if components.count > 1, let first = components.first?.first, let last = components.last?.first {
            return "\(String(first).uppercased())\(String(last).uppercased())"
        }
        return String(name.prefix(1)).uppercased()
    }

    private var subscriptionSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Subscription")
                .font(.headline)

            if viewModel.userProfile?.subscriptionStatus == .free {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Image(systemName: "crown.fill")
                            .font(.title2)
                            .foregroundStyle(.yellow)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("FitForge Premium")
                                .font(.headline)
                            Text("Unlock all workouts and advanced features")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    Button {
                        viewModel.showSubscriptionSheet = true
                    } label: {
                        HStack {
                            Image(systemName: "crown")
                            Text("Upgrade for $4.99/mo")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing)
                        )
                        .foregroundStyle(.white)
                        .clipShape(.rect(cornerRadius: 14))
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(.secondarySystemBackground))
                )
            } else {
                HStack {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.title2)
                        .foregroundStyle(.green)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Premium Active")
                            .font(.headline)
                        Text("You have access to all features")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Button {
                        Task {
                            await viewModel.cancelSubscription()
                        }
                    } label: {
                        Text("Cancel")
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.green.opacity(0.1))
                )
            }
        }
    }

    private var preferencesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Preferences")
                    .font(.headline)
                Spacer()
                Button {
                    viewModel.showEditSheet = true
                } label: {
                    Text("Edit")
                        .font(.subheadline)
                        .foregroundStyle(.orange)
                }
            }

            if let data = viewModel.onboardingData {
                VStack(spacing: 12) {
                    PreferenceRow(label: "Fitness Goal", value: data.fitnessGoal.displayName)
                    PreferenceRow(label: "Fitness Level", value: data.fitnessLevel.displayName)
                    PreferenceRow(label: "Workout Type", value: data.workoutPreference.displayName)
                    PreferenceRow(label: "Duration", value: data.workoutDuration.displayName)
                    PreferenceRow(label: "Days/Week", value: "\(data.daysPerWeek)")
                    PreferenceRow(label: "Target Areas", value: data.targetAreas.map { $0.displayName }.joined(separator: ", "))
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color(.secondarySystemBackground))
                )
            } else {
                Text("Complete onboarding to set preferences")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color(.secondarySystemBackground))
                    )
            }
        }
    }

    private var statsSummary: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Account")
                .font(.headline)

            VStack(spacing: 0) {
                NavigationLink {
                    Text("Notifications settings coming soon")
                        .navigationTitle("Notifications")
                } label: {
                    HStack {
                        Image(systemName: "bell.fill")
                            .foregroundStyle(.orange)
                        Text("Notifications")
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                }

                Divider()
                    .padding(.leading, 52)

                NavigationLink {
                    Text("Help and support coming soon")
                        .navigationTitle("Help")
                } label: {
                    HStack {
                        Image(systemName: "questionmark.circle.fill")
                            .foregroundStyle(.blue)
                        Text("Help & Support")
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                }

                Divider()
                    .padding(.leading, 52)

                NavigationLink {
                    Text("Privacy policy coming soon")
                        .navigationTitle("Privacy")
                } label: {
                    HStack {
                        Image(systemName: "shield.fill")
                            .foregroundStyle(.green)
                        Text("Privacy Policy")
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color(.secondarySystemBackground))
            )
        }
    }

    private var signOutButton: some View {
        Button {
            showSignOutConfirm = true
        } label: {
            HStack {
                Image(systemName: "arrow.right.square")
                Text("Sign Out")
                    .font(.headline)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.red.opacity(0.1))
            .foregroundStyle(.red)
            .clipShape(.rect(cornerRadius: 14))
        }
    }
}

struct PreferenceRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .multilineTextAlignment(.trailing)
        }
    }
}

struct EditPreferencesSheet: View {
    @State var data: OnboardingData
    let onSave: (OnboardingData) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Fitness Goal") {
                    Picker("Goal", selection: $data.fitnessGoal) {
                        ForEach(OnboardingData.FitnessGoal.allCases, id: \.self) { goal in
                            Text(goal.displayName).tag(goal)
                        }
                    }
                }

                Section("Fitness Level") {
                    Picker("Level", selection: $data.fitnessLevel) {
                        ForEach(OnboardingData.FitnessLevel.allCases, id: \.self) { level in
                            Text(level.displayName).tag(level)
                        }
                    }
                }

                Section("Workout Preference") {
                    Picker("Type", selection: $data.workoutPreference) {
                        ForEach(OnboardingData.WorkoutPreference.allCases, id: \.self) { pref in
                            Text(pref.displayName).tag(pref)
                        }
                    }
                }

                Section("Duration") {
                    Picker("Duration", selection: $data.workoutDuration) {
                        ForEach(OnboardingData.WorkoutDuration.allCases, id: \.self) { dur in
                            Text(dur.displayName).tag(dur)
                        }
                    }
                }

                Section("Days per Week") {
                    Stepper("\(data.daysPerWeek) days", value: $data.daysPerWeek, in: 1...7)
                }
            }
            .navigationTitle("Edit Preferences")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        onSave(data)
                        dismiss()
                    }
                }
            }
        }
    }
}

struct SubscriptionSheet: View {
    let isPremium: Bool
    let onUpgrade: () -> Void
    let onCancel: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                Image(systemName: "crown.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(
                        LinearGradient(colors: [.yellow, .orange], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )

                VStack(spacing: 12) {
                    Text("FitForge Premium")
                        .font(.title2.bold())

                    Text("Unlock your full potential")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 16) {
                    FeatureRow(icon: "infinite", text: "Unlimited workouts")
                    FeatureRow(icon: "dumbbell.fill", text: "Advanced training programs")
                    FeatureRow(icon: "chart.line.uptrend.xyaxis", text: "Detailed progress analytics")
                    FeatureRow(icon: "bell.badge.fill", text: "Custom reminders")
                }
                .padding(.horizontal, 32)

                Spacer()

                if !isPremium {
                    VStack(spacing: 12) {
                        Button {
                            onUpgrade()
                            dismiss()
                        } label: {
                            HStack {
                                Image(systemName: "crown.fill")
                                Text("Upgrade - $4.99/month")
                                    .font(.headline)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing)
                            )
                            .foregroundStyle(.white)
                            .clipShape(.rect(cornerRadius: 16))
                        }

                        Text("Cancel anytime. No commitment.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    Button {
                        onCancel()
                        dismiss()
                    } label: {
                        Text("Cancel Subscription")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .foregroundStyle(.red)
                            .clipShape(.rect(cornerRadius: 16))
                    }
                }
            }
            .padding()
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.orange)
                .frame(width: 32)

            Text(text)
                .font(.subheadline)
        }
    }
}
