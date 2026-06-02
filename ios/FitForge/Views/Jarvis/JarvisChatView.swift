import SwiftUI

struct JarvisChatView: View {
    @Environment(FitneoStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    var onStartWorkout: () -> Void

    @State private var input = ""
    @State private var typing = false

    var body: some View {
        ZStack {
            Theme.pageGradient.ignoresSafeArea()
            VStack(spacing: 0) {
                header
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 14) {
                            ForEach(store.messages) { msg in
                                MessageBubble(message: msg).id(msg.id)
                            }
                            if typing { TypingIndicator().id("typing") }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 16)
                    }
                    .scrollIndicators(.hidden)
                    .onChange(of: store.messages.count) { _, _ in
                        withAnimation { proxy.scrollTo(store.messages.last?.id, anchor: .bottom) }
                    }
                    .onChange(of: typing) { _, t in
                        if t { withAnimation { proxy.scrollTo("typing", anchor: .bottom) } }
                    }
                }
                suggestions
                inputBar
            }
        }
        .presentationDragIndicator(.visible)
    }

    private var header: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(Theme.accent.opacity(0.25)).frame(width: 44, height: 44)
                Circle().fill(Theme.accent).frame(width: 12, height: 12)
                    .shadow(color: Theme.accent, radius: 8)
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("Jarvis").font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                Text("AI Coach · online").font(.system(size: 12)).foregroundStyle(Theme.accent)
            }
            Spacer()
            Button { dismiss() } label: {
                Image(systemName: "xmark").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 36, height: 36).background(Circle().fill(Color.white.opacity(0.08)))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(.ultraThinMaterial.opacity(0.5))
    }

    private var suggestions: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(["Train me", "How am I doing?", "I'm tired", "Make it harder"], id: \.self) { s in
                    Button {
                        send(s)
                    } label: {
                        Text(s).font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.accent)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(Capsule().fill(Theme.accent.opacity(0.12)))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .scrollIndicators(.hidden)
        .contentMargins(.horizontal, 16)
        .padding(.bottom, 8)
    }

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Message Jarvis…", text: $input)
                .foregroundStyle(.white).tint(Theme.accent)
                .padding(.horizontal, 16).padding(.vertical, 12)
                .background(Capsule().fill(Color.white.opacity(0.06)))
                .overlay(Capsule().stroke(Color.white.opacity(0.1), lineWidth: 1))
            Button {
                send(input)
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(input.isEmpty ? Theme.accent.opacity(0.4) : Theme.accent))
            }
            .buttonStyle(.plain).disabled(input.isEmpty)
        }
        .padding(.horizontal, 16).padding(.vertical, 10)
        .background(.ultraThinMaterial.opacity(0.5))
    }

    private func send(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        store.messages.append(JarvisMessage(id: UUID(), role: .user, text: trimmed, date: Date()))
        input = ""

        let intent = JarvisBrain.detectIntent(trimmed)
        store.checkBadges()

        typing = true
        let reply = JarvisBrain.respond(to: trimmed, intent: intent, user: store.user, memory: store.jarvisMemory, personality: store.coachPersonality)

        Task {
            try? await Task.sleep(for: .seconds(1.0))
            typing = false
            store.messages.append(JarvisMessage(id: UUID(), role: .coach, text: reply, date: Date()))
            if case .startWorkout = intent {
                try? await Task.sleep(for: .seconds(0.6))
                dismiss()
                onStartWorkout()
            }
            if case .logFood = intent {
                store.requestedTab = 2
            }
        }
    }
}

struct MessageBubble: View {
    let message: JarvisMessage
    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 40) }
            Text(message.text)
                .font(.system(size: 15))
                .foregroundStyle(message.role == .user ? .white : Theme.textPrimary)
                .padding(.horizontal, 14).padding(.vertical, 11)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(message.role == .user ? Theme.accent : Color.white.opacity(0.06))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(message.role == .user ? Color.clear : Color.white.opacity(0.08), lineWidth: 1)
                )
                .fixedSize(horizontal: false, vertical: true)
            if message.role == .coach { Spacer(minLength: 40) }
        }
    }
}

struct TypingIndicator: View {
    @State private var phase = 0.0
    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<3) { i in
                Circle().fill(Theme.accent)
                    .frame(width: 7, height: 7)
                    .scaleEffect(phase == Double(i) ? 1.3 : 0.7)
                    .opacity(phase == Double(i) ? 1 : 0.4)
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(RoundedRectangle(cornerRadius: 18).fill(Color.white.opacity(0.06)))
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear {
            withAnimation(.easeInOut(duration: 0.4).repeatForever()) { phase = 2 }
        }
    }
}
