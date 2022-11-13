var express = require('express');
const { render, response } = require('../app');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')
var Handlebars = require('handlebars');
var objectId = require('mongodb').ObjectId

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const serviceId = process.env.TWILIO_SERVICE_ID;
const accountSid = 'AC15add6ac693833e1e00f2d600cccf678';
const authToken = '93c96abed3d26a6a22d9ae8e2c021241';
const serviceId = "VA4c79484d8c15cb91629c185adacb4c30";
const client = require('twilio')(accountSid, authToken);


const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AV-7oSISCZlb97v9R7a4kV-15G7LNGUl4r2Ft0CLP3jjT2vIqYzHxejVzfUZUClRYPO0FFErZEzZIJip',
  'client_secret': 'EJ4gileqXDEASVQ_cQcdUSwKnb56QUtIlyesHhB7frr5O8HHFGeag9JB-lfjkodoCuzVf-D_y3OKSakL'
});


//=====================================================================

const verifySession = (req, res, next) => {
  if (req.session.user) {
    next()
  }
  else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {

  let banner;
  const perPage = 16;
  let pageNum;
  let skip;
  let productCount;
  let pages;
  pageNum = parseInt(req.query.page);
  console.log(typeof (pageNum))
  skip = (pageNum - 1) * perPage
  await productHelpers.getProductCount().then((count) => {
    productCount = count;
  })
  pages = Math.ceil(productCount / perPage)

  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
  Handlebars.registerHelper('for', function (from, to, incr, block) {
    var accum = '';
    for (var i = from; i <= to; i += incr)
      accum += block.fn(i);
    return accum;
  });



  await productHelpers.getActiveBanner().then((activeBanner) => {
    banner = activeBanner;
  })
  console.log(banner, 'banner')
  await productHelpers.getAllCategories().then(async (categories) => {

    await productHelpers.getPaginatedProducts(skip, perPage).then((products) => {

      if (req.session.user) {
        userHelpers.getWishlistId(req.session.user._id).then((data) => {

          for (let i = 0; i < products.length; i++) {
            for (let j = 0; j < data.length; j++) {

              if (products[i]._id.toString() == data[j].toString()) {
                products[i].isWishlisted = true;
                console.log(products[i], 'hai');
              }

            }

          }

          let user = req.session.user
          res.render('user/view-products', { products, user, categories, totalDoc: productCount, currentPage: pageNum, pages: pages, banner: banner })
        })
      }
      else {
        res.render('user/view-products', { products, categories, totalDoc: productCount, currentPage: pageNum, pages: pages, banner: banner })
      }
    })
  })

});

router.post('/getSearchResults', async function (req, res, next) {
  let categories;
  let payload = req.body.payload.trim();
  await productHelpers.getAllCategories().then((categoryList) => {
    categories = categoryList;
  })

  await userHelpers.getSearchResults(payload).then((products) => {
    console.log(products, 'products')
    res.render('user/search-results', { products, categories })
  })
});



router.get('/shop-by-category/:name', async function (req, res, next) {
  let categories;
  await productHelpers.getAllCategories().then((categoryList) => {
    categories = categoryList;
  })

  await productHelpers.getProductByCategory(req.params.name).then((products) => {

    categoryName = products[0].category

    res.render('user/view-product-by-category', { products, categoryName, categories })
  })
});

// =============================product details page======================

router.get('/productdetails/:id', function (req, res, next) {
  productHelpers.getProductDetails(req.params.id).then((product) => {
    console.log(product)
    res.render('user/product-details', { product })
  })
});

// ============================================================================

router.get('/login', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/')
  }
  else {
    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr = null;
  }

})

router.post('/signin', function (req, res, next) {
  userHelpers.doLogin(req.body).then((response) => {
    console.log(response.passStatus)
    console.log(response.emailStatus)
    console.log(response.blockStatus)
    if (response.blockStatus && response.passStatus && response.emailStatus) {
      req.session.user = response.user;
      res.redirect('/')
    }
    else {
      req.session.loginErr = response;
      res.redirect('/login')

    }
  })

})


router.get('/registration', function (req, res, next) {
  res.render('user/registration', { errMessage: req.flash('userExists') })
})

router.post('/signup', async function (req, res, next) {
  let userID = 0
  let userData = {}
  await userHelpers.doSignup(req.body).then(async (response) => {
    userID = response.insertedId
    await userHelpers.findUser(userID).then(async (user) => {
      userData = user
      await userHelpers.createWallet(userData._id).then(() => {
        console.log(userData, userID, 'route')
        req.session.user = userData
        res.redirect('/')
      })
    })

  }).catch(() => {
    req.flash('userExists', 'Email or Mobile is Already Registered !')
    res.redirect('/registration')
  })
})


