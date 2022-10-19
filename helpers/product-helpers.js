var db=require('../config/connection')
var collectionNames=require('../config/collections')
const { response } = require('../app')
var objectId=require('mongodb').ObjectId
module.exports={


 

 /*===================================== P R P D U C T S ===================================*/


    addProduct:(product,callback)=>{
        db.get().collection(collectionNames.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
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
    getProductByCategory:(categoryName)=>{
        return new Promise((resolve,reject)=>{
           let products= db.get().collection(collectionNames.PRODUCT_COLLECTION).find({category:categoryName}).toArray()
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



    /*===================================== C A T E G O R I E S ===================================*/

    addCategory:(category,callback)=>{
        db.get().collection(collectionNames.CATEGORY_COLLECTION).insertOne(category).then((data)=>{
            callback(data.insertedId+'Category id')
        })
    },
    deleteCategory:(categoryId)=>{
        return new Promise(async(resolve,reject)=>{
          await db.get().collection(collectionNames.CATEGORY_COLLECTION).findOne({_id:objectId(categoryId)}).then(async(category)=>{
                let categoryName=category.name
                let productsWithThisCategory= await db.get().collection(collectionNames.PRODUCT_COLLECTION).find({category:categoryName}).toArray()
                let resolveObject={category:categoryName}
                console.log(productsWithThisCategory)
                if(productsWithThisCategory.length>0){
                    resolveObject.products=productsWithThisCategory;
                    resolveObject.DeleteStatus=false;
                    resolve(resolveObject)
                }
                else{

                   await db.get().collection(collectionNames.CATEGORY_COLLECTION).deleteOne({_id:objectId(categoryId)}).then((response)=>{
                        resolveObject.DeleteStatus=true
                    resolve(resolveObject)
                    })       
                }

            })
        })
    },
    getAllCategories:()=>{
        return new Promise(async(resolve,reject)=>{
            let categories=await db.get().collection(collectionNames.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })

    },
    getCategoryDetails:(categoryId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collectionNames.CATEGORY_COLLECTION).findOne({_id:objectId(categoryId)}).then((category)=>{
                resolve(category)
            })
        })
    },
    updateCategory:(categoryId,categoryDetails)=>{
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collectionNames.PRODUCT_COLLECTION).updateMany({category:categoryDetails.originalCategory},{
            
                $set:{
                    category:categoryDetails.name /*==========BUGggggggggg================ description is not updated?*/
                }

            }).then(()=>{
                db.get().collection(collectionNames.CATEGORY_COLLECTION).updateOne({_id:objectId(categoryId)},{
                    $set:{
                        name:categoryDetails.name,
                        description:categoryDetails.description,
                    }
                })
            }).then(()=>{
                resolve()
            })
        })
    },
/*===================================B A N N E R S=============================================*/

 addBanner:(banner,callback)=>{
        db.get().collection(collectionNames.BANNER_COLLECTION).insertOne(banner).then((data)=>{
            console.log(data.insertedId)
            callback(data.insertedId)
        }
        )


    },


 /*===================================== U S E R S ===================================*/

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
    },
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders= await db.get().collection(collectionNames.ORDER_COLLLECTION).find().toArray()
            resolve(orders)
        })
       
    },
    changeOrderStatus:(status,orderID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collectionNames.ORDER_COLLLECTION).updateOne({_id:objectId(orderID)},{
                $set:{status:status}
            })
            resolve()
        })
    }
    

}