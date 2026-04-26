import Foundation
import CoreData

@objc(MLImageEntity)
public class MLImageEntity: NSManagedObject {}

extension MLImageEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<MLImageEntity> {
        NSFetchRequest<MLImageEntity>(entityName: "MLImageEntity")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var filename: String?
    @NSManaged public var createdAt: Date?
    @NSManaged public var label: MLLabelEntity?
}
