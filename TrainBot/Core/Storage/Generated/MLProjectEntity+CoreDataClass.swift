import Foundation
import CoreData

@objc(MLProjectEntity)
public class MLProjectEntity: NSManagedObject {}

extension MLProjectEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<MLProjectEntity> {
        NSFetchRequest<MLProjectEntity>(entityName: "MLProjectEntity")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var name: String?
    @NSManaged public var createdAt: Date?
    @NSManaged public var updatedAt: Date?
    @NSManaged public var labels: NSSet?
    @NSManaged public var models: NSSet?
}
