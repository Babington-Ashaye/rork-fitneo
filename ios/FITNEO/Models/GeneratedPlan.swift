import Foundation

// MARK: - Generated plan (from AI or local fallback)

struct GeneratedPlan: Codable, Sendable, Identifiable {
    let id: UUID
    let planName: String
    let coachMessage: String
    let weeklyStructure: [PlanWeek]
    let createdAt: Date
    let isSportsPlan: Bool
    let sportName: String?
    let position: String?
    let sportFocus: String?

    init(id: UUID = UUID(), planName: String, coachMessage: String, weeklyStructure: [PlanWeek], createdAt: Date = Date(), isSportsPlan: Bool = false, sportName: String? = nil, position: String? = nil, sportFocus: String? = nil) {
        self.id = id
        self.planName = planName
        self.coachMessage = coachMessage
        self.weeklyStructure = weeklyStructure
        self.createdAt = createdAt
        self.isSportsPlan = isSportsPlan
        self.sportName = sportName
        self.position = position
        self.sportFocus = sportFocus
    }

    var completedWorkoutCount: Int {
        // Count days that aren't rest days — the store tracks actual completions.
        0
    }

    var totalWorkoutDays: Int {
        weeklyStructure.flatMap { $0.days }.filter { $0.programID != nil }.count
    }
}

struct PlanWeek: Codable, Sendable, Identifiable {
    var id: Int { weekNumber }
    let weekNumber: Int
    let theme: String
    let days: [PlanDay]
}

struct PlanDay: Codable, Sendable, Identifiable {
    var id: Int { dayNumber }
    let dayNumber: Int
    let focus: String
    let programID: String?
    let notes: String
}

// MARK: - Sport mode data

struct SportSelection: Codable, Sendable {
    var sport: SportType?
    var level: SportLevel?
    var position: String?
}

enum SportType: String, Codable, CaseIterable, Sendable {
    case soccer, basketball, americanFootball = "american_football", rugby, tennis, boxing, swimming, athletics, cycling, mma

    var title: String {
        switch self {
        case .soccer: "Soccer"
        case .basketball: "Basketball"
        case .americanFootball: "American Football"
        case .rugby: "Rugby"
        case .tennis: "Tennis"
        case .boxing: "Boxing"
        case .swimming: "Swimming"
        case .athletics: "Athletics & Track"
        case .cycling: "Cycling"
        case .mma: "MMA & Combat"
        }
    }

    var icon: String {
        switch self {
        case .soccer: "soccerball"
        case .basketball: "basketball.fill"
        case .americanFootball: "football.fill"
        case .rugby: "rugbyball"
        case .tennis: "tennisball.fill"
        case .boxing: "figure.boxing"
        case .swimming: "figure.pool.swim"
        case .athletics: "figure.track.and.field"
        case .cycling: "bicycle"
        case .mma: "figure.martial.arts"
        }
    }

    var color: String {
        switch self {
        case .soccer: "#22c55e"
        case .basketball: "#f59e0b"
        case .americanFootball: "#a855f7"
        case .rugby: "#ef4444"
        case .tennis: "#84cc16"
        case .boxing: "#f97316"
        case .swimming: "#06b6d4"
        case .athletics: "#3b82f6"
        case .cycling: "#ec4899"
        case .mma: "#64748b"
        }
    }

    var positions: [String] {
        switch self {
        case .soccer: return ["Goalkeeper", "Centre Back", "Full Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Winger", "Striker"]
        case .basketball: return ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"]
        case .americanFootball: return ["Quarterback", "Running Back", "Wide Receiver", "Tight End", "Offensive Lineman", "Defensive Lineman", "Linebacker", "Cornerback", "Safety"]
        case .rugby: return ["Prop", "Hooker", "Lock", "Flanker", "Number 8", "Scrum Half", "Fly Half", "Centre", "Winger", "Full Back"]
        case .tennis: return []
        case .boxing: return ["Lightweight", "Welterweight", "Middleweight", "Heavyweight"]
        case .swimming: return ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley"]
        case .athletics: return ["Sprinter", "Middle Distance", "Long Distance", "Hurdler", "Long Jump / Triple Jump", "Throws"]
        case .cycling: return ["Road", "Mountain Bike", "Track", "BMX"]
        case .mma: return ["Striker Focus", "Grappler Focus", "Wrestler Focus", "All Round"]
        }
    }
}

enum SportLevel: String, Codable, CaseIterable, Sendable {
    case startingOut = "starting_out", averagePlayer = "average_player", seriousCompetitor = "serious_competitor", eliteProfessional = "elite_professional"

    var title: String {
        switch self {
        case .startingOut: "Starting Out"
        case .averagePlayer: "Average Player"
        case .seriousCompetitor: "Serious Competitor"
        case .eliteProfessional: "Elite / Professional"
        }
    }
}

// MARK: - Plan JSON DTOs for API

struct PlanJSONResponse: Codable, Sendable {
    let planName: String
    let coachMessage: String
    let weeklyStructure: [WeekJSON]
    let sportFocus: String?

    enum CodingKeys: String, CodingKey {
        case planName, coachMessage, weeklyStructure, sportFocus
    }
}

struct WeekJSON: Codable, Sendable {
    let weekNumber: Int
    let theme: String
    let days: [DayJSON]
}

struct DayJSON: Codable, Sendable {
    let dayNumber: Int
    let focus: String
    let programID: String?
    let notes: String

    enum CodingKeys: String, CodingKey {
        case dayNumber, focus, programID = "programID", notes
    }
}
