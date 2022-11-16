var db = require('../config/connection')
var collectionNames = require('../config/collections')
const { response } = require('../app')
const { order } = require('paypal-rest-sdk')
var objectId = require('mongodb').ObjectId
module.exports = {




    /*===================================== P R P D U C T S ===================================*/


    addProduct: (product, callback) => {
        db.get().collection(collectionNames.PRODUCT_COLLECTION).insertOne(product).then((data) => {
            console.log(data.insertedId)
            callback(data.insertedId)
        })
    },
    getPaginatedProducts: (skip, limit) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collectionNames.PRODUCT_COLLECTION).find().skip(skip).limit(limit).toArray()
            resolve(products)
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
                    quantity: productDetails.quantity,
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

    addCategory: (category) => {
        return new Promise(async (resolve, reject) => {
            let dupeCat = await db.get().collection(collectionNames.CATEGORY_COLLECTION).findOne({ name: { $regex: category.name, $options: "$i" } })
            if (dupeCat) {
                console.log(dupeCat)
                reject(dupeCat)
            }
            else {
                db.get().collection(collectionNames.CATEGORY_COLLECTION).insertOne(category).then(() => {

                })
                resolve()
            }

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
    getProductCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collectionNames.PRODUCT_COLLECTION).countDocuments()
            resolve(count)
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

    addBanner: (bannerData) => {
        bannerData.isActive = false;
        return new Promise(async (resolve, reject) => {
            db.get().collection(collectionNames.BANNER_COLLECTION).insertOne(bannerData).then((data) => {
                resolve(data)
            })
        })
    },
    getAllBanners: () => {
        return new Promise(async (resolve, reject) => {
            let banners = await db.get().collection(collectionNames.BANNER_COLLECTION).find().toArray()
            resolve(banners)
        })
    },
    setBanner: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collectionNames.BANNER_COLLECTION).updateMany({}, {
                $set: { isActive: false }
            }, { multi: true })
            await db.get().collection(collectionNames.BANNER_COLLECTION).updateOne({ _id: objectId(id) }, {
                $set: { isActive: true }
            })
            resolve()
        })

    },
    getActiveBanner: () => {
        return new Promise(async (resolve, reject) => {
            banner = await db.get().collection(collectionNames.BANNER_COLLECTION).find({ isActive: true }).toArray()
            resolve(banner[0])
        })
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
            let orders = await db.get().collection(collectionNames.ORDER_COLLLECTION).find().toArray()
            orders=orders.reverse()
            resolve(orders)
        })

    },
    getPaginatedOrders: (limit, skip) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collectionNames.ORDER_COLLLECTION).find().skip(skip).limit(limit).toArray()
            // let slicedOrders=orders.slice
            resolve(orders)
        })
    },
    getOrderCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collectionNames.ORDER_COLLLECTION).countDocuments()
            resolve(count)
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
                $match: {
                    $expr: {
                        $and: [
                            {
                                "$eq": [
                                    {
                                        $month: { $toDate: "$date" }
                                    },
                                    {
                                        $month: {
                                            $dateAdd: {
                                                startDate: new Date(),
                                                unit: "month",
                                                amount: 0
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "$eq": [
                                    "$status", 'Placed'
                                ]
                            },
                        ]
                    }
                }
            },
            {
                $group:
                    { _id: { month: { $month: { $toDate: "$date" } } }, count: { $sum: 1 } }
            }]).toArray()

            let delivered = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: {
                    $expr: {
                        $and: [
                            {
                                "$eq": [
                                    {
                                        $month: { $toDate: "$date" }
                                    },
                                    {
                                        $month: {
                                            $dateAdd: {
                                                startDate: new Date(),
                                                unit: "month",
                                                amount: 0
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "$eq": [
                                    "$status", 'Delivered'
                                ]
                            },
                        ]
                    }
                }
            },
            {
                $group:
                    { _id: { month: { $month: { $toDate: "$date" } } }, count: { $sum: 1 } }
            }]).toArray()

            let canceled = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: {
                    $expr: {
                        $and: [
                            {
                                "$eq": [
                                    {
                                        $month: { $toDate: "$date" }
                                    },
                                    {
                                        $month: {
                                            $dateAdd: {
                                                startDate: new Date(),
                                                unit: "month",
                                                amount: 0
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "$eq": [
                                    "$status", 'Canceled'
                                ]
                            },
                        ]
                    }
                }
            },
            {
                $group:
                    { _id: { month: { $month: { $toDate: "$date" } } }, count: { $sum: 1 } }
            }]).toArray()





            if (placed.length >= 1) {
                placedCount = placed[0].count

            } else {
                placedCount = 0

            }
            if (delivered.length >= 1) {
                deliveredCount = delivered[0].count

            }
            else {
                deliveredCount = 0;
            }
            if (canceled.length >= 1) {
                canceledCount = canceled[0].count
            }
            else {
                canceledCount = 0
            }

            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            date = new Date()
            let month = months[date.getMonth()]


            let resolveObject = {}
            resolveObject.barData = [placedCount, deliveredCount, canceledCount]
            resolveObject.month = month


            let totalAamount = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: {
                    $expr: {
                        $and: [
                            {
                                "$eq": [
                                    {
                                        $month: { $toDate: "$date" }
                                    },
                                    {
                                        $month: {
                                            $dateAdd: {
                                                startDate: new Date(),
                                                unit: "month",
                                                amount: 0
                                            }
                                        }
                                    }
                                ]
                            },
                        ]
                    }
                }
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


            resolveObject.total = totalAamount[0].total




            let codTotal = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: {
                    $expr: {
                        $and: [
                            {
                                "$eq": [
                                    {
                                        $month: { $toDate: "$date" }
                                    },
                                    {
                                        $month: {
                                            $dateAdd: {
                                                startDate: new Date(),
                                                unit: "month",
                                                amount: 0
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "$eq": [
                                    "$paymentMethod", 'COD'
                                ]
                            },
                        ]
                    }
                }
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
            console.log(codTotal, 'cod');
            resolveObject.codTotal = codTotal[0].total

            let walletTotal = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: {
                    $expr: {
                        $and: [
                            {
                                "$eq": [
                                    {
                                        $month: { $toDate: "$date" }
                                    },
                                    {
                                        $month: {
                                            $dateAdd: {
                                                startDate: new Date(),
                                                unit: "month",
                                                amount: 0
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "$eq": [
                                    "$paymentMethod", 'wallet'
                                ]
                            },
                        ]
                    }
                }
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

            resolveObject.walletTotal = walletTotal[0].total

            let payPalTotal = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([{
                $match: {
                    $expr: {
                        $and: [
                            {
                                "$eq": [
                                    {
                                        $month: { $toDate: "$date" }
                                    },
                                    {
                                        $month: {
                                            $dateAdd: {
                                                startDate: new Date(),
                                                unit: "month",
                                                amount: 0
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "$eq": [
                                    "$paymentMethod", 'paypal'
                                ]
                            },
                        ]
                    }
                }
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
                $match: {
                    $expr: {
                        $and: [
                            {
                                "$eq": [
                                    {
                                        $month: { $toDate: "$date" }
                                    },
                                    {
                                        $month: {
                                            $dateAdd: {
                                                startDate: new Date(),
                                                unit: "month",
                                                amount: 0
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                "$eq": [
                                    "$paymentMethod", 'razorpay'
                                ]
                            },
                        ]
                    }
                }
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
            resolveObject.monthSales = monthSales.reverse()
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
    getAllCoupons: (limit) => {
        return new Promise(async (resolve, reject) => {
            let coupons = await db.get().collection(collectionNames.COUPON_COLLECTION).find().limit(limit).toArray()
            if (coupons) {
                resolve(coupons)
            }
            else {
                reject()
            }

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

            await db.get().collection(collectionNames.PRODUCT_COLLECTION).update({ category: offer.category }, [{
                $set: {
                    price: "$MRP"
                }
            }
            ], { multi: true }).then((data) => {
                console.log(data, "updated")
            }).catch((err) => {
                console.log(err)
            })
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
            await db.get().collection(collectionNames.OFFER_COLLECTION).updateOne({ _id: objectId(offerID) }, {
                $set: { offerApplied: true }
            })
            resolve()
        })
    },
    getCategoryOffers: () => {
        return new Promise(async (resolve, reject) => {
            let offers = await db.get().collection(collectionNames.OFFER_COLLECTION).find({ offerType: "category" }).toArray()
            resolve(offers)
        })
    },
    removeCategoryOffer: (offerID) => {
        return new Promise(async (resolve, reject) => {

            let offer = await db.get().collection(collectionNames.OFFER_COLLECTION).findOne({ _id: objectId(offerID) })

            // reversing Product Price
            await db.get().collection(collectionNames.PRODUCT_COLLECTION).update({ category: offer.category }, [{
                $set: {
                    price: "$MRP"
                }
            }
            ], { multi: true }).then((data) => {
                console.log(data, "updated")
            }).catch((err) => {
                console.log(err)
            })

            await db.get().collection(collectionNames.OFFER_COLLECTION).deleteOne({ _id: objectId(offerID) })

            resolve()
        })
    },
    createProductOffer: (offerData) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collectionNames.OFFER_COLLECTION).insertOne(offerData).then(() => {
                resolve()
            })
        })
    },
    getProductOffers: () => {
        return new Promise(async (resolve, reject) => {
            let offers = await db.get().collection(collectionNames.OFFER_COLLECTION).find({ offerType: "product" }).toArray()
            resolve(offers)
        })
    },
    applyProductOffer: (offerID, productID) => {
        console.log(offerID, productID, 'helpers')
        return new Promise(async (resolve, reject) => {
            let offer = await db.get().collection(collectionNames.OFFER_COLLECTION).findOne({ _id: objectId(offerID) })
            let product = await db.get().collection(collectionNames.PRODUCT_COLLECTION).findOne({ _id: objectId(productID) })
            let offerPrice = Math.floor((product.MRP / 100) * offer.discount)
            console.log(offerPrice, 'offerPrice')
            await db.get().collection(collectionNames.PRODUCT_COLLECTION).updateOne({ _id: objectId(productID) }, {
                $set: {
                    price: product.MRP
                }
            }).then((data) => {
                console.log(data)
            })
            await db.get().collection(collectionNames.PRODUCT_COLLECTION).updateOne({ _id: objectId(productID) }, {
                $inc: {
                    price: -offerPrice
                }
            }).then((data) => {
                console.log(data)
            })
            resolve()
        })
    },
    removeProductOffer: (productID) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collectionNames.PRODUCT_COLLECTION).findOne({ _id: objectId(productID) })
            db.get().collection(collectionNames.PRODUCT_COLLECTION).updateOne({ _id: objectId(productID) }, {
                $set: {
                    price: product.MRP
                }
            })
            resolve()
        })
    },
    getProductQuantity: (details) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collectionNames.PRODUCT_COLLECTION).findOne({ _id: objectId(details.product) })
            let availableQty = product.quantity
            resolve(availableQty)
        })
    }


}