router.get('/logout', function (req, res, next) {
  req.session.user = null;
  res.redirect('/')
})

// ===================== ADD TO CART ================================

router.get('/add-to-cart/:id', verifySession, function (req, res, next) {
  console.log('api called')

  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    console.log(req.params.id)
    console.log(req.session.user)
    res.redirect('/cart')

  })
})

router.get('/cart', verifySession, async function (req, res, next) {

  let products = await userHelpers.getCartProducts(req.session.user._id)
  console.log(products);
  let productsNetAmount = 0
  if (products.length > 0) {
    productsNetAmount = await userHelpers.getTotalAmount(req.session.user._id)
  }

  res.render('user/cart', { products, productsNetAmount, user: req.session.user })
})


// ==================== ADD TO WISHLIST ========================


router.get('/add-to-wishlist/:id', verifySession, function (req, res, next) {
  console.log('api called')
  userHelpers.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.redirect('/')
  })
})

router.get('/wishlist', verifySession, async function (req, res, next) {

  let products = await userHelpers.getWishlistProducts(req.session.user._id)
  console.log(products)
  res.render('user/wishlist', { products, user: req.session.user })
})

router.post('/delete-from-wishlist', verifySession, (req, res, next) => {
  console.log('api called');

  userHelpers.deleteFromWishlist(req.body).then(() => {
    res.json({ status: true })
  })
})

// ===================login otp=====================

// router.get('/login-otp', async function(req, res, next) {

//   res.render('user/otp-login')
// })


router.get('/login-otp', async function (req, res, next) {

  res.render('user/otp-login', { otpSend: req.session.otpSended, numberError: req.session.numberExist, otpErr: req.session.otpError })
  req.session.otpError = null
  req.session.numberExist = null


})

router.post('/send-otp', (req, res) => {

  userHelpers.checkMobileNumber(req.body.phone).then((response) => {
    console.log(req.body.phone)
    if (response) {
      let mobileNumber = (`+91${req.body.phone}`);
      req.session.Phoneno = mobileNumber;
      req.session.mobile = req.body.phone;
      client.verify.v2.services(serviceId)
        .verifications
        .create({ to: mobileNumber, channel: 'sms' })
        .then((verification) => {
          console.log(verification.status);
          req.session.otpSended = true
          res.redirect('/login-otp')
        })

    }
    else {
      req.session.numberExist = "Could not find any user with this Number!"
      console.log('numberExist')
      res.redirect('/login-otp')
    }



    //  
    // }
  })
})


router.get('/resend-otp', (req, res) => {
  let mobileNumber = req.session.Phoneno
  client.verify.v2.services(serviceId)
    .verifications
    .create({ to: mobileNumber, channel: 'sms' })
    .then((verification) => {
      console.log(verification.status);
      req.session.otpSended = true
      res.redirect('/login-otp')
    }).catch((err) => {
      console.log(err, 'err')
    })
})




router.post('/confirm-otp', (req, res) => {
  userHelpers.checkMobileNumber(req.session.mobile).then((response) => {
    let mobileNumber = req.session.Phoneno
    let otp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4 + req.body.digit5 + req.body.digit6;
    console.log(otp)
    client.verify.v2.services(serviceId)
      .verificationChecks
      .create({ to: mobileNumber, code: otp })
      .then((verification_check) => {
        console.log(verification_check.status)
        if (verification_check.status == 'approved') {
          console.log('otp approved')
          req.session.user = response
          res.redirect('/')
        } else {
          console.log('otp rejected')
          req.session.otpSended = true
          req.session.otpError = "Invalid OTP!"
          res.redirect('/login-otp')
        }
      })

  })

})

router.post('/change-product-quantity', verifySession, async (req, res, next) => {
  if (req.body.count == 0) {
    console.log(req.body)
    res.json({ zero: true })
  }
  else {
    let availableQty;
    await productHelpers.getProductQuantity(req.body).then((qty) => {
      console.log(qty, 'qty,', req.body.count)
      availableQty = qty
    })

    if (parseInt(req.body.count) <= parseInt(availableQty)) {

      await userHelpers.changeProductQuantity(req.body).then(async (response) => {
        // response.productsNetAmount=await userHelpers.getTotalAmount(req.session.user)
        response.productsNetAmount = await userHelpers.getTotalAmount(req.body.user)
        res.json(response)
      })
    }
    else {
      let responseObj = {}
      responseObj.availableQty = availableQty
      responseObj.status = false
      res.json(responseObj)
    }
  }


})

