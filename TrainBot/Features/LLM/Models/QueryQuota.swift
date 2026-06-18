import Foundation

struct QueryQuota: Decodable {
    let used: Int
    let limit: Int
    let remaining: Int
    let resetsAt: String
}
