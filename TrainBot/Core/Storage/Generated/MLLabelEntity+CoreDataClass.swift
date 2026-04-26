import Foundation
import CoreData

@objc(MLLabelEntity)
public class MLLabelEntity: NSManagedObject {}

extension MLLabelEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<MLLabelEntity> {
        NSFetchRequest<MLLabelEntity>(entityName: "MLLabelEntity")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var name: String?
    @NSManaged public var project: MLProjectEntity?
    @NSManaged public var images: NSSet?
}
