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

const paypal = require('paypal-rest-sdk');



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

            userData.address = ['sample Address']
            userData.isBlocked = false;
            userData.password = await bcrypt.hash(userData.password, 10)
            await db.get().collection(collectionNames.USER_COLLECTION).insertOne(userData).then(async (data) => {
                resolve(data)
            })
        })

    },

    findUser: (id) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collectionNames.USER_COLLECTION).findOne({ _id: objectId(id) })
            console.log(user, 'helper')
            resolve(user)
        })
    },
    createWallet: (id) => {
        return new Promise(async (resolve, reject) => {

            let walletObj = {
                user: id,
                amount: 0.00,
                transactions: [''],
                referalClaimed: false
            }
            await db.get().collection(collectionNames.WALLET_COLLECTION).insertOne(walletObj).then(() => {

            })
            resolve()
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
                if (productExists != -1) {
                    db.get().collection(collectionNames.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) }, {
                        $pull: { products: { item: objectId(productId) } }
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
    getWishlistId: (user) => {
        return new Promise(async (resolve, reject) => {
            let wishListItems = await db.get().collection(collectionNames.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(user) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        _id: 0

                    }
                },
                // {
                //     $project: {
                //         item: 1,
                //     }
                // }


            ]).toArray()

            finalArray = wishListItems.map(function (obj) {
                return obj.item;
            });
            resolve(finalArray)

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

    addToCart: async (productId, userId) => {
        let name;
        let price;
        let MRP;
        await db.get().collection(collectionNames.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((data) => {
            name = data.name
            price = data.price
            MRP=data.MRP
        })
        let productObject = {
            item: objectId(productId),
            quantity: 1,
            name: name,
            price: price,
            MRP:MRP
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
                        quantity: '$products.quantity',
                        name: '$products.name',
                        MRP:'$products.MRP'
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
                        item: 1, quantity: 1, name: 1, price: 1,MRP:1, product: { $arrayElemAt: ['$product', 0] }
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
                        item: 1, quantity: 1, name: 1, price: 1, product: { $arrayElemAt: ['$product', 0] }
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
    placeOrder: (order, address, products, productsNetAmount) => {
        
        return new Promise((resolve, reject) => {
            let status = order.selector === 'COD' ? 'Placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    name: address.fname + ' ' + address.lname,
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
                date: moment().format('Do MMM  YY, hh:mm a'),
                created: new Date(Date.now())
            }
            if(order.coupon){
                orderObj.couponApplied=true
                orderObj.coupon=order.coupon;
                orderObj.couponDiscount=order.couponDiscount;
            }

            db.get().collection(collectionNames.ORDER_COLLLECTION).insertOne(orderObj).then((response) => {
                resolve(response.insertedId)
                db.get().collection(collectionNames.CART_COLLECTION).deleteOne({ user: objectId(order.userID) }) //deleting product from cart after order
            })
        })
    },
    purchaseWithWallet: (amount, orderID, user) => {
        let transactionObj = {
            transactionDesccription: "Product Purchase",
            transactionAmount: amount,
            transactionType: 'Debit',
            transactionDate: moment().format('Do MMM  YY, hh:mm a'),
        }
        let price = parseInt(amount)
        console.log(price)

        return new Promise(async (resolve, reject) => {
            db.get().collection(collectionNames.WALLET_COLLECTION).updateOne({
                user: objectId(user._id)
            }, {
                $inc: { amount: -price },
                $push: { transactions: transactionObj }
            })
            resolve()
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

    createPay: (payment) => {
        return new Promise((resolve, reject) => {
            paypal.payment.create(payment, function (err, payment) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(payment);
                }
            });
        });
    },

    getUserOrders: (userID) => {
        return new Promise(async (resolve, reject) => {
            console.log(userID);
            let orders = await db.get().collection(collectionNames.ORDER_COLLLECTION)
                .find({ userID: objectId(userID) }).toArray()
            console.log(orders);
            resolve(orders.reverse())


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
                        quantity: '$products.quantity',
                        MRP:'$products.MRP'
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
                        item: 1, quantity: 1,MRP:1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }


            ]).toArray()
            resolve(orderItems)
        })
    },
    getOrderStatus: (orderID) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collectionNames.ORDER_COLLLECTION).findOne({ _id: objectId(orderID) })
            resolve(order)
        })
    },



    cancelOrderProducts: (orderID) => {
        console.log('order Id')
        console.log(orderID);
        return new Promise(async (resolve, reject) => {
            console.log(orderID);
            let order = await db.get().collection(collectionNames.ORDER_COLLLECTION).findOne({ _id: objectId(orderID) })
            function returnMoney(order) {
                let refundMoney = order.productsNetAmount;
                let transactionObj = {
                    transactionDesccription: "Refund from Product Cancellation",
                    transactionAmount: refundMoney,
                    transactionType: 'Credit',
                    transactionDate: moment().format('Do MMM  YY, hh:mm a'),
                }

                db.get().collection(collectionNames.WALLET_COLLECTION).updateOne({ user: objectId(order.userID) }, {
                    $inc: { amount: refundMoney },
                    $push: { transactions: transactionObj }
                })



            }
            if (order.paymentMethod == 'razorpay') {
                returnMoney(order);
            }
            if (order.paymentMethod == 'wallet') {
                returnMoney(order);
            }
            if (order.paymentMethod == 'paypal') {
                returnMoney(order);
            }

            await db.get().collection(collectionNames.ORDER_COLLLECTION)
                .updateOne({ _id: objectId(orderID) }, {
                    $set: { status: 'Canceled' }
                }).then(() => {
                    resolve()
                })

        })

    },
    addAddressFromOrder: (address, user) => {
        return new Promise(async (resolve, reject) => {
            let addressObj = {}

            addressObj.fname = address.fname
            addressObj.lname = address.lname
            addressObj.emailAddress = address.email
            addressObj.mobileAddress = address.mobile
            addressObj.address1 = address.address1
            addressObj.address2 = address.address2
            addressObj.town = address.town
            addressObj.key = uuidv4();
            addressObj.zip = address.zip

            await db.get().collection(collectionNames.USER_COLLECTION)
                .updateOne({ _id: objectId(user._id) }, {

                    $push: { address: addressObj }

                })
            resolve()
        })


    },
    addAddress: (address, user) => {
        return new Promise(async (resolve, reject) => {


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
            address.key = uuidv4();


            await db.get().collection(collectionNames.USER_COLLECTION)
                .updateOne({ _id: objectId(user._id) }, {

                    $push: { address: address }

                })
            resolve()
        })
    },

    getAllAddress: (user) => {
        return new Promise(async (resolve, reject) => {
            allAddress = await db.get().collection(collectionNames.USER_COLLECTION).aggregate([
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
                        key: '$address.key'
                    }
                }
            ]).toArray()
            await allAddress.shift()
            resolve(allAddress)
        })
    },
    getAddress: (user, addresskey) => {
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collectionNames.USER_COLLECTION).aggregate([
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
                        key: '$address.key'
                    }
                },
                {
                    $match: { key: addresskey }
                }
            ]).toArray()

            let address = data[0]
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
    },
    deleteAddress:(addressID,user)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collectionNames.USER_COLLECTION).updateOne({_id:objectId(user._id)},{
                $pull: { address: { key: addressID } }
            })
            resolve()
        })
    },


    changeOrderStatus: (orderID) => {

        return new Promise(async (resolve, reject) => {
            await db.get().collection(collectionNames.ORDER_COLLLECTION).updateOne({
                _id: objectId(orderID)
            }, {
                $set: { status: 'Return Requested' }
            })
            resolve()
        })


    },

    claimReferal: (referalID, user) => {
        return new Promise(async (resolve, reject) => {
            let referedUser = await db.get().collection(collectionNames.USER_COLLECTION).findOne({ mobile: referalID })
            if (referedUser) {
                let transactionObjReferedUser = {
                    transactionDesccription: "Referal Reward",
                    transactionAmount: 50,
                    transactionType: 'Credit',
                    transactionDate: moment().format('Do MMM  YY, hh:mm a'),
                }
                let transactionObjUser = {
                    transactionDesccription: "Referal Reward",
                    transactionAmount: 25,
                    transactionType: 'Credit',
                    transactionDate: moment().format('Do MMM  YY, hh:mm a'),
                }
                await db.get().collection(collectionNames.WALLET_COLLECTION).updateOne({
                    user: objectId(referedUser._id)
                }, {
                    $inc: { amount: 50 },
                    $push: { transactions: transactionObjReferedUser }
                })
                await db.get().collection(collectionNames.WALLET_COLLECTION).updateOne({
                    user: objectId(user._id)
                }, {
                    $set: { referalClaimed: true },
                    $inc: { amount: 25 },
                    $push: { transactions: transactionObjUser }
                })
                resolve()
            }
            reject()
        })
    },
    getWallet: (user) => {
        return new Promise(async (resolve, reject) => {
            let userWallet = await db.get().collection(collectionNames.WALLET_COLLECTION).findOne({ user: objectId(user._id) })
            userWallet.transactions = userWallet.transactions.reverse()
            resolve(userWallet)
        })
    },
    claimCoupon: (couponCode) => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collectionNames.COUPON_COLLECTION).findOne({ coupon: couponCode })
            if (coupon) {
                resolve(coupon)
            }
            else {
                reject(coupon)
            }
        })
    },
    getSearchResults:(payload)=>{
        return new Promise(async(resolve,reject)=>{
           let products= await db.get().collection(collectionNames.PRODUCT_COLLECTION).find({name:{$regex:new RegExp('^'+payload+'.*','i')}}).toArray()
   
           if(products){
            let sliced=products.slice(0,10)
           console.log((sliced,'sliced'));
           }
           
            resolve(products)
        })
    }

}
