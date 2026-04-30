import Foundation

final class APIClient {
    static let shared = APIClient()
    private let session = URLSession.shared

    func request<T: Decodable>(_ endpoint: APIEndpoint, bearerToken: String? = nil) async throws -> T {
        var req: URLRequest
        do { req = try endpoint.urlRequest() }
        catch { throw APIError.invalidResponse }

        if let token = bearerToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: req)
        } catch let urlError as URLError {
            throw APIError.network(urlError)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200..<300).contains(http.statusCode) else {
            let detail = (try? JSONDecoder().decode(ProblemDetail.self, from: data))?.detail
                ?? "Eroare \(http.statusCode)"
            if http.statusCode == 401 { throw APIError.unauthorized }
            throw APIError.httpError(statusCode: http.statusCode, detail: detail)
        }

        let decodeData = data.isEmpty ? Data("{}".utf8) : data
        do {
            return try JSONDecoder().decode(T.self, from: decodeData)
        } catch {
            throw APIError.decodingFailed(error)
        }
    }
}
