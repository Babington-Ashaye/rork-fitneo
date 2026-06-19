import Foundation

/// Fetches the exercise dataset from GitHub and maps FITNEO exercise names to
/// streaming video URLs. Videos are never cached — they stream on-demand and are
/// discarded immediately when the exercise screen is dismissed.
@MainActor
final class ExerciseVideoService {

    static let shared = ExerciseVideoService()

    private let datasetURL = URL(string: "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json")!
    private let videoBaseURL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/"

    /// Hardcoded mapping from FITNEO exercise name → GIF file path.
    /// Checked FIRST before any fuzzy matching — guarantees exact hits.
    private let nameOverrides: [String: String] = [
        "Push-ups": "videos/0662-I4hDWkc.gif",
        "Incline Push-ups": "videos/0493-B1EVP9F.gif",
        "Chest Dips": "videos/0251-9WTm7dq.gif",
        "Dumbbell Press": "videos/0308-yz9nUhF.gif",
        "Dumbbell Flyes": "videos/0308-yz9nUhF.gif",
        "Cable Crossover": "videos/0155-0CXGHya.gif",
        "Pull-ups": "videos/0841-HMzLjXx.gif",
        "Bent-over Rows": "videos/0574-X3cqyXz.gif",
        "Lat Pulldown": "videos/0574-X3cqyXz.gif",
        "Seated Cable Row": "videos/0861-fUBheHs.gif",
        "Deadlift": "videos/0043-qXTaZnJ.gif",
        "Face Pulls": "videos/0337-L2V5Nan.gif",
        "Overhead Press": "videos/0025-EIeI8Vf.gif",
        "Lateral Raises": "videos/0178-goJ6ezq.gif",
        "Front Raises": "videos/0978-TFA88iB.gif",
        "Arnold Press": "videos/0337-L2V5Nan.gif",
        "Upright Rows": "videos/0246-cALKspW.gif",
        "Rear Delt Flyes": "videos/0762-nFUwqG6.gif",
        "Bicep Curls": "videos/0575-q6y3OhV.gif",
        "Hammer Curls": "videos/0575-q6y3OhV.gif",
        "Tricep Dips": "videos/0251-9WTm7dq.gif",
        "Skull Crushers": "videos/0060-h8LFzo9.gif",
        "Concentration Curls": "videos/0976-kmVVAfu.gif",
        "Overhead Tricep Extension": "videos/0060-h8LFzo9.gif",
        "Squats": "videos/0043-qXTaZnJ.gif",
        "Lunges": "videos/0054-t8iSghb.gif",
        "Romanian Deadlift": "videos/0043-qXTaZnJ.gif",
        "Leg Press": "videos/0102-oR7O9LW.gif",
        "Calf Raises": "videos/1490-6HmFgmx.gif",
        "Bulgarian Split Squat": "videos/2368-9E25EOx.gif",
        "Glute Bridges": "videos/3561-GibBPPg.gif",
        "Plank": "videos/2135-VBAWRPG.gif",
        "Crunches": "videos/0262-t6Q9YGn.gif",
        "Russian Twists": "videos/0727-EfM77ZF.gif",
        "Leg Raises": "videos/0689-Hgs6Nl1.gif",
        "Mountain Climbers": "videos/0566-7cDmC7G.gif",
        "Ab Wheel": "videos/0103-xnInPfE.gif",
        "V-Ups": "videos/1014-H6ETwO9.gif",
        "Dead Bug": "videos/0262-t6Q9YGn.gif",
        "Burpees": "videos/1160-dK9394r.gif",
        "Jump Rope": "videos/2612-e1e76I2.gif",
        "Box Jumps": "videos/1374-iPm26QU.gif",
        "High Knees": "videos/3636-ealLwvX.gif",
        "Sprint Intervals": "videos/0858-Qoujh3Q.gif",
        "Jumping Jacks": "videos/0501-mr7pkqP.gif",
        "Bear Crawl": "videos/0134-DzAScWx.gif",
        "Tabata Rounds": "videos/1160-dK9394r.gif",
        "EMOM Sets": "videos/1160-dK9394r.gif",
        "Circuit Rounds": "videos/1160-dK9394r.gif",
        "Power Cleans (BW)": "videos/0566-7cDmC7G.gif",
        "Plyometric Sets": "videos/1374-iPm26QU.gif",
        "Cat-Cow Stretch": "videos/3304-MSfvriJ.gif",
        "Downward Dog": "videos/1363-JbC2iaV.gif",
        "Seated Hamstring Stretch": "videos/0493-B1EVP9F.gif",
        "Hip Flexor Stretch": "videos/0054-t8iSghb.gif",
        "Child's Pose": "videos/1363-JbC2iaV.gif",
        "Cobra Stretch": "videos/3662-XPUDTt7.gif",
        "Pigeon Pose": "videos/2202-oMypNrz.gif",
        "Battle Ropes": "videos/2612-e1e76I2.gif",
        "Shuttle Runs": "videos/0858-Qoujh3Q.gif",
        "Jump Lunges": "videos/0054-t8iSghb.gif",
        "Tuck Jumps": "videos/1374-iPm26QU.gif",
        "Shadow Boxing": "videos/2271-hoXt6wv.gif",
        "Agility Ladder Drills": "videos/0858-Qoujh3Q.gif",
        "Cycling Sprints": "videos/0003-1ZFqTDN.gif",
        "Stair Climber": "videos/1490-6HmFgmx.gif",
        "Bench Press": "videos/0025-EIeI8Vf.gif",
        "Barbell Squat": "videos/0043-qXTaZnJ.gif",
        "Weighted Pull-ups": "videos/0841-HMzLjXx.gif",
        "Incline Dumbbell Press": "videos/0319-ESOd5Pl.gif",
        "Hack Squat": "videos/0102-oR7O9LW.gif",
        "Weighted Dips": "videos/0251-9WTm7dq.gif",
        "Barbell Row": "videos/0574-X3cqyXz.gif",
        "Leg Curl": "videos/0689-Hgs6Nl1.gif",
        "Leg Extension": "videos/0689-Hgs6Nl1.gif",
        "Cable Fly": "videos/0308-yz9nUhF.gif"
    ]

    /// Cached lookup: GitHub exercise name → gif_url path
    private var lookup: [String: String] = [:]
    private var isLoaded = false
    private var isLoading = false

    private init() {}

    // MARK: - Public API

    /// Returns a streaming video URL for the given FITNEO exercise name, or nil if unmatched.
    func videoURL(for exerciseName: String) -> URL? {
        // 1. Check hardcoded name overrides FIRST (exact match, no fuzzy)
        if let gifPath = nameOverrides[exerciseName] {
            return URL(string: videoBaseURL + gifPath)
        }

        // 2. Fall through to dataset-based matching
        guard isLoaded else {
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

    private func bestMatch(for fitneoName: String) -> String? {
        let clean = fitneoName
            .lowercased()
            .replacingOccurrences(of: "-", with: " ")
            .replacingOccurrences(of: "(", with: "")
            .replacingOccurrences(of: ")", with: "")
            .trimmingCharacters(in: .whitespaces)

        let words = clean.split(separator: " ")

        if let exact = lookup[clean] { return exact }

        let singular = clean.replacingOccurrences(of: "s ", with: " ")
                           .replacingOccurrences(of: "s", with: "", range: nil)
                           .trimmingCharacters(in: .whitespaces)
        if let s = lookup[singular] { return s }

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

private struct GitHubExercise: Decodable {
    let name: String
    let gif_url: String?
}
