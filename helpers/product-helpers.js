var db=require('../config/connection')
var collectionNames=require('../config/collections')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId
module.exports={
    addProduct:(product,callback)=>{
        db.get().collection('product').insertOne(product).then((data)=>{
            console.log(data.insertedId)
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collectionNames.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collectionNames.PRODUCT_COLLECTION).deleteOne({_id:objectId(productId)}).then((response)=>{
                console.log(response)
                resolve(resolve)
            })
        })

    },
    getProductDetails:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collectionNames.PRODUCT_COLLECTION).findOne({_id:objectId(productId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(productId,productDetails)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collectionNames.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)},{
                $set:{
                    name:productDetails.name,
                    price:productDetails.price,
                    description:productDetails.description,
                    category:productDetails.category
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collectionNames.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUser:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collectionNames.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                $set:{
                   isBlocked:true
                }
            }).then((response)=>{
                    db.get().collection(collectionNames.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{
                        resolve(user)
                    })
                })
        })
    },
    unblockUser:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collectionNames.USER_COLLECTION).updateOne({_id:objectId(userId)},{
                $set:{
                   isBlocked:false
                }
            }).then((response)=>{
                    db.get().collection(collectionNames.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{
                        resolve(user)
                    })
                })
        })
    }

}