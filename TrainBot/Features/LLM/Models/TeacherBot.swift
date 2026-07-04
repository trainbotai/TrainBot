import Foundation

struct TeacherBot: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let teacherName: String
}

struct TeacherBotListResponse: Decodable {
    let bots: [TeacherBot]
}
