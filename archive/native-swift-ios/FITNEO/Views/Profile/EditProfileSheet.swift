import SwiftUI

struct EditProfileSheet: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var age: Double = 25
    @State private var weight: Double = 70
    @State private var height: Double = 175
    @State private var level: Difficulty = .beginner
    @State private var goals: Set<String> = []
    @State private var equipment: Set<String> = []
    @State private var avatar = "#00f5a0"
    @State private var calorieGoal: Double = 2200
    @State private var weeklyGoal: Double = 4

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Edit Profile").font(.system(size: 26, weight: .bold)).foregroundStyle(.white).padding(.top, 12)

                    field("Name") {
                        TextField("Your name", text: $name).foregroundStyle(.white).tint(Theme.accent)
                            .padding(14).glassCard(cornerRadius: 14)
                    }

                    avatarPicker

                    sliderField("Age", value: $age, range: 16...80, unit: "")
                    sliderField("Weight", value: $weight, range: 30...200, unit: store.user.weightUnit)
                    sliderField("Height", value: $height, range: 120...220, unit: store.user.heightUnit)
                    sliderField("Daily calorie goal", value: $calorieGoal, range: 1200...4000, unit: "kcal", step: 50)
                    sliderField("Weekly workout goal", value: $weeklyGoal, range: 1...7, unit: "days", step: 1)

                    levelPicker
                    multiSelect("Goals", AppUser.goalOptions, $goals)
                    multiSelect("Equipment", AppUser.equipmentOptions, $equipment)

                    PillButton(title: "Save Changes", icon: "checkmark") { save() }
                    Color.clear.frame(height: 20)
                }
                .padding(20)
            }
            .scrollIndicators(.hidden)
        }
        .presentationDragIndicator(.visible)
        .onAppear(perform: load)
    }

    private func load() {
        let u = store.user
        name = u.name; age = Double(u.age); weight = u.weight; height = u.height
        level = u.fitnessLevel; goals = Set(u.goals); equipment = Set(u.equipment)
        avatar = u.avatarColorHex; calorieGoal = Double(u.calorieGoal); weeklyGoal = Double(u.weeklyWorkoutGoal)
    }

    private func save() {
        store.user.name = name.isEmpty ? "Athlete" : name
        store.user.age = Int(age)
        store.user.weight = weight
        store.user.height = height
        store.user.fitnessLevel = level
        store.user.goals = Array(goals)
        store.user.equipment = Array(equipment)
        store.user.avatarColorHex = avatar
        store.user.calorieGoal = Int(calorieGoal)
        store.user.weeklyWorkoutGoal = Int(weeklyGoal)
        dismiss()
    }

    private func field<Content: View>(_ label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label.uppercased()).font(.system(size: 11, weight: .bold)).tracking(1).foregroundStyle(Theme.textTertiary)
            content()
        }
    }

    private func sliderField(_ label: String, value: Binding<Double>, range: ClosedRange<Double>, unit: String, step: Double = 1) -> some View {
        field(label) {
            VStack(spacing: 6) {
                HStack {
                    Spacer()
                    Text("\(Int(value.wrappedValue)) \(unit)").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.accent)
                }
                Slider(value: value, in: range, step: step).tint(Theme.accent)
            }
            .padding(14).glassCard(cornerRadius: 14)
        }
    }

    private var avatarPicker: some View {
        field("Avatar color") {
            HStack(spacing: 10) {
                ForEach(AppUser.avatarColors, id: \.self) { hex in
                    Circle().fill(Color(hex: hex)).frame(width: 34, height: 34)
                        .overlay(Circle().stroke(.white, lineWidth: avatar == hex ? 2.5 : 0))
                        .onTapGesture { UIImpactFeedbackGenerator(style: .light).impactOccurred(); avatar = hex }
                }
            }
        }
    }

    private var levelPicker: some View {
        field("Fitness level") {
            HStack(spacing: 8) {
                ForEach(Difficulty.allCases, id: \.self) { d in
                    Button { level = d } label: {
                        Text(d.title).font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(level == d ? .white : Theme.textSecondary)
                            .frame(maxWidth: .infinity).padding(.vertical, 12)
                            .background(RoundedRectangle(cornerRadius: 12).fill(level == d ? Theme.accent : Color.white.opacity(0.05)))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func multiSelect(_ label: String, _ options: [String], _ selection: Binding<Set<String>>) -> some View {
        field(label) {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 110), spacing: 8)], spacing: 8) {
                ForEach(options, id: \.self) { opt in
                    let on = selection.wrappedValue.contains(opt)
                    Button {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        if on { selection.wrappedValue.remove(opt) } else { selection.wrappedValue.insert(opt) }
                    } label: {
                        Text(opt).font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(on ? .white : Theme.textSecondary)
                            .frame(maxWidth: .infinity).padding(.vertical, 10)
                            .background(RoundedRectangle(cornerRadius: 12).fill(on ? Theme.accent.opacity(0.8) : Color.white.opacity(0.05)))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(on ? Theme.accent : Color.clear, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}
