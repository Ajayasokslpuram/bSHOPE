var db = require('../config/connection')
var collectionNames = require('../config/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId
module.exports = {




    /*===================================== P R P D U C T S ===================================*/


    addProduct: (product, callback) => {
        db.get().collection(collectionNames.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            console.log(data.insertedId)
            callback(data.insertedId)
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collectionNames.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    getProductByCategory: (categoryName) => {
        return new Promise((resolve, reject) => {
            let products = db.get().collection(collectionNames.PRODUCT_COLLECTION).find({ category: categoryName }).toArray()
            resolve(products)
        })
    },

    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collectionNames.PRODUCT_COLLECTION).deleteOne({ _id: objectId(productId) }).then((response) => {
                console.log(response)
                resolve(resolve)
            })
        })

    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collectionNames.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (productId, productDetails) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collectionNames.PRODUCT_COLLECTION).updateOne({ _id: objectId(productId) }, {
                $set: {
                    name: productDetails.name,
                    price: productDetails.price,
                    description: productDetails.description,
                    category: productDetails.category
                }
            }).then((response) => {
                resolve()
            })
        })
    },



    /*===================================== C A T E G O R I E S ===================================*/

    addCategory: (category, callback) => {
        db.get().collection(collectionNames.CATEGORY_COLLECTION).insertOne(category).then((data) => {
            callback(data.insertedId + 'Category id')
        })
    },
    deleteCategory: (categoryId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collectionNames.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) }).then(async (category) => {
                let categoryName = category.name
                let productsWithThisCategory = await db.get().collection(collectionNames.PRODUCT_COLLECTION).find({ category: categoryName }).toArray()
                let resolveObject = { category: categoryName }
                console.log(productsWithThisCategory)
                if (productsWithThisCategory.length > 0) {
                    resolveObject.products = productsWithThisCategory;
                    resolveObject.DeleteStatus = false;
                    resolve(resolveObject)
                }
                else {

                    await db.get().collection(collectionNames.CATEGORY_COLLECTION).deleteOne({ _id: objectId(categoryId) }).then((response) => {
                        resolveObject.DeleteStatus = true
                        resolve(resolveObject)
                    })
                }

            })
        })
    },
    getAllCategories: () => {
        return new Promise(async (resolve, reject) => {
            let categories = await db.get().collection(collectionNames.CATEGORY_COLLECTION).find().toArray()
            resolve(categories)
        })

    },
    getCategoryDetails: (categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collectionNames.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) }).then((category) => {
                resolve(category)
            })
        })
    },
    updateCategory: (categoryId, categoryDetails) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collectionNames.PRODUCT_COLLECTION).updateMany({ category: categoryDetails.originalCategory }, {

                $set: {
                    category: categoryDetails.name /*==========BUGggggggggg================ description is not updated?*/
                }

            }).then(() => {
                db.get().collection(collectionNames.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoryId) }, {
                    $set: {
                        name: categoryDetails.name,
                        description: categoryDetails.description,
                    }
                })
            }).then(() => {
                resolve()
            })
        })
    },
    /*===================================B A N N E R S=============================================*/

    addBanner: (banner, callback) => {
        db.get().collection(collectionNames.BANNER_COLLECTION).insertOne(banner).then((data) => {
            console.log(data.insertedId)
            callback(data.insertedId)
        }
        )


    },


    /*===================================== U S E R S ===================================*/

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collectionNames.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collectionNames.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    isBlocked: true
                }
            }).then((response) => {
                db.get().collection(collectionNames.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                    resolve(user)
                })
            })
        })
    },
    unblockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collectionNames.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    isBlocked: false
                }
            }).then((response) => {
                db.get().collection(collectionNames.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                    resolve(user)
                })
            })
        })
    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collectionNames.ORDER_COLLLECTION).find().sort({ _id: -1 }).toArray()
            resolve(orders)
        })

    },
    changeOrderStatus: (status, orderID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collectionNames.ORDER_COLLLECTION).updateOne({ _id: objectId(orderID) }, {
                $set: { status: status }
            })
            resolve()
        })
    },
    getInsights: () => {
        return new Promise(async (resolve, reject) => {
            let placed = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: { status: "Placed" }
            },
            {
                $group:
                    { _id: { month: { $month: { $toDate: "$date" } } }, count: { $sum: 1 } }
            }]).toArray()

            let delivered = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: { status: "Delivered" }
            },
            {
                $group:
                    { _id: { month: { $month: { $toDate: "$date" } } }, count: { $sum: 1 } }
            }]).toArray()

            let canceled = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: { status: "Canceled" }
            },
            {
                $group:
                    { _id: { month: { $month: { $toDate: "$date" } } }, count: { $sum: 1 } }
            }]).toArray()





            placedCount = placed[0].count
            deliveredCount = delivered[0].count
            canceledCount = canceled[0].count
            month = placed[0]._id.month

            let resolveObject = {}
            resolveObject.barData = [placedCount, deliveredCount, canceledCount]


            let totalAamount = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([
                {
                    $group: {
                        _id: {
                            month: {
                                $month: { $toDate: "$date" }
                            },
                            year: {
                                $year: { $toDate: "$date" }
                            }
                        },
                        total: {
                            $sum: "$productsNetAmount"
                        },

                    }
                },

            ]).toArray()


            resolveObject.total = totalAamount[0].total




            let codTotal = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: { paymentMethod: "COD" }
            },
            {
                $group: {
                    _id: {
                        month: {
                            $month: { $toDate: "$date" }
                        },
                        year: {
                            $year: { $toDate: "$date" }
                        }
                    },
                    total: {
                        $sum: "$productsNetAmount"
                    },

                }
            },

            ]).toArray()

            console.log(codTotal)
            resolveObject.codTotal = codTotal[0].total
            let payPalTotal = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: { paymentMethod: "paypal" }
            },
            {
                $group: {
                    _id: {
                        month: {
                            $month: { $toDate: "$date" }
                        },
                        year: {
                            $year: { $toDate: "$date" }
                        }
                    },
                    total: {
                        $sum: "$productsNetAmount"
                    },

                }
            },

            ]).toArray()

            resolveObject.payPalTotal = payPalTotal[0].total

            let razorPayTotal = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: { paymentMethod: "razorpay" }
            },
            {
                $group: {
                    _id: {
                        month: {
                            $month: { $toDate: "$date" }
                        },
                        year: {
                            $year: { $toDate: "$date" }
                        }
                    },
                    total: {
                        $sum: "$productsNetAmount"
                    },

                }
            },

            ]).toArray()

            resolveObject.razorPayTotal = razorPayTotal[0].total

            let monthSales = await db.get().collection(collectionNames.ORDER_COLLLECTION).find({
                $where: function () {
                    var currentDate = new Date();
                    var lastMonthDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));

                    return this.createdOn.getFullYear() === lastMonthDate.getFullYear()
                        && this.createdOn.getMonth() === lastMonthDate.getMonth();
                }
            }).toArray()
            console.log(monthSales, 'monthsales')

            resolveObject.monthSales = monthSales
            resolve(resolveObject)
        })

    },

    // coupons
    createCoupons: (couponData) => {
        return new Promise(async (resolve, reject) => {
            let couponObj = {}
            var addDays = function (str, days) {
                var myDate = new Date(str);
                myDate.setDate(myDate.getDate() + parseInt(days));
                return myDate;
            }
            couponObj.expiry = addDays(new Date(), couponData.expiry)
            couponObj.coupon = couponData.couponCode;
            couponObj.discount = parseInt(couponData.discount)
            console.log(couponObj)

            await db.get().collection(collectionNames.COUPON_COLLECTION).createIndex({ "expiry": 1 }, { expireAfterSeconds: 0 })
            await db.get().collection(collectionNames.COUPON_COLLECTION).insertOne(couponObj).then((data) => {
                resolve(data)
            })
        })
    },
    createCategoryOffer: (offerData) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collectionNames.OFFER_COLLECTION).insertOne(offerData).then((data) => {
                resolve(data)
            })
        })
    },
    applyCategoryOffer: (offerID) => {
        return new Promise(async (resolve, reject) => {
            let offer = await db.get().collection(collectionNames.OFFER_COLLECTION).findOne({ _id: objectId(offerID) })

            // applying offer to category
            await db.get().collection(collectionNames.PRODUCT_COLLECTION).update({ category: offer.category }, [{
                $set: {
                    price: {
                        $floor: {
                            $subtract: [
                                "$MRP",
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                "$MRP",
                                                100
                                            ]
                                        },
                                        offer.discount
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
            ], { multi: true }).then((data) => {
                console.log(data, "updated")
               
            }).catch((err) => {
                console.log(err)
            })
           await db.get().collection(collectionNames.OFFER_COLLECTION).updateOne({_id:objectId(offerID)},{
                $set:{offerApplied:true}
            })
            resolve()
        })
    },
    getCategoryOffers: () => {
        return new Promise(async (resolve, reject) => {
            let offers = await db.get().collection(collectionNames.OFFER_COLLECTION).find({offerType:"category"}).toArray()
            resolve(offers)
        })
    },
    removeCategoryOffer: (offerID) => {
        return new Promise(async (resolve, reject) => {

            let offer = await db.get().collection(collectionNames.OFFER_COLLECTION).findOne({ _id: objectId(offerID) })

            // reversing Product Price
            await db.get().collection(collectionNames.PRODUCT_COLLECTION).update({ category: offer.category }, [{
                $set: {
                    price: {
                        $ceil: {
                            $add: [
                                "$price",
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                "$MRP",
                                                100
                                            ]
                                        },
                                        offer.discount
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
            ], { multi: true }).then((data) => {
                console.log(data, "updated")
            }).catch((err) => {
                console.log(err)
            })

            await db.get().collection(collectionNames.OFFER_COLLECTION).deleteOne({_id:objectId(offerID)})

            resolve()
        })
    },
    createProductOffer:(offerData)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collectionNames.OFFER_COLLECTION).insertOne(offerData).then(()=>{
                resolve()
            })
        })
    },
    getProductOffers:()=>{
        return new Promise(async(resolve,reject)=>{
         let offers=await   db.get().collection(collectionNames.OFFER_COLLECTION).find({offerType:"product"}).toArray()
         resolve(offers)
        })
    },
    applyProductOffer:(offerID,productID)=>{
        console.log(offerID,productID,'helpers')
        return new Promise(async(resolve,reject)=>{
           let offer=await db.get().collection(collectionNames.OFFER_COLLECTION).findOne({_id:objectId(offerID)})
           let product=await db.get().collection(collectionNames.PRODUCT_COLLECTION).findOne({_id:objectId(productID)})
            let offerPrice=Math.floor((product.MRP/100)*offer.discount)
            console.log(offerPrice,'offerPrice')
            await db.get().collection(collectionNames.PRODUCT_COLLECTION).updateOne({_id:objectId(productID)},{
                $set:{
                    price:product.MRP
                }
            }).then((data)=>{
                console.log(data)
            })
           await db.get().collection(collectionNames.PRODUCT_COLLECTION).updateOne({_id:objectId(productID)},{
                $inc:{
                    price:-offerPrice
                }
            }).then((data)=>{
                console.log(data)
            })
            resolve()
        })
    },
    removeProductOffer:(productID)=>{
        return new Promise(async(resolve,reject)=>{
            let product=await db.get().collection(collectionNames.PRODUCT_COLLECTION).findOne({_id:objectId(productID)})
            db.get().collection(collectionNames.PRODUCT_COLLECTION).updateOne({_id:objectId(productID)},{
                $set:{
                    price:product.MRP
                }
            })
            resolve()
        })
    }


}