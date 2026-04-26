import Foundation
import CoreData

@objc(MLModelEntity)
public class MLModelEntity: NSManagedObject {}

extension MLModelEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<MLModelEntity> {
        NSFetchRequest<MLModelEntity>(entityName: "MLModelEntity")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var version: Int32
    @NSManaged public var accuracy: Double
    @NSManaged public var filename: String?
    @NSManaged public var createdAt: Date?
    @NSManaged public var project: MLProjectEntity?
}
