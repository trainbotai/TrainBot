import Foundation
import CoreData

@objc(DailyChallengeEntity)
public class DailyChallengeEntity: NSManagedObject {}

extension DailyChallengeEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<DailyChallengeEntity> {
        NSFetchRequest<DailyChallengeEntity>(entityName: "DailyChallengeEntity")
    }

    @NSManaged public var dateKey: String?
    @NSManaged public var descriptionText: String?
    @NSManaged public var goal: Int32
    @NSManaged public var progress: Int32
    @NSManaged public var completed: Bool
}
