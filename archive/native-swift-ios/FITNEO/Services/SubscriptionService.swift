import Foundation
import StoreKit
import Combine

/// Native iOS StoreKit 2 subscription service.
/// Handles product fetching, purchase, verification, restore.
@MainActor
final class SubscriptionService: ObservableObject {
    static let shared = SubscriptionService()

    let productIDs = [
        "com.fitneo.pro.monthly",
        "com.fitneo.pro.yearly",
        "com.fitneo.elite.monthly",
        "com.fitneo.elite.yearly"
    ]

    @Published var products: [Product] = []
    @Published var purchasedProductID: String?

    private var updateListenerTask: Task<Void, Never>?

    private init() {
        updateListenerTask = listenForTransactions()
        Task { await loadProducts() }
    }

    deinit {
        updateListenerTask?.cancel()
    }

    // MARK: - Product loading

    func loadProducts() async {
        do {
            let storeProducts = try await Product.products(for: productIDs)
            products = storeProducts.sorted { $0.price < $1.price }
        } catch {
            print("StoreKit: Failed to load products — \(error.localizedDescription)")
        }
    }

    var proMonthly: Product? { products.first { $0.id == "com.fitneo.pro.monthly" } }
    var proYearly: Product? { products.first { $0.id == "com.fitneo.pro.yearly" } }
    var eliteMonthly: Product? { products.first { $0.id == "com.fitneo.elite.monthly" } }
    var eliteYearly: Product? { products.first { $0.id == "com.fitneo.elite.yearly" } }

    // MARK: - Purchase

    func purchase(_ product: Product) async throws -> Bool {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            if let transaction = try? verification.payloadValue {
                purchasedProductID = transaction.productID
                await transaction.finish()
                return true
            }
            return false
        case .userCancelled:
            return false
        case .pending:
            return false
        @unknown default:
            return false
        }
    }

    // MARK: - Restore

    func restorePurchases() async -> Bool {
        do {
            try await AppStore.sync()
            var restored = false
            for await verification in Transaction.currentEntitlements {
                if let transaction = try? verification.payloadValue {
                    purchasedProductID = transaction.productID
                    restored = true
                }
            }
            return restored
        } catch {
            return false
        }
    }

    // MARK: - Verification

    func verifyActiveSubscription() async -> Bool {
        for await verification in Transaction.currentEntitlements {
            guard let transaction = try? verification.payloadValue else { continue }
            if let expiry = transaction.expirationDate, expiry > Date() {
                purchasedProductID = transaction.productID
                return true
            }
        }
        return false
    }

    var isElite: Bool {
        guard let id = purchasedProductID else { return false }
        return id.contains("elite")
    }

    var isActive: Bool {
        purchasedProductID != nil
    }

    // MARK: - Transaction listener

    private func listenForTransactions() -> Task<Void, Never> {
        Task.detached {
            for await verification in Transaction.updates {
                guard let transaction = try? verification.payloadValue else { continue }
                await MainActor.run {
                    self.purchasedProductID = transaction.productID
                }
                await transaction.finish()
            }
        }
    }
}

// MARK: - Subscription tier model

enum SubscriptionTier: String, Codable, Sendable {
    case free, pro, elite

    var isElite: Bool { self == .elite }
    var isPremium: Bool { self == .pro || self == .elite }
}
