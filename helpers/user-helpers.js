var db = require('../config/connection')
var collectionNames = require('../config/collections')
const bcrypt = require('bcrypt')
const { PRODUCT_COLLECTION } = require('../config/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const { resolve } = require('path')
var moment = require('moment');
var instance = new Razorpay({
    key_id: 'rzp_test_lq7gcttbZU8BHG',
    key_secret: 'Mn0WRR8jVHNsshE4GpBAxHrM'
})

const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser')
module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {

            let userWithMobile = await db.get().collection(collectionNames.USER_COLLECTION).find({ mobile: userData.mobile }).toArray()
            let userWithEmail = await db.get().collection(collectionNames.USER_COLLECTION).find({ email: userData.email }).toArray()
            if (userWithEmail.length > 0 || userWithMobile.length > 0) {
                console.log(userWithEmail)
                console.log(userWithMobile)
                reject()
            }
            userData.address=['sample Address']
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collectionNames.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })
        })

    },

    changePassword: (data) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collectionNames.USER_COLLECTION).findOne({ email: data.email })
            bcrypt, bcrypt.compare(data.currentPassword, user.password).then(async (status) => {
                if (status) {
                    newPassword = await bcrypt.hash(data.newPassword, 10)
                    db.get().collection(collectionNames.USER_COLLECTION).updateOne({ email: data.email }, {
                        $set: { password: newPassword }
                    })
                    resolve()
                }
                else {
                    reject()
                }
            })

        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            console.log(userData.email)
            let user = await db.get().collection(collectionNames.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt, bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.emailStatus = true;
                        response.passStatus = true;
                        if (user.isBlocked == false) {
                            console.log("Login Success")
                            response.blockStatus = true;
                            resolve(response)
                        }
                        else {
                            console.log("user Blocked")
                            response.blockStatus = false;
                            resolve(response)
                        }
                    }
                    else {
                        console.log("Password not matched")
                        response.passStatus = false;
                        resolve(response)

                    }
                })
            }
            else {
                response.emailStatus = false;
                console.log('User not matched')
                resolve(response)
            }
        })
    },

    checkMobileNumber: (mobile) => {
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collectionNames.USER_COLLECTION).findOne({ mobile: mobile }).then((data) => {
                resolve(data)
                console.log(data)
            }).catch(() => {
                reject()
            })
        })

        //=====================WISH LIST===================================
    },
    addToWishlist: (productId, userId) => {
        let productObject = {
            item: objectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userWishlist = await db.get().collection(collectionNames.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (userWishlist) {
                let productExists = userWishlist.products.findIndex(products => products.item == productId)
                console.log('proExxist')
                console.log(productExists);
                if (productExists != -1) {
                    db.get().collection(collectionNames.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(productId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collectionNames.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) }, {

                            $push: { products: productObject }

                        }).then((response) => {
                            resolve(response)
                        })
                }

            }
            else {
                let wishlistObject = {
                    user: objectId(userId),
                    products: [productObject]
                }
                db.get().collection(collectionNames.WISHLIST_COLLECTION).insertOne(wishlistObject).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishListItems = await db.get().collection(collectionNames.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collectionNames.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }


            ]).toArray()
            resolve(wishListItems)
            console.log('reaxhed here')
            console.log(wishListItems)
        })
    },
    deleteFromWishlist: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collectionNames.WISHLIST_COLLECTION).updateOne({ _id: objectId(details.wishlist) }, {
                $pull: { products: { item: objectId(details.product) } }
            }).then(() => {
                resolve() // response of deleting cart Item
            })
        })
    },




    //===============================CART====================

    addToCart: (productId, userId) => {
        let productObject = {
            item: objectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collectionNames.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let productExists = userCart.products.findIndex(products => products.item == productId)
                console.log('proExxist')
                console.log(productExists);
                if (productExists != -1) {
                    db.get().collection(collectionNames.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(productId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collectionNames.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) }, {

                            $push: { products: productObject }

                        }).then((response) => {
                            resolve(response)
                        })
                }

            }
            else {
                let cartObject = {
                    user: objectId(userId),
                    products: [productObject]
                }
                db.get().collection(collectionNames.CART_COLLECTION).insertOne(cartObject).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collectionNames.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collectionNames.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }


            ]).toArray()
            resolve(cartItems)
        })
    },
    changeProductQuantity: (details) => {
        count = parseInt(details.count);
        return new Promise((resolve, reject) => {
            db.get().collection(collectionNames.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                    {
                        $set: { 'products.$.quantity': count }
                    }).then((response) => {
                        resolve({ status: true })
                    })
        })
    },
    deleteFromCart: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collectionNames.CART_COLLECTION).updateOne({ _id: objectId(details.cart) }, {
                $pull: { products: { item: objectId(details.product) } }
            }).then(() => {
                resolve() // response of deleting cart Item
            })
        })
    },
    getTotalAmount: (userID) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collectionNames.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userID) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collectionNames.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }


            ]).toArray()
            resolve(total[0].total);

        })

    },
    placeOrder: (order,address, products, productsNetAmount) => {
        return new Promise((resolve, reject) => {
            console.log(order,address, products, productsNetAmount,'parameters')
            let status = order.selector === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    name:address.fname+' '+address.lname,
                    mobile: address.mobile,
                    email: address.email,
                    address: address.address1 + ',' + address.address2,
                    town: address.town,
                    zip: address.zip,
                },
                userID: objectId(order.userID),
                paymentMethod: order.selector,
                products: products,
                productsNetAmount: productsNetAmount,
                status: status,
                date: moment().format('Do MMM  YY, hh:mm a')
            }

            db.get().collection(collectionNames.ORDER_COLLLECTION).insertOne(orderObj).then((response) => {
                resolve(response.insertedId)
                db.get().collection(collectionNames.CART_COLLECTION).deleteOne({ user: objectId(order.userID) }) //deleting product from cart after order
            })
        })
    },
    getCartProductList: (userID) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collectionNames.CART_COLLECTION).findOne({ user: objectId(userID) })
            resolve(cart.products)
        })
    },
    generateRazorpay: (orderID, productsNetAmount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: productsNetAmount * 100, //amount is in paise
                currency: "INR",
                receipt: "" + orderID
            };
            instance.orders.create(options, function (err, order) {
                console.log(order)
                resolve(order)
            })
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            console.log('reached verify payment')
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'Mn0WRR8jVHNsshE4GpBAxHrM')

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
                console.log('resolved verify payment')
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderID) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collectionNames.ORDER_COLLLECTION)
                .updateOne({ _id: objectId(orderID) }, {
                    $set: {
                        status: 'Placed'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    getUserOrders: (userID) => {
        return new Promise(async (resolve, reject) => {
            console.log(userID);
            let orders = await db.get().collection(collectionNames.ORDER_COLLLECTION)
                .find({ userID: objectId(userID) }).toArray()
            console.log(orders);
            resolve(orders)


        })
    },
    getOrderProducts: (orderID) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collectionNames.ORDER_COLLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderID) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collectionNames.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }


            ]).toArray()
            resolve(orderItems)
        })
    },
    getOrderStatus:(orderID)=>{
        return new Promise(async(resolve,reject)=>{
         let order= await  db.get().collection(collectionNames.ORDER_COLLLECTION).findOne({_id:objectId(orderID)})
            resolve(order)
        })
           
           
    
        
    },



    cancelOrderProducts: (orderID) => {
        console.log('order Id')
        console.log(orderID);
        return new Promise(async (resolve, reject) => {
            console.log(orderID);
            await db.get().collection(collectionNames.ORDER_COLLLECTION)
                .updateOne({ _id: objectId(orderID) }, {
                    $set: { status: 'Canceled' }
                }).then(() => {
                    resolve()
                })

        })

    },
    addAddress:(address,user)=>{
        return new Promise(async(resolve,reject)=>{


            // let index= await db.get().collection(collectionNames.USER_COLLECTION).aggregate([{
            //     $match:{_id:objectId(user._id)}
            // },
            //     {
            //        $project: {
            //           ArraySize:  {$size:'$address'}
            //        }
            //     }
            //  ] ).toArray()

            //  size=index[0].ArraySize
            
            //  console.log(size,'finalsize')

            //  address.indexNum=size;
            address.key=uuidv4(); 


             db.get().collection(collectionNames.USER_COLLECTION)
                        .updateOne({ _id: objectId(user._id) }, {

                            $push: { address: address }

                        })
        })  
    },
    
    getAllAddress:(user)=>{
        return new Promise(async(resolve,reject)=>{
            allAddress=await db.get().collection(collectionNames.USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(user._id) }
                },
                {
                    $unwind: '$address'
                },
                {
                    $project: {
                        name: '$address.fname',
                        lname: '$address.lname',
                        email: '$address.emailAddress',
                        mobile: '$address.mobileAddress',
                        address1: '$address.address1',
                        address2: '$address.address2',
                        town: '$address.town',
                        zip: '$address.zip',
                        key:'$address.key'
                    }
                }
            ]).toArray()
           resolve(allAddress)
        })
    },
    getAddress:(user,addresskey)=>{
        return new Promise(async(resolve,reject)=>{
          let data= await db.get().collection(collectionNames.USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(user._id) }
                },
                {
                    
                        $unwind: '$address'
                    
                },
                {
                    $project: {
                        fname: '$address.fname',
                        lname: '$address.lname',
                        email: '$address.emailAddress',
                        mobile: '$address.mobileAddress',
                        address1: '$address.address1',
                        address2: '$address.address2',
                        town: '$address.town',
                        zip: '$address.zip',
                        key:'$address.key'
                    }
                },
                {
                    $match:{key:addresskey}
                }
            ]).toArray()
          
            let address= data[0]
                // name:data[0].name,
                // lname:data[0].lname,
                // email:data[0].email,
                // mobile:data[0].mobile,
                // address1:data[0].address1,
                // address2:data[0].address2,
                // town:data[0].town,
                // zip:data[0].zip,
            resolve(address)
        })
    }



}
