import Foundation
import CoreData

@objc(AchievementEntity)
public class AchievementEntity: NSManagedObject {}

extension AchievementEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<AchievementEntity> {
        NSFetchRequest<AchievementEntity>(entityName: "AchievementEntity")
    }

    @NSManaged public var identifier: String?
    @NSManaged public var unlockedAt: Date?
    @NSManaged public var progress: Int32
}