router.post('/delete-from-cart', verifySession, (req, res, next) => {
  console.log('api called');

  userHelpers.deleteFromCart(req.body).then(() => {
    res.json({ status: true })
  })
})

router.get("/proceed-to-checkout", verifySession, async (req, res, next) => {
  let coupons;
  await productHelpers.getAllCoupons(4).then(async (couponData) => {
    coupons = couponData;
  }).catch(() => {
    console.log('there is no coupon/all coupons expired')
  })

  let products = await userHelpers.getCartProducts(req.session.user._id)
  console.log(products, 'checkout');
  let walletObj = {}
  let productsNetAmount = await userHelpers.getTotalAmount(req.session.user._id)
  let proceedWallet = false
  await userHelpers.getWallet(req.session.user).then((wallet) => {
    walletObj = wallet;
  })
  if (productsNetAmount < walletObj.amount) {
    proceedWallet = true
  }
  console.log(proceedWallet, 'proceedWallet')
  userHelpers.getAllAddress(req.session.user).then(async (address) => {

    if (address.length <= 0) {
      res.render('user/checkout', { address, productsNetAmount, user: req.session.user, addressZero: true, wallet: walletObj, proceedWallet, products, coupons })
    }
    else {
      res.render('user/checkout', { address, productsNetAmount, user: req.session.user, wallet: walletObj, proceedWallet, products, coupons })
    }

  })

})

router.post('/place-order', verifySession, async (req, res, next) => {
  if (req.body.flexRadioDefault == 'new') {
    await userHelpers.addAddressFromOrder(req.body, req.session.user)
  }
  console.log('api called')
  console.log(req.body, 'checkout body')
  let products = await userHelpers.getCartProductList(req.body.userID)
  let productsAmount = await userHelpers.getTotalAmount(req.session.user._id)
  let productsNetAmount = 0;
  if (req.body.coupon) {
    await userHelpers.claimCoupon(req.body.coupon).then(async (data) => {
      productsNetAmount = productsAmount - ((productsAmount / 100) * data.discount);
      req.body.couponDiscount = ((productsAmount / 100) * data.discount);
    })
  }
  else {
    productsNetAmount = productsAmount;
  }


  let address = {}
  if (req.body.flexRadioDefault == 'new') {
    address = req.body
  } else {
    await userHelpers.getAddress(req.session.user, req.body.flexRadioDefault).then((data) => {
      address = data
    })
  }
  await userHelpers.placeOrder(req.body, address, products, productsNetAmount).then(async (orderID) => {
    var orderID = orderID;
    if (req.body.selector == 'COD') {
      console.log('cod called')
      res.json({ COD_Success: true })
    }
    if (req.body.selector == 'wallet') {
      await userHelpers.purchaseWithWallet(productsNetAmount, orderID, req.session.user).then(async () => {
        await userHelpers.changePaymentStatus(orderID).then(() => {
          res.json({ COD_Success: true })
        })
      })
    }
    if (req.body.selector == 'razorpay') {
      await userHelpers.generateRazorpay(orderID, productsNetAmount).then((response) => {
        response.razorpayMethod = true
        res.json(response)
      })
    }

    if (req.body.selector == 'paypal') {
      console.log('paypal called');


      var payment = {
        "intent": "authorize",
        "payer": {
          "payment_method": "paypal",
        },

        "redirect_urls": {
          "return_url": "http://localhost:3000/order-success",
          "cancel_url": "http://127.0.0.1:3000/err"
        },
        "transactions": [{
          "amount": {
            "total": productsNetAmount,
            "currency": "USD"
          },
          "description": " Paid Through Paypal "
        }]
      }


      userHelpers.createPay(payment)
        .then((transaction) => {
          var id = transaction.id;
          var links = transaction.links;
          var counter = links.length;
          while (counter--) {
            if (links[counter].method == 'REDIRECT') {
              console.log(links[counter], 'counterandlink')
              // redirect to paypal where user approves the transaction
              transaction.readyToRedirect = true;
              transaction.redirectLink = links[counter].href
              transaction.orderID = orderID
              console.log(payment)

              // return res.redirect(links[counter].href)
              userHelpers.changePaymentStatus(orderID).then(() => {
                console.log('status changed')
                res.json(transaction)
              })

            }
          }
        })
        .catch((err) => {
          console.log(err);
          res.redirect('/err');
        });
    }


  })
})

