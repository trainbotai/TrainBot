import Foundation

enum APIError: Error, LocalizedError {
    case network(URLError)
    case invalidResponse
    case httpError(statusCode: Int, detail: String)
    case decodingFailed(Error)
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .network(let e): return e.localizedDescription
        case .invalidResponse: return "Răspuns invalid de la server."
        case .httpError(_, let detail): return detail
        case .decodingFailed: return "Eroare la procesarea răspunsului."
        case .unauthorized: return "Sesiunea a expirat. Te rog autentifică-te din nou."
        }
    }
}
