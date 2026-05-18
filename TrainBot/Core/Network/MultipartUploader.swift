import Foundation

struct UploadedImageResponse: Decodable {
    let id: String
}

enum MultipartUploader {
    /// Upload a JPEG image to /student/ml/projects/:projectId/labels/:labelId/images
    /// Returns the server-assigned image ID. Idempotent via clientId.
    static func uploadImage(
        projectServerId: String,
        labelServerId: String,
        clientId: String,
        jpegData: Data,
        bearerToken: String
    ) async throws -> UploadedImageResponse {
        let path = "/student/ml/projects/\(projectServerId)/labels/\(labelServerId)/images"
        guard let url = URL(string: APIEndpoint.baseURL + path) else {
            throw APIError.invalidResponse
        }

        let boundary = "TrainBot-\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("Bearer \(bearerToken)", forHTTPHeaderField: "Authorization")
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        // clientId field
        body.appendString("--\(boundary)\r\n")
        body.appendString("Content-Disposition: form-data; name=\"clientId\"\r\n\r\n")
        body.appendString("\(clientId)\r\n")
        // image file field
        body.appendString("--\(boundary)\r\n")
        body.appendString("Content-Disposition: form-data; name=\"image\"; filename=\"\(clientId).jpg\"\r\n")
        body.appendString("Content-Type: image/jpeg\r\n\r\n")
        body.append(jpegData)
        body.appendString("\r\n")
        body.appendString("--\(boundary)--\r\n")

        req.httpBody = body

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch let urlError as URLError {
            throw APIError.network(urlError)
        }

        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let detail = (try? JSONDecoder().decode(ProblemDetail.self, from: data))?.detail
                ?? "Upload eșuat (HTTP \(http.statusCode))"
            if http.statusCode == 401 { throw APIError.unauthorized }
            throw APIError.httpError(statusCode: http.statusCode, detail: detail)
        }

        do {
            return try JSONDecoder().decode(UploadedImageResponse.self, from: data)
        } catch {
            throw APIError.decodingFailed(error)
        }
    }
}

private extension Data {
    mutating func appendString(_ string: String) {
        if let data = string.data(using: .utf8) { append(data) }
    }
}
