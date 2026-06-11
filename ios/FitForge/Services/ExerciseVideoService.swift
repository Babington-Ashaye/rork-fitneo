import Foundation

/// Fetches the exercise dataset from GitHub and maps FITNEO exercise names to
/// streaming video URLs. Videos are never cached — they stream on-demand and are
/// discarded immediately when the exercise screen is dismissed.
@MainActor
final class ExerciseVideoService {

    static let shared = ExerciseVideoService()

    private let datasetURL = URL(string: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json")!
    private let videoBaseURL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/"

    /// Cached lookup: GitHub exercise name → gif_url path
    private var lookup: [String: String] = [:]
    private var isLoaded = false
    private var isLoading = false

    private init() {}

    // MARK: - Public API

    /// Returns a streaming video URL for the given FITNEO exercise name, or nil if unmatched.
    func videoURL(for exerciseName: String) -> URL? {
        guard isLoaded else {
            // Trigger async load — return nil this time (placeholder will show).
            Task { await loadDataset() }
            return nil
        }
        guard let gifPath = bestMatch(for: exerciseName) else { return nil }
        return URL(string: videoBaseURL + gifPath)
    }

    /// Pre-loads the dataset so the first exercise card shows a video immediately.
    func preloadIfNeeded() {
        guard !isLoaded, !isLoading else { return }
        Task { await loadDataset() }
    }

    // MARK: - Loading

    private func loadDataset() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        // Check disk cache first
        if let cached = cachedDataset() {
            lookup = cached
            isLoaded = true
            return
        }

        do {
            let (data, _) = try await URLSession.shared.data(from: datasetURL)
            let exercises = try JSONDecoder().decode([GitHubExercise].self, from: data)
            var dict: [String: String] = [:]
            for ex in exercises {
                guard let gif = ex.gif_url, !gif.isEmpty else { continue }
                let key = ex.name.lowercased().trimmingCharacters(in: .whitespaces)
                dict[key] = gif
            }
            lookup = dict
            isLoaded = true
            cacheDataset(dict)
        } catch {
            print("[ExerciseVideoService] Failed to load dataset: \(error.localizedDescription)")
        }
    }

    // MARK: - Fuzzy matching

    /// Tries exact match first, then falls back to partial / word-overlap matching.
    private func bestMatch(for fitneoName: String) -> String? {
        let clean = fitneoName
            .lowercased()
            .replacingOccurrences(of: "-", with: " ")
            .replacingOccurrences(of: "(", with: "")
            .replacingOccurrences(of: ")", with: "")
            .trimmingCharacters(in: .whitespaces)

        let words = clean.split(separator: " ")

        // 1. Exact match
        if let exact = lookup[clean] { return exact }

        // 2. Match without trailing 's' (e.g. "push-ups" → "push up")
        let singular = clean.replacingOccurrences(of: "s ", with: " ")
                           .replacingOccurrences(of: "s", with: "", range: nil)
                           .trimmingCharacters(in: .whitespaces)
        if let s = lookup[singular] { return s }

        // 3. Best word-overlap: find the GitHub entry with the most matching words
        var best: (path: String, score: Int) = ("", 0)
        for (key, path) in lookup {
            let keyWords = Set(key.split(separator: " "))
            let overlap = words.filter { keyWords.contains($0) || keyWords.contains(where: { $0.hasPrefix(String($0.prefix(3))) }) }
            let score = overlap.count
            if score > best.score {
                best = (path, score)
            }
        }
        return best.score >= 2 ? best.path : nil
    }

    // MARK: - Disk cache

    private func cacheDataset(_ dict: [String: String]) {
        guard let data = try? JSONEncoder().encode(dict) else { return }
        UserDefaults.standard.set(data, forKey: "fitneo_exercise_dataset")
    }

    private func cachedDataset() -> [String: String]? {
        guard let data = UserDefaults.standard.data(forKey: "fitneo_exercise_dataset") else { return nil }
        return try? JSONDecoder().decode([String: String].self, from: data)
    }
}

// MARK: - GitHub JSON model (decodes only the fields we need)

private struct GitHubExercise: Decodable {
    let name: String
    let gif_url: String?
}