// error page 
router.get('/err', (req, res) => {
  console.log(req.query);
  res.send('/err.html');
})

router.post('/verify-payment', verifySession, (req, res, next) => {
  console.log('payment verify called', req.body)
  userHelpers.verifyPayment(req.body).then(() => {
    console.log('payment verified')
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('status changed')
      res.json({ Razor_status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsg: '' })
  })

})



router.get("/order-success", verifySession, async (req, res, next) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let order = orders[0]
  res.render('user/order-confirmation', { user: req.session.user, order })
})


router.get("/orders", verifySession, async (req, res, next) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders })
})

router.get("/view-order-products/:id", verifySession, async (req, res, next) => {
  let orderProducts = await userHelpers.getOrderProducts(req.params.id)
  await userHelpers.getOrderStatus(req.params.id).then((order) => {
    console.log(order.status, orderProducts, 'order-orderProducts')
    let orderStatus = order.status
    if (orderStatus == 'Placed') {
      console.log(orderStatus, 'orderstatus')
      console.log('placed called')
      res.render('user/view-order-products', { user: req.session.user, orderProducts, Placed: true, order: order })
    }
    if (orderStatus == 'Shipped') {
      res.render('user/view-order-products', { user: req.session.user, orderProducts, Shipped: true, order: order })
    }
    if (orderStatus == 'Canceled') {
      console.log('canceled called')
      res.render('user/view-order-products', { user: req.session.user, orderProducts, Canceled: true, order: order })
    }
    if (orderStatus == 'Delivered') {
      res.render('user/view-order-products', { user: req.session.user, orderProducts, Delivered: true, order: order })

    }
    if (orderStatus == 'Return Requested') {
      res.render('user/view-order-products', { user: req.session.user, orderProducts, Return: true, order: order })
    }


  })

})

router.get("/cancel-order-products/:id", verifySession, async (req, res, next) => {

  console.log('order Id')
  console.log(req.params.id)
  await userHelpers.cancelOrderProducts(req.params.id).then(() => {

    res.redirect('/orders')
  })


})
//sssssssssssssssssssssssssssssssssssssssssss


router.get("/user-profile", verifySession, async (req, res, next) => {
  let walletObj = {}
  userHelpers.getWallet(req.session.user).then((wallet) => {
    walletObj = wallet;
  })
  userHelpers.getAllAddress(req.session.user).then((address) => {
    console.log(address)
    console.log(walletObj, 'walletobj')
    res.render('user/user-profile', { address, user: req.session.user, deleteStatus: req.flash('deleteStatus'), passChangeSuccess: req.flash('updateStatusSuccess'), passChangeFail: req.flash('updateStatusFail'), wallet: walletObj })
  })


})

router.post("/change-password", verifySession, async (req, res, next) => {

  userHelpers.changePassword(req.body).then(() => {
    req.flash('updateStatusSuccess', 'Sussessfully updated')
    res.redirect('/user-profile')
  }).catch(() => {
    req.flash('updateStatusFail', 'Password cannot be matched')
    res.redirect('/user-profile')
  })

})

router.post("/add-address", verifySession, async (req, res, next) => {

  userHelpers.addAddress(req.body, req.session.user)

  res.redirect('/user-profile')
})

router.get("/delete-address/:id", verifySession, async (req, res, next) => {
  userHelpers.deleteAddress(req.params.id, req.session.user).then(() => {
    req.flash('deleteStatus', 'deleted')
    res.redirect('/user-profile')
  })


})


router.post("/return-product", verifySession, async (req, res, next) => {
  await userHelpers.changeOrderStatus(req.body.orderID, req.session.user)
  console.log(req.body)
  console.log('api called')
  res.json({ success: true })
})

router.post("/claim-referal", verifySession, async (req, res, next) => {
  await userHelpers.claimReferal(req.body.referalID, req.session.user).then(() => {
    res.json({ success: true })
  }).catch(() => {
    res.json({ success: false })

  })


})

router.post("/claim-coupon", verifySession, async (req, res, next) => {
  userHelpers.claimCoupon(req.body.coupon).then(async (data) => {
    let productsNetAmount = await userHelpers.getTotalAmount(req.session.user._id)
    let discountDeduction = ((productsNetAmount / 100) * data.discount)
    let finalAmount = productsNetAmount - ((productsNetAmount / 100) * data.discount);
    console.log(finalAmount)
    data.success = true
    data.finalAmount = finalAmount;
    data.discountDeduction = discountDeduction;
    res.json(data)
  }).catch(() => {
    res.json({ success: false })
  })
})

module.exports = router; 