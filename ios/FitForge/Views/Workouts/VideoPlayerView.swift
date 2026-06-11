import SwiftUI
import AVKit

/// Reusable video player component for exercise demonstrations.
/// Accepts an optional videoURL — shows a polished placeholder when nil.
struct VideoPlayerView: View {
    let videoURL: URL?
    let exerciseName: String
    var isPaused: Bool = false

    @State private var player: AVPlayer?
    @State private var looper: AVPlayerLooper?

    var body: some View {
        Group {
            if let url = videoURL {
                VideoPlayerRepresentable(player: player, isPaused: isPaused)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 180, maxHeight: 400)
                    .animation(.easeInOut(duration: 0.25), value: videoURL?.absoluteString)
            } else {
                placeholderView
            }
        }
        .onAppear { setupPlayerIfNeeded() }
        .onChange(of: videoURL?.absoluteString ?? "") { _, _ in
            cleanupPlayer()
            setupPlayerIfNeeded()
        }
        .onChange(of: isPaused) { _, paused in
            if paused {
                player?.pause()
            } else {
                player?.play()
            }
        }
        .onDisappear { cleanupPlayer() }
    }

    private var placeholderView: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Theme.cardStroke, lineWidth: 1)
                )
            VStack(spacing: 12) {
                Image(systemName: "play.circle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(Theme.textTertiary)
                Text(exerciseName)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Text("Video coming soon")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Theme.textTertiary)
            }
            .padding(20)
        }
        .frame(height: 220)
        .frame(maxWidth: .infinity)
    }

    private func setupPlayerIfNeeded() {
        guard let url = videoURL else { return }
        let item = AVPlayerItem(url: url)
        let newPlayer = AVQueuePlayer(playerItem: item)
        newPlayer.isMuted = true
        let newLooper = AVPlayerLooper(player: newPlayer, templateItem: item)
        self.player = newPlayer
        self.looper = newLooper
        if !isPaused {
            newPlayer.play()
        }
    }

    private func cleanupPlayer() {
        player?.pause()
        player?.replaceCurrentItem(with: nil)
        looper = nil
        player = nil
    }
}

// MARK: - UIViewRepresentable for AVPlayer

private struct VideoPlayerRepresentable: UIViewRepresentable {
    let player: AVPlayer?
    let isPaused: Bool

    func makeUIView(context: Context) -> PlayerContainerView {
        let view = PlayerContainerView()
        view.playerLayer.videoGravity = .resizeAspect
        if let player {
            view.playerLayer.player = player
        }
        return view
    }

    func updateUIView(_ uiView: PlayerContainerView, context: Context) {
        uiView.playerLayer.player = player
    }
}

private final class PlayerContainerView: UIView {
    var playerLayer: AVPlayerLayer {
        layer as! AVPlayerLayer
    }

    override class var layerClass: AnyClass {
        AVPlayerLayer.self
    }
}
