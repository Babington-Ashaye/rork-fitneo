import SwiftUI

/// Reusable GIF player component for exercise demonstrations.
/// Uses AsyncImage to display GIFs from remote URLs.
struct VideoPlayerView: View {
    let videoURL: URL?
    let exerciseName: String
    var isPaused: Bool = false

    var body: some View {
        Group {
            if let url = videoURL {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        ZStack {
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(Color.white.opacity(0.04))
                            VStack(spacing: 10) {
                                ProgressView().tint(.white)
                                Text("Loading \(exerciseName)...")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(Theme.textTertiary)
                            }
                        }
                        .frame(height: 220)
                        .frame(maxWidth: .infinity)

                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxWidth: .infinity)
                            .frame(minHeight: 180, maxHeight: 400)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    case .failure:
                        placeholderView

                    @unknown default:
                        placeholderView
                    }
                }
                .id(url.absoluteString)
            } else {
                placeholderView
            }
        }
    }

    private var placeholderView: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.08), lineWidth: 1)
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
}