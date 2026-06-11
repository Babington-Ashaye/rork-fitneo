import SwiftUI
import Combine

struct ActiveSessionView: View {
    @Environment(FitneoStore.self) private var store
    let program: WorkoutProgram
    var onFinish: () -> Void

    @State private var exerciseIndex = 0
    @State private var currentSet = 1
    @State private var setsCompleted = 0
    @State private var resting = false
    @State private var restRemaining = 0
    @State private var restTotal = 1
    @State private var elapsed = 0
    @State private var paused = false
    @State private var finished = false
    @AppStorage("fitneo_show_exercise_video") private var showVideo: Bool = true
    @State private var currentVideoURL: URL? = nil

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var exercises: [Exercise] { ExerciseLibrary.exercises(ids: program.exerciseIDs) }
    private var current: Exercise { exercises[min(exerciseIndex, exercises.count - 1)] }
    private var totalSets: Int { exercises.reduce(0) { $0 + $1.sets } }
    private var progress: Double { totalSets == 0 ? 0 : Double(setsCompleted) / Double(totalSets) }

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            if finished {
                completionView
            } else {
                sessionView
            }
        }
        .onReceive(ticker) { _ in tick() }
    }

    private var sessionView: some View {
        VStack(spacing: 18) {
            header
            // progress
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.08))
                    Capsule().fill(Theme.accent)
                        .frame(width: max(6, geo.size.width * progress))
                        .animation(.spring, value: progress)
                }
            }
            .frame(height: 8)
            .padding(.horizontal, 20)

            Spacer()

            if resting {
                VStack(spacing: 24) {
                    TimerRing(progress: restTotal == 0 ? 0 : Double(restRemaining) / Double(restTotal), secondsRemaining: restRemaining)
                    Text("Next: Set \(currentSet) of \(current.sets)")
                        .font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.textSecondary)
                    Button("Skip Rest") { endRest() }
                        .font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.accent)
                }
            } else {
                exerciseCard
            }

            Spacer()
            controls
        }
        .padding(.top, 8)
    }

    private var header: some View {
        HStack {
            Button {
                onFinish()
            } label: {
                Image(systemName: "xmark").font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 40, height: 40).background(Circle().fill(Color.white.opacity(0.08)))
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(program.name).font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                Text(timeString(elapsed)).font(.system(size: 13, weight: .medium)).foregroundStyle(Theme.textSecondary)
            }
            Spacer()
            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                paused.toggle()
            } label: {
                Image(systemName: paused ? "play.fill" : "pause.fill")
                    .font(.system(size: 16, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 40, height: 40).background(Circle().fill(Color.white.opacity(0.08)))
            }
        }
        .padding(.horizontal, 20)
        .buttonStyle(.plain)
    }

    private var exerciseCard: some View {
        VStack(spacing: 16) {
            // Video player area (top of card)
            if showVideo {
                ZStack(alignment: .topTrailing) {
                    VideoPlayerView(
                        videoURL: currentVideoURL,
                        exerciseName: current.name,
                        isPaused: paused
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    // Hide Video button
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            showVideo = false
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "eye.slash.fill")
                                .font(.system(size: 10))
                            Text("Hide Video")
                                .font(.system(size: 11, weight: .medium))
                        }
                        .foregroundStyle(Theme.textSecondary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(.ultraThinMaterial)
                                .opacity(0.6)
                        )
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.12), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                    .padding(8)
                }
                .transition(.opacity.combined(with: .scale(scale: 0.98)))
            }

            // Show Video button (when video is hidden)
            if !showVideo {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showVideo = true
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "eye.fill")
                            .font(.system(size: 10))
                        Text("Show Video")
                            .font(.system(size: 11, weight: .medium))
                    }
                    .foregroundStyle(Theme.accent)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(Theme.accent.opacity(0.12))
                    )
                    .overlay(
                        Capsule()
                            .stroke(Theme.accent.opacity(0.25), lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }

            // Existing exercise content (unchanged)
            Text(current.muscleGroup.title.uppercased())
                .font(.system(size: 12, weight: .bold)).tracking(2)
                .padding(.horizontal, 12).padding(.vertical, 5)
                .background(Capsule().fill(Theme.accent.opacity(0.15)))
                .foregroundStyle(Theme.accent)
            Text(current.name).font(.system(size: 30, weight: .bold)).foregroundStyle(.white)
                .multilineTextAlignment(.center)
            HStack(spacing: 28) {
                VStack { Text("\(currentSet)").font(.system(size: 34, weight: .bold)).foregroundStyle(Theme.accent); Text("of \(current.sets) sets").font(.caption).foregroundStyle(Theme.textTertiary) }
                VStack { Text(current.reps).font(.system(size: 34, weight: .bold)).foregroundStyle(.white); Text("reps").font(.caption).foregroundStyle(Theme.textTertiary) }
            }
            VStack(alignment: .leading, spacing: 10) {
                infoBlock("info.circle.fill", current.instructions)
                infoBlock("lightbulb.fill", current.tips, tint: Color(red: 1, green: 0.78, blue: 0.2))
            }
            .padding(.top, 6)
        }
        .padding(24)
        .glassCard(cornerRadius: 26)
        .padding(.horizontal, 20)
        .animation(.easeInOut(duration: 0.2), value: showVideo)
    }

    private func infoBlock(_ icon: String, _ text: String, tint: Color = Theme.accent) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(tint)
            Text(text).font(.system(size: 14)).foregroundStyle(Theme.textSecondary).fixedSize(horizontal: false, vertical: true)
        }
    }

    private var controls: some View {
        HStack(spacing: 12) {
            circleButton("chevron.left", enabled: exerciseIndex > 0) { previousExercise() }
            PillButton(title: resting ? "Resting…" : "Complete Set", icon: resting ? nil : "checkmark") {
                if !resting { completeSet() }
            }
            circleButton("chevron.right", enabled: exerciseIndex < exercises.count - 1) { nextExercise() }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 16)
    }

    private func circleButton(_ icon: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.system(size: 18, weight: .bold))
                .foregroundStyle(enabled ? .white : Theme.textTertiary)
                .frame(width: 54, height: 54)
                .background(RoundedRectangle(cornerRadius: 16).fill(Color.white.opacity(0.05)))
        }
        .buttonStyle(.plain).disabled(!enabled)
    }

    // MARK: - Logic

    private func tick() {
        guard !paused && !finished else { return }
        elapsed += 1
        if resting {
            if restRemaining > 0 { restRemaining -= 1 }
            if restRemaining <= 0 { endRest() }
        }
    }

    private func completeSet() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        setsCompleted += 1
        if currentSet < current.sets {
            currentSet += 1
            startRest()
        } else {
            if exerciseIndex < exercises.count - 1 {
                startRest()
                exerciseIndex += 1
                currentSet = 1
            } else {
                finishWorkout()
            }
        }
    }

    private func startRest() {
        guard current.restSeconds > 0 else { return }
        restTotal = current.restSeconds
        restRemaining = current.restSeconds
        withAnimation { resting = true }
    }

    private func endRest() {
        withAnimation { resting = false }
        restRemaining = 0
    }

    private func nextExercise() {
        guard exerciseIndex < exercises.count - 1 else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        currentVideoURL = nil
        exerciseIndex += 1; currentSet = 1; endRest()
    }
    private func previousExercise() {
        guard exerciseIndex > 0 else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        currentVideoURL = nil
        exerciseIndex -= 1; currentSet = 1; endRest()
    }

    private func finishWorkout() {
        store.completeWorkout(program: program, durationSeconds: max(elapsed, 60), setsCompleted: setsCompleted)
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        withAnimation(.spring) { finished = true }
    }

    private var earnedXP: Int { store.workouts.last?.xpEarned ?? 0 }
    private var burned: Int { store.workouts.last?.caloriesBurned ?? 0 }

    private var completionView: some View {
        VStack(spacing: 22) {
            Spacer()
            ZStack {
                Circle().fill(Theme.accent.opacity(0.2)).frame(width: 130, height: 130).blur(radius: 18)
                Image(systemName: "checkmark.circle.fill").font(.system(size: 90)).foregroundStyle(Theme.accent)
                    .shadow(color: Theme.accent, radius: 16)
            }
            Text("Workout Complete!").font(.system(size: 28, weight: .bold)).foregroundStyle(.white)
            Text(program.name).font(.system(size: 16)).foregroundStyle(Theme.textSecondary)
            HStack(spacing: 14) {
                resultStat("+\(earnedXP)", "XP", Theme.accent)
                resultStat("\(burned)", "kcal", Theme.coral)
                resultStat(timeString(elapsed), "time", .white)
                resultStat("\(setsCompleted)", "sets", Color(red: 0, green: 0.85, blue: 0.7))
            }
            Spacer()
            PillButton(title: "Done", icon: "house.fill", action: onFinish).padding(.horizontal, 40)
            Spacer().frame(height: 20)
        }
        .padding(20)
    }

    private func resultStat(_ value: String, _ label: String, _ tint: Color) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(size: 20, weight: .bold)).foregroundStyle(tint)
            Text(label).font(.system(size: 11, weight: .medium)).foregroundStyle(Theme.textTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .glassCard(cornerRadius: 16)
    }

    private func timeString(_ s: Int) -> String { String(format: "%02d:%02d", s / 60, s % 60) }
}
