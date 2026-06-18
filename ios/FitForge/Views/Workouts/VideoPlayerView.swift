import SwiftUI
import UIKit

/// Reusable animated GIF player for exercise demonstrations.
/// Uses UIImageView with animated image data to play GIFs properly.
struct VideoPlayerView: View {
    let videoURL: URL?
    let exerciseName: String
    var isPaused: Bool = false

    var body: some View {
        Group {
            if let url = videoURL {
                AnimatedGIFView(url: url, isPaused: isPaused)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 180, maxHeight: 400)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
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
                    .foregroundStyle(.gray)
                Text(exerciseName)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Text("Video coming soon")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.gray)
            }
            .padding(20)
        }
        .frame(height: 220)
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Animated GIF UIViewRepresentable

struct AnimatedGIFView: UIViewRepresentable {
    let url: URL
    var isPaused: Bool = false

    func makeUIView(context: Context) -> GIFContainerView {
        let view = GIFContainerView()
        view.loadGIF(from: url)
        return view
    }

    func updateUIView(_ uiView: GIFContainerView, context: Context) {
        if isPaused {
            uiView.imageView.stopAnimating()
        } else {
            uiView.imageView.startAnimating()
        }
    }
}

// MARK: - GIF Container

final class GIFContainerView: UIView {
    let imageView = UIImageView()
    private let loadingIndicator = UIActivityIndicatorView(style: .medium)

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear

        imageView.contentMode = .scaleAspectFit
        imageView.clipsToBounds = true
        imageView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(imageView)

        loadingIndicator.color = .white
        loadingIndicator.translatesAutoresizingMaskIntoConstraints = false
        addSubview(loadingIndicator)
        loadingIndicator.startAnimating()

        NSLayoutConstraint.activate([
            imageView.topAnchor.constraint(equalTo: topAnchor),
            imageView.bottomAnchor.constraint(equalTo: bottomAnchor),
            imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: trailingAnchor),
            loadingIndicator.centerXAnchor.constraint(equalTo: centerXAnchor),
            loadingIndicator.centerYAnchor.constraint(equalTo: centerYAnchor)
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    func loadGIF(from url: URL) {
        Task {
            do {
                let (data, _) = try await URLSession.shared.data(from: url)
                let frames = decodeGIFFrames(from: data) ?? []
                let duration = gifDuration(from: data)
                let image = UIImage.animatedImage(with: frames, duration: duration)
                await MainActor.run {
                    self.imageView.image = image
                    self.imageView.startAnimating()
                    self.loadingIndicator.stopAnimating()
                    self.loadingIndicator.isHidden = true
                }
            } catch {
                await MainActor.run {
                    self.loadingIndicator.stopAnimating()
                    self.loadingIndicator.isHidden = true
                }
            }
        }
    }

    private func decodeGIFFrames(from data: Data) -> [UIImage]? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
        let count = CGImageSourceGetCount(source)
        var frames: [UIImage] = []
        for i in 0..<count {
            if let cgImage = CGImageSourceCreateImageAtIndex(source, i, nil) {
                frames.append(UIImage(cgImage: cgImage))
            }
        }
        return frames.isEmpty ? nil : frames
    }

    private func gifDuration(from data: Data) -> TimeInterval {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return 1.0 }
        let count = CGImageSourceGetCount(source)
        var duration: TimeInterval = 0
        for i in 0..<count {
            let props = CGImageSourceCopyPropertiesAtIndex(source, i, nil) as? [String: Any]
            let gifProps = props?[kCGImagePropertyGIFDictionary as String] as? [String: Any]
            let delay = gifProps?[kCGImagePropertyGIFDelayTime as String] as? TimeInterval ?? 0.1
            duration += delay
        }
        return duration > 0 ? duration : TimeInterval(count) * 0.1
    }
